"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Plus, Search, FileText, Download, Users, GraduationCap, Calendar, TrendingUp, Info, RefreshCw,Edit, ChevronLeft, ChevronRight, FileSpreadsheet,} from "lucide-react";
import AffectationModal from "../affectations/AffectationModal";
import RecouvrementModal from "../recouvrements/RecouvrementModal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DashboardLayout from "../dashboard/layout";
import { toast } from "react-hot-toast";
import Select from "react-select";
import type { GroupBase, OptionProps, SingleValueProps } from "react-select";

// ---------- Types ----------
interface EleveDetails {
    id?: number; // au cas où l’API le fournit
    fullname?: string;
    matricule?: string;
    genre?: string;
    sexe?: string;
    jour_naissance?: number;
    mois_naissance?: number;
    annee_naissance?: number;
    lieu_naissance?: string;
}

interface Affectation {
    id: number;
    eleve_details?: EleveDetails;
    classe_nom?: string;
    annee_nom?: string;
    niveau_classe?: string;
    option_classe?: string;
    etat_aff?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    refreshList: () => void;
    selectedAffectation?: any;
    initialEleveId?: number | null;
    onOpenRecouvrement?: (recouvrement: any) => void;
}

// ---------- Utils ----------
function toInt(value: any): number | null {
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : null;
}

