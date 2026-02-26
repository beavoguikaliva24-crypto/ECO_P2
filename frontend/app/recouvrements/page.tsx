"use client";

import axios from "axios";
import {Search, FileText, Download, Wallet, CheckCircle2,Edit, MessageCircleWarning, AlertCircle, Trash2, ChevronLeft, ChevronRight,} from "lucide-react";
import DashboardLayout from "../dashboard/layout";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RecouvrementModal from "./RecouvrementModal";
import React, { useState, useEffect, useCallback } from "react";

interface AffectationDetails {
    eleve_fullname: string;
    eleve_matricule: string;
    annee_nom: string;
    classe_lib: string;
}

interface Recouvrement {
    id: string | number;
    frais_paiement: number | string;
    total_paye: number | string;
    affectation_details?: AffectationDetails;
}

/* ====================== Helpers ====================== */
function toNumber(n: number | string | undefined | null): number {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
}

function getStatutPaiementBadge({ total, totalPaye }: { total: number; totalPaye: number }) {
    const reste = Math.max(0, total - totalPaye);

    if (reste <= 0) {
        return (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-black">
                <CheckCircle2 size={12} /> SOLDÉ
            </span>
        );
    }
    if (reste === total) {
        return (
            <span className="inline-flex items-center gap-1 bg-red-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-black">
                <MessageCircleWarning size={12} /> AUCUN PAIEMENT
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-black">
            <AlertCircle size={12} /> EN COURS
        </span>
    );
}

export default function RecouvrementsPage() {
    // --- 1. ÉTATS ---
    const [recouvrements, setRecouvrements] = useState<Recouvrement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAnnee, setFilterAnnee] = useState("");
    const [filterClasse, setFilterClasse] = useState("");
    const [filterStatut, setFilterStatut] = useState("");
    const [selectedRecouvrement, setSelectedRecouvrement] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Pagination (ajout) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // --- 2. FETCH ---
const fetchData = useCallback(async () => {
  setLoading(true);

  // Fallback automatique si la variable NEXT_PUBLIC_API_URL n'est pas définie
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api" || "http://127.0.0.1:8000/api" || "http://beapc:8000/api";

  try {
    const res = await axios.get(`${API_URL}/recouvrements/`);
    const data = res.data?.results ? res.data.results : res.data;
    
    if (Array.isArray(data)) {
      setRecouvrements(data);
    }
  } 
  catch (error) {
    console.error("Erreur lors du chargement", error);
  } 
  finally {
    setLoading(false);
  }
}, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    // --- 3. FILTRAGE ---
    const filteredData = recouvrements.filter((item) => {
        const nomEleve = item.affectation_details?.eleve_fullname || "";
        const annee = item.affectation_details?.annee_nom || "";
        const classe = item.affectation_details?.classe_lib || "";

        const total = toNumber(item.frais_paiement);
        const totalPaye = toNumber(item.total_paye);
        const reste = Math.max(0, total - totalPaye);

        //const matchesSearch = nomEleve.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch =
            nomEleve.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.affectation_details?.eleve_matricule ?? "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesAnnee = filterAnnee === "" || annee === filterAnnee;
        const matchesClasse = filterClasse === "" || classe === filterClasse;

        let matchesStatut = true;
        if (filterStatut === "Aucun_Paiement") matchesStatut = (reste === total);
        if (filterStatut === "en_cours") matchesStatut = reste > 0 && reste !== total;
        if (filterStatut === "termine") matchesStatut = reste <= 0;
        

        return matchesSearch && matchesAnnee && matchesClasse && matchesStatut;
    });

    // --- 3bis. KPIs dérivés sur les données filtrées ---
    const kpi = React.useMemo(() => {
        const count = filteredData.length;
        let totalFrais = 0;
        let totalEncaisse = 0;
        let totalRestant = 0;

        for (const item of filteredData) {
            const total = toNumber(item.frais_paiement);
            const paye = toNumber(item.total_paye);
            totalFrais += total;
            totalEncaisse += paye;
            totalRestant += Math.max(0, total - paye);
        }

        const pctEncaisse = totalFrais > 0 ? totalEncaisse / totalFrais : 0;
        const pctRestant = totalFrais > 0 ? totalRestant / totalFrais : 0;
        return { count, totalFrais, totalEncaisse, totalRestant, pctEncaisse, pctRestant };
    }, [filteredData]);

    // Helper pour pourcentage à 1 décimale
    const fmtPct = (x: number) => `${(Math.round(x * 1000) / 10).toLocaleString()}%`;

    // --- Pagination: calcul pages + slice ---
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    // Reset page à 1 lorsque les filtres/recherche changent
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterAnnee, filterClasse, filterStatut]);

    // --- 4. EXPORTS ---
    /* **************** ECXEL **************** */
    const exportExcel = () => {
        const data = filteredData.map((item) => {
            const total = toNumber(item.frais_paiement);
            const totalPaye = toNumber(item.total_paye);
            const reste = Math.max(0, total - totalPaye);

            return {
            "Élève": item.affectation_details?.eleve_fullname,
            "Classe": item.affectation_details?.classe_lib,
            "Année": item.affectation_details?.annee_nom,
            "Frais": total,
            "Payé": totalPaye,
            "Reste": reste,
            "Statut": reste <= 0 ? "TERMINÉ" : reste === total ? "AUCUN PAIEMENT" : reste > total ? "EN COURS" : "EN COURS", };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Recouvrements");
        XLSX.writeFile(wb, "Recouvrements.xlsx");
    };
    /* **************** PDF **************** */
    const exportPDF = () => {
        const formatNumber = (n: number) =>
        new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
            .format(n)
            // 🔧 On remplace les espaces insécables (U+202F et U+00A0) par un espace normal
            .replace(/\u202F|\u00A0/g, " ");

        const rows = filteredData.map((item) => {
            const total = toNumber(item.frais_paiement);
            const totalPaye = toNumber(item.total_paye);
            const reste = Math.max(0, total - totalPaye);
            return [
                item.affectation_details?.eleve_fullname ?? "",
                item.affectation_details?.classe_lib ?? "",
                item.affectation_details?.annee_nom ?? "",
                formatNumber(total),
                formatNumber(totalPaye),
                formatNumber(reste),
                reste <= 0 ? "TERMINÉ" : reste === total ? "AUCUN PAIEMENT" : "EN COURS",
            ];
        });

        // ⚠️ Retire textEncoding: 'Identity-H' si tu restes sur 'helvetica'
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

        autoTable(doc, {
            head: [["Élève", "Classe", "Année", "Frais", "Payé", "Reste", "Statut"]],
            body: rows,
            styles: { font: "helvetica", fontSize: 8 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255, font: "helvetica" },
        });

        doc.save("Recouvrements.pdf");
    };

    if (loading && recouvrements.length === 0) {
        return <div className="p-10 text-center font-bold text-blue-600 animate-pulse">Chargement des données...</div>;
    }

    const totalEncaisse = recouvrements
        .reduce((acc, curr) => acc + toNumber(curr.total_paye), 0)
        .toLocaleString();

    return (
        <DashboardLayout>
            <div className="p-1 space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Recouvrements</h1>
                        <p className="text-zinc-500">Suivi financier</p>
                    </div>
                </div>

                {/* STATS */} {/* === KPIs MODERNISÉS === */}
                {/* === CARTES KPI RECOUVREMENT === */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2 mb-2">

                    <RecouvrementStatCard title="Recouvrements" value={kpi.count.toLocaleString()} icon={<Search size={20} className="text-blue-600" />} color="bg-blue-50"/>
                    <RecouvrementStatCard title="Total Frais" value={`${kpi.totalFrais.toLocaleString()} FG`} icon={<Wallet size={20} className="text-indigo-600" />} color="bg-indigo-50"/>
                    <RecouvrementStatCard title="Encaissé" value={`${kpi.totalEncaisse.toLocaleString()} FG (${fmtPct(kpi.pctEncaisse)})`} icon={<CheckCircle2 size={20} className="text-emerald-600" />}
                        color="bg-emerald-50" />
                    <RecouvrementStatCard title="Restant" value={`${kpi.totalRestant.toLocaleString()} FG (${fmtPct(kpi.pctRestant)})`} icon={<AlertCircle size={20} className="text-rose-600" />}
                        color="bg-rose-50"/>

                </div>

                {/* BARRE D'ACTIONS */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-zinc-50 w-full md:w-64">
                            <Search size={18} className="text-zinc-500" />
                            <input type="text" placeholder="Nom de l'élève..." className="bg-transparent outline-none text-sm w-full" value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filtre Année */}
                        <select
                            className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterAnnee} onChange={(e) => setFilterAnnee(e.target.value)}
                        >
                            <option value="">Toutes les années</option>
                            {[...new Set(recouvrements.map(item => item.affectation_details?.annee_nom).filter(Boolean))].map((an: any) => (
                                <option key={an} value={an}>{an}</option>
                            ))}
                        </select>

                        {/* Filtre Classe */}
                        <select
                            className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)}
                        >
                            <option value="">Toutes les classes</option>
                            {[...new Set(recouvrements.map(item => item.affectation_details?.classe_lib).filter(Boolean))].map((cl: any) => (
                                <option key={cl} value={cl}>{cl}</option>
                            ))}
                        </select>
                        
                        {/* Filtre Statut */}
                        <select className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                            <option value="">Tous les statuts</option>
                            <option value="Aucun_Paiement">Aucun paiement (Impayés)</option>
                            <option value="en_cours">En cours (Partiels)</option>
                            <option value="termine">Terminés (Soldés)</option>
                        </select>
                    </div>

                    {/* Export Excel et PDF */}
                    <div className="flex items-center gap-2">
                        <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Download size={16} /> Excel</button>
                        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold"><FileText size={16} /> PDF</button>
                    </div>
                </div>

                {/* TABLEAU */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-x-auto overflow-y-auto shadow-sm">
                    <table className="min-w-full divide-y divide-zinc-200 w-full text-left border-collapse">
                        <thead className="bg-zinc-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Élève</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Classe</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 uppercase">Frais</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 uppercase">Payé</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 uppercase">Restant</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 uppercase">Statut</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {paginatedData.map((item) => {
                                const total = toNumber(item.frais_paiement);
                                const totalPaye = toNumber(item.total_paye);
                                const reste = Math.max(0, total - totalPaye);

                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => { setSelectedRecouvrement(item); setIsModalOpen(true); }}
                                        className="hover:bg-blue-50 cursor-pointer transition-colors border-b border-zinc-100"
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900">
                                            <div className="flex flex-col">
                                                <span>{item.affectation_details?.eleve_fullname || "Élève inconnu"}</span>
                                                <span className="text-xs text-zinc-500 font-normal">
                                                    {item.affectation_details?.eleve_matricule || "SANS-MATRICULE"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900">
                                            <div className="flex flex-col">
                                                <span>{item.affectation_details?.classe_lib || "Classe inconnue"}</span>
                                                <span className="text-xs text-zinc-500 font-normal">
                                                {   item.affectation_details?.annee_nom || "SANS-ANNEE"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">{total.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">{totalPaye.toLocaleString()}</td>
                                        <td className={`px-4 py-3 text-sm text-right font-bold ${reste > 0 ? "text-red-600" : "text-emerald-600"}`}>{reste.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatutPaiementBadge({ total, totalPaye })}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg"><Edit size={15} /></button>
                                                <button className="p-1.5 text-red-600 hover:bg-red-50 cursor-pointer rounded-lg"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="text-xs font-medium text-slate-500">
                            Affichage de {" "}
                            <span className="text-slate-800 font-bold">
                                {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                            </span>{" "}
                            à {" "}
                            <span className="text-slate-800 font-bold">
                                {Math.min(currentPage * itemsPerPage, filteredData.length)}
                            </span>{" "}
                            sur {" "}
                            <span className="text-slate-800 font-bold">{filteredData.length}</span>{" "}
                            recouvrements
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black border border-blue-100">
                                Page {currentPage} / {totalPages || 1}
                            </div>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <RecouvrementModal isOpen={isModalOpen} onClose={() => {setIsModalOpen(false);setSelectedRecouvrement(null);}} recouvrement={selectedRecouvrement} onSuccess={fetchData}/>
        </DashboardLayout>
    );
}

function RecouvrementStatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`p-2 rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    {title}
                </p>
                <p className="text-x2 font-black text-slate-800 leading-tight">
                    {value}
                </p>
            </div>
        </div>
    );
}