// ---------- Page ----------
export default function AffectationsPage() {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api" || "http://127.0.0.1:8000/api" || "http://beapc:8000/api";

    // Données
    const [affectations, setAffectations] = useState<Affectation[]>([]);
    // États modals
    const [isModalOpen, setIsModalOpen] = useState(false); // bouton "Nouvelle Affectation"
    const [isRecOpen, setIsRecOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedAff, setSelectedAff] = useState<Affectation | null>(null);
    const [isAffOpen, setIsAffOpen] = useState(false);
    const [selectedRecouvrement, setSelectedRecouvrement] = useState<any>(null);

    // --- Recouvrements par id_affectation ---
    const [recAffectationIds, setRecAffectationIds] = useState<Set<number>>(new Set());

    // Filtres
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAnnee, setFilterAnnee] = useState("");
    const [filterClasse, setFilterClasse] = useState("");
    const [filterNiveau, setFilterNiveau] = useState("");
    const [filterOption, setFilterOption] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Choix niveau/option
    const NIVEAU_CHOIX = [
        { value: "cre", label: "Crèche" },
        { value: "mat", label: "Maternel" },
        { value: "pri", label: "Primaire" },
        { value: "clg", label: "Collège" },
        { value: "lyc", label: "Lycée" },
        { value: "aut", label: "Autres" },
    ];
    const OPTION_CHOIX = [
        { value: "se", label: "Sciences Expérimentales" },
        { value: "sm", label: "Sciences Maths" },
        { value: "ss", label: "Sciences Scociales" },
        { value: "sc", label: "Scientifiques" },
        { value: "lit", label: "Littéraires" },
        { value: "aut", label: "Autres" },
    ];

    const getNiveauLabel = (value?: string) => {
        if (!value) return value as any;
        return NIVEAU_CHOIX.find((n) => n.value === value)?.label ?? value;
    };

    const getOptionLabel = (value?: string) => {
        if (!value) return value as any;
        return OPTION_CHOIX.find((o) => o.value === value)?.label ?? value;
    };

    // ---------- Fetch ----------
    const fetchAffectations = async () => {
        try {
            const res = await axios.get(`${API}/affectations/`);
            setAffectations(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement des affectations");
        }
    };

    const fetchRecouvrements = async () => {
        try {
            const res = await axios.get(`${API}/recouvrements/`);
            const ids = new Set<number>();

            // On extrait l'id d'affectation depuis plusieurs formes possibles
            (res.data ?? []).forEach((r: any) => {
        
                const affId =
                    typeof r?.id_affectation === "number" ? r.id_affectation :
                    typeof r?.affectation_id === "number" ? r.affectation_id :
                    typeof r?.affectation === "number" ? r.affectation :
                    typeof r?.affectation?.id === "number" ? r.affectation.id :
                    null;

                if (Number.isFinite(affId)) ids.add(affId as number);
            }
        );
            setRecAffectationIds(ids);
        } catch (error) { console.error(error); toast.error("Erreur lors du chargement des recouvrements"); } 
    };

    // Chargement initial
    useEffect(() => {
        fetchAffectations();
        fetchRecouvrements(); // pour disposer immédiatement des points vert/rouge
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Filtres + recherche ----------
    const filteredData = useMemo(() => {
        return affectations.filter((aff: Affectation) => {
            const matchesSearch =
                (aff.eleve_details?.fullname ?? "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
                (aff.eleve_details?.matricule ?? "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            const matchesAnnee = filterAnnee ? aff.annee_nom === filterAnnee : true;
            const matchesClasse = filterClasse ? aff.classe_nom === filterClasse : true;
            const matchesNiveau = filterNiveau ? aff.niveau_classe === filterNiveau : true;
            const matchesOption = filterOption ? aff.option_classe === filterOption : true;

            return matchesSearch && matchesAnnee && matchesClasse && matchesNiveau && matchesOption;
        });
    }, [affectations, searchTerm, filterAnnee, filterClasse, filterNiveau, filterOption]);

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    // ---------- Stats ----------
    const stats = useMemo(
        () => ({
            total: filteredData.length,
            nouveaux: filteredData.filter((a) => a.etat_aff?.toLowerCase() === "nouv").length,
            admis: filteredData.filter((a) => a.etat_aff?.toLowerCase() === "adm").length,
            redoublants: filteredData.filter((a) => a.etat_aff?.toLowerCase() === "red").length,
            cdt: filteredData.filter((a) => a.etat_aff?.toLowerCase() === "cdt").length,
            autres: filteredData.filter((a) => a.etat_aff?.toLowerCase() === "aut").length,
            classes: new Set(filteredData.map((a) => a.classe_nom)).size,
        }),
        [filteredData]
    );

    // ---------- Exports ----------
    const exportExcel = () => {
        const data = filteredData.map((a) => ({
            Matricule: a.eleve_details?.matricule,
            Eleve: a.eleve_details?.fullname,
            Sexe: a.eleve_details?.genre ?? a.eleve_details?.sexe,
            Classe: a.classe_nom,
            Année: a.annee_nom,
            Statut: a.etat_aff,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Affectations");
        XLSX.writeFile(wb, "Affectations.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const logoUrl = "/Sans titre-2.jpg";

        const drawFixedStructure = (pdfDoc: jsPDF) => {
            try {
                (pdfDoc as any).saveGraphicsState?.();
                (pdfDoc as any).setGState?.(new (pdfDoc as any).GState({ opacity: 0.1 }));
                pdfDoc.addImage(logoUrl, "JPEG", pageWidth / 2 - 75, pageHeight / 2 - 75, 150, 150);
                (pdfDoc as any).restoreGraphicsState?.();
            } catch {}
            pdfDoc.setFontSize(9);
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.text("MEPUA", 10, 10);
            pdfDoc.text("DCE : MATOTO", 10, 15);
            pdfDoc.text("IRE : CONAKRY", 10, 20);
            pdfDoc.text("REPUBLIQUE DE GUINEE", pageWidth - 10, 10, { align: "right" });
            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text("Travail - Justice - Solidarité", pageWidth - 10, 15, { align: "right" });
            try {
                pdfDoc.addImage(logoUrl, "JPEG", pageWidth / 2 - 12, 5, 24, 24);
            } catch {}
                pdfDoc.setDrawColor(0);
                pdfDoc.line(10, 30, pageWidth - 10, 30);
                pdfDoc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);
                pdfDoc.setFontSize(8);
                pdfDoc.text("Grupo Scolaire ECO1 - Matoto - Conakry", 10, pageHeight - 15);
                pdfDoc.text("Page " + (pdfDoc as any).internal.getNumberOfPages(), pageWidth - 10, pageHeight - 15,{ align: "right" });
            };

            // Grouper par Année + Classe
            const groupes = filteredData.reduce((acc: Record<string, Affectation[]>, curr) => {
                const annee = curr.annee_nom ?? "Année Inconnue";
                const classe = curr.classe_nom ?? "Sans Classe";
                const cle = `${annee} - ${classe}`;
                if (!acc[cle]) acc[cle] = [];
                acc[cle].push(curr);
                return acc;
            }, {});

            const listeCles = Object.keys(groupes);

            const formatDateNaissance = (details: EleveDetails | undefined) => {
                const j = details?.jour_naissance;
                const m = details?.mois_naissance;
                const a = details?.annee_naissance;
                const lieu = details?.lieu_naissance ? ` à ${details.lieu_naissance}` : "";

                if (((!a || a === 0) && (!m || m === 0) && (!j || j === 0)) || a === undefined) return "N/A";

                let dateFormatee = "";
                if (j === 0 && m === 0) { dateFormatee = `${a}`;} 
                else if (j === 0) { const moisPadded = (m ?? 0).toString().padStart(2, "0"); dateFormatee = `${moisPadded}/${a}`;} 
                else {
                    const jourPadded = (j ?? 0).toString().padStart(2, "0");
                    const moisPadded = (m ?? 0).toString().padStart(2, "0");
                    dateFormatee = `${jourPadded}/${moisPadded}/${a}`;
                }
                return `${dateFormatee}${lieu}`;
            };

        // Boucler sur les groupes
        listeCles.forEach((cle, index) => {
            const donneesGroupe = groupes[cle];
            const total = donneesGroupe.length;
            const garcons = donneesGroupe.filter((a) => a.eleve_details?.genre === "M" || a.eleve_details?.sexe === "M").length;
            const filles = donneesGroupe.filter((a) => a.eleve_details?.genre === "F" || a.eleve_details?.sexe === "F").length;
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(cle, pageWidth / 2, 40, { align: "center" });
            autoTable(doc, {
                startY: 45,
                head: [["Matricule", "Nom Complet", "Sexe", "Statut", "Date et Lieu de Naissance"]],
                body: donneesGroupe.map((a) => [
                    a.eleve_details?.matricule ?? "-",
                    a.eleve_details?.fullname ?? "-",
                    a.eleve_details?.sexe ? a.eleve_details.sexe : "-",
                    a.etat_aff ?? "-",
                    formatDateNaissance(a.eleve_details),
                ]),
                theme: "grid",
                headStyles: { fillColor: [37, 99, 235] },
                didDrawPage: () => drawFixedStructure(doc),
            });
            let finalY = (doc as any).lastAutoTable.finalY + 15;
            if (finalY > pageHeight - 60) {
                doc.addPage();
                drawFixedStructure(doc);
                finalY = 40;
            }
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            const colWidth = (pageWidth - 20) / 4;
            doc.text(`TOTAL : ${total}`, 15, finalY);
            doc.text(`GARCONS : ${garcons}`, 15 + colWidth, finalY);
            doc.text(`FILLES : ${filles}`, 15 + colWidth * 2, finalY);
            doc.text(`AUTRES : ${total - garcons - filles}`, 15 + colWidth * 3, finalY);
            doc.setFontSize(12);
            doc.text("LA DIRECTION", pageWidth / 2, finalY + 25, { align: "center" });
            const textW = doc.getTextWidth("LA DIRECTION");
            doc.line(pageWidth / 2 - textW / 2, finalY + 26, pageWidth / 2 + textW / 2, finalY + 26);
            if (index < listeCles.length - 1) doc.addPage();
        });
        doc.save("Rapport_Eco1_Global.pdf");
    };

    // ---------- Navigation modals ----------
    const openRecouvrementFromAff = (recouvrement: any) => {
        setSelectedRecouvrement(recouvrement);
        setIsAffOpen(false);
        setTimeout(() => setIsRecOpen(true), 80);
    };

    const handleOpenAffModal = (aff: Affectation | null = null) => {
        setSelectedAff(aff);
        setIsAffOpen(true);
    };

    const handleCloseAffModal = () => {
        setIsAffOpen(false);
        setSelectedAff(null);
    };

    // ---------- Dot + Select custom ----------
    type EleveOption = { value: string; label: string; __eleveId: number };

    const Dot: React.FC<{ color: "green" | "red" }> = ({ color }) => (
        <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                color === "green" ? "bg-emerald-500" : "bg-rose-500"
            }`}
            aria-hidden="true"
        />
    );

    const EleveOptionRow: React.FC<OptionProps<EleveOption, false, GroupBase<EleveOption>>> = (props) => {
        const { data, innerRef, innerProps, isFocused, selectProps } = props;
        const hasRec = (selectProps as any).__hasRecouvrement?.(data.__eleveId) ?? false;
        return (
            <div ref={innerRef} {...innerProps} className={`px-3 py-2 flex items-center cursor-pointer ${isFocused ? "bg-zinc-100" : ""}`} >
                <Dot color={hasRec ? "green" : "red"} />
                <span className="text-sm">{data.label}</span>
            </div>
        );
    };

    const EleveSingleValue: React.FC< SingleValueProps<EleveOption, false, GroupBase<EleveOption>>> = (props) => {
        const { data, innerProps, selectProps } = props;
        const hasRec =
        (selectProps as any).__hasRecouvrement?.(data.__eleveId) ?? false;
        return (
            <div {...innerProps} className="flex items-center">
                <Dot color={hasRec ? "green" : "red"} />
                <span>{data.label}</span>
            </div>
        );
    };

    // ---------- Render ----------
    return (
        <DashboardLayout>
            <div className="p-1 space-y-3">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Affectations</h1>
                        <p className="text-sm text-slate-500 font-medium">
                        Gestion des inscriptions par classe
                        </p>
                    </div>
                    <button onClick={() => { setSelectedAff(null); setIsModalOpen(true);setIsAffOpen(true);}}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all"
                    >
                        <Plus size={18} /> Nouvelle Affectation
                    </button>
                </div>

                {/* CARTES STATISTIQUES */}
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl-cols-7 xl:grid-cols-7 gap-2">
                    <StatCard title="Total" value={stats.total} icon={<Users size={20} className="text-blue-600" />} color="bg-blue-50"/>
                    <StatCard title="Nouveaux" value={stats.nouveaux} icon={<TrendingUp size={20} className="text-emerald-600" />} color="bg-emerald-50"/>
                    <StatCard title="Admis" value={stats.admis} icon={<GraduationCap size={20} className="text-orange-600" />} color="bg-orange-50"/>
                    <StatCard title="Redoublants" value={stats.redoublants} icon={<RefreshCw size={20} className="text-amber-600" />} color="bg-amber-50"/>
                    <StatCard title="CDT" value={stats.cdt} icon={<Calendar size={20} className="text-purple-600" />} color="bg-purple-50"/>
                    <StatCard title="Autres" value={stats.autres} icon={<Info size={20} className="text-slate-600" />} color="bg-slate-50"/>
                    <StatCard title="Classes" value={stats.classes} icon={<GraduationCap size={20} className="text-purple-600" />} color="bg-purple-50" />
                </div>

                {/* BARRE DE RECHERCHE ET FILTRES */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input type="text" placeholder="Rechercher..." onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>

                    {/* Filtre Année */}
                    <select className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none" onChange={(e) => setFilterAnnee(e.target.value)}>
                        <option value="">Toutes les années</option>
                        {[...new Set(affectations.map((a) => a.annee_nom))].map((an) => an ? (<option key={an} value={an}>{an}</option> ) : null)}
                    </select>

                    {/* Filtre Niveau */}
                    <select  onChange={(e) => setFilterNiveau(e.target.value)} value={filterNiveau} className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous les niveaux</option>
                        {NIVEAU_CHOIX.map((niv) => (<option key={niv.value} value={niv.value}>{niv.label}</option>))}
                    </select>

                    {/* Filtre Option */}
                    <select className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none"onChange={(e) => setFilterOption(e.target.value)} value={filterOption} >
                        <option value="">Toutes les options</option>
                        {OPTION_CHOIX.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                    </select>

                    {/* Filtre Classe */}
                                        <select className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFilterClasse(e.target.value)} >
                        <option value="">Toutes les classes</option>
                        {[...new Set(affectations.map((a) => a.classe_nom))].map((cl) => cl ? ( <option key={cl} value={cl}> {cl}</option>) : null)}
                    </select>

                    {/* Export Excel et PDF */}
                    <div className="flex items-center gap-2">
                        <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><FileSpreadsheet size={16} /> Excel</button>
                        <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold"><FileText size={16} /> PDF</button>
                    </div>
                </div>

                {/* TABLEAU ET PAGINATION */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Élève</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Classe</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Niveau</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Option</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-center">Statut</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedData.map((aff: Affectation) => (
                                    <tr key={aff.id} className="hover:bg-slate-200/50 transition-colors">
                                        <td className="pl-4 pb-1 pt-1">
                                            <div className="flex items-center gap-2">
                                                <Dot color={recAffectationIds.has(aff.id) ? "green" : "red"} />
                                                <div className="font-bold text-slate-700">{aff.eleve_details?.fullname}</div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono uppercase">{aff.eleve_details?.matricule}</div>
                                        </td>
                                        <td className="pl-4 pb-1 pt-1">
                                            <div className="text-sm font-semibold text-blue-600">{aff.classe_nom}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-medium">{aff.annee_nom}</div>
                                        </td>
                                        <td className="pl-4 pb-1 pt-1">
                                            <div className="text-sm font-medium text-slate-700">{getNiveauLabel(aff.niveau_classe)}</div>
                                        </td>
                                        <td className="pl-4 pb-1 pt-1">
                                            <div className="text-sm font-medium text-slate-700">{getOptionLabel(aff.option_classe)}</div>
                                        </td>
                                        <td className="pl-4 pb-1 pt-1 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase 
                                                ${aff.etat_aff?.toLowerCase() === "nouv" ? "bg-emerald-100 text-emerald-600": "bg-orange-100 text-orange-600" }`}>
                                                {aff.etat_aff}
                                            </span>
                                        </td>
                                        <td className="pl-4 pb-1 pt-1 text-right">
                                            <button onClick={() => handleOpenAffModal(aff)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredData.length === 0 && (
                            <div className="p-20 text-center text-slate-400">Aucune affectation trouvée.</div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="text-xs font-medium text-slate-500">
                            Affichage de {""}
                            <span className="text-slate-800 font-bold">
                                {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                            </span>{" "}
                            à {""}
                            <span className="text-slate-800 font-bold">
                                {Math.min(currentPage * itemsPerPage, filteredData.length)}
                            </span>{" "}
                            sur <span className="text-slate-800 font-bold">{filteredData.length}</span>{" "}
                            affectations
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black border border-blue-100">
                                Page {currentPage} / {totalPages || 1}
                            </div>

                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
                

                {/* MODAL AFFECTATION */}
                <AffectationModal isOpen={isAffOpen} onClose={handleCloseAffModal}
                    refreshList={() => {fetchAffectations(); fetchRecouvrements();}}
                    selectedAffectation={selectedAff} onOpenRecouvrement={openRecouvrementFromAff}
                />

                {/* MODAL RECOUVREMENT */}
                <RecouvrementModal isOpen={isRecOpen} onClose={() => setIsRecOpen(false)}
                    onSuccess={() => {fetchAffectations(); fetchRecouvrements(); }}
                    recouvrement={selectedRecouvrement}
                />
            </div>
            
        </DashboardLayout> 
    );
} 

// ---------- Stat Card ----------
interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}

// Petite carte de statistique utilisée dans le dashboard
function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
      <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{title}</p>
        <p className="text-lg font-black text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}
