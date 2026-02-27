/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../dashboard/layout';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, FileSpreadsheet, FileText } from 'lucide-react';
import ScolariteModal from './ScolariteModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ScolaritesPage(){
    const [items, setItems] = useState<any[]>([]);
    const [annees, setAnnees] = useState<any[]>([]);
    const [classesList, setClassesList] = useState<any[]>([]);
    const [niveaux, setNiveaux] = useState<any[]>([]);
    const [optionsList, setOptionsList] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [anneeFilter, setAnneeFilter] = useState('');
    const [classeFilter, setClasseFilter] = useState('');
    const [niveauFilter, setNiveauFilter] = useState('');
    const [optionFilter, setOptionFilter] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [current, setCurrent] = useState<any | null>(null);
    const [page, setPage] = useState(1);
    const perPage = 25;

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    const fetchItems = async () => {
        try {
            const res = await axios.get(`${API}/frais/`);
            setItems(res.data);
            setPage(1);
        } catch (err) { console.error('Erreur chargement scolarités', err); }
    };

    useEffect(() => { fetchItems(); }, []);

    // fetch refs for filters
    useEffect(() => {
        const fetchRefs = async () => {
            try{
                const [aRes, cRes, nRes, oRes] = await Promise.all([
                    axios.get(`${API}/annees/`),
                    axios.get(`${API}/classes/`),
                    axios.get(`${API}/niveaux/`),
                    axios.get(`${API}/options/`),
                ]);
                setAnnees(aRes.data);
                setClassesList(cRes.data);
                setNiveaux(nRes.data);
                setOptionsList(oRes.data);
            }catch(err){ console.error('Erreur fetch refs', err); }
        };
        fetchRefs();
    }, []);

    // helpers to safely read ids and labels from possible payload shapes
    const getAnneeId = (f:any) => {
        if (f == null) return '';
        if (typeof f.annee_fs === 'number' || typeof f.annee_fs === 'string') return String(f.annee_fs);
        if (typeof f.annee_fs === 'object' && f.annee_fs !== null) return String(f.annee_fs.id || f.annee_fs);
        return '';
    };

    const getAnneeLabel = (f:any) => {
        if (!f) return '';
        if (f.annee_libelle) return f.annee_libelle;
        if (f.annee_fs && typeof f.annee_fs === 'object' && f.annee_fs.annee_scolaire) return f.annee_fs.annee_scolaire;
        const id = getAnneeId(f);
        const a = annees.find(a => String(a.id) === id);
        return a?.annee_scolaire || '';
    };

    const getClasseId = (f:any) => {
        if (f == null) return '';
        if (typeof f.classe_fs === 'number' || typeof f.classe_fs === 'string') return String(f.classe_fs);
        if (typeof f.classe_fs === 'object' && f.classe_fs !== null) return String(f.classe_fs.id || f.classe_fs);
        return '';
    };

    const getClasseLabel = (f:any) => {
        if (!f) return '';
        if (f.classe_libelle) return f.classe_libelle;
        if (f.classe_fs && typeof f.classe_fs === 'object' && f.classe_fs.lib_classe) return f.classe_fs.lib_classe;
        const id = getClasseId(f);
        const c = classesList.find((c:any) => String(c.id) === id);
        return c?.lib_classe || '';
    };

    const formatPrice = (v: any) => {
        if (v === null || v === undefined || v === '') return '0';
        const n = Number(v);
        if (Number.isNaN(n)) return String(v);
        return new Intl.NumberFormat('fr-FR').format(n);
    };

    // derive unique niveau/option values from classesList so filter values match stored class fields
    const uniqueNiveaux = useMemo(() => {
        const set = new Set<string>();
        classesList.forEach(c => { if (c?.niveau_classe) set.add(String(c.niveau_classe)); });
        return Array.from(set);
    }, [classesList]);

    const uniqueOptions = useMemo(() => {
        const set = new Set<string>();
        classesList.forEach(c => { if (c?.option_classe) set.add(String(c.option_classe)); });
        return Array.from(set);
    }, [classesList]);

    const getNiveauLabelFromLookup = (val: string) => {
        if (!val) return val;
        const n = niveaux.find((x:any) => String(x.id) === String(val) || String(x.niveau) === String(val));
        return n ? (n.niveau || n.id) : val;
    };

    const getOptionLabelFromLookup = (val: string) => {
        if (!val) return val;
        const o = optionsList.find((x:any) => String(x.id) === String(val) || String(x.option) === String(val));
        return o ? (o.option || o.id) : val;
    };

    // apply client-side filters and search (robust to different payload shapes)
    const filteredItems = items.filter((f:any) => {
        const anneeId = getAnneeId(f);
        const classeId = getClasseId(f);

        if (anneeFilter && String(anneeId) !== String(anneeFilter)) return false;
        if (classeFilter && String(classeId) !== String(classeFilter)) return false;

        if (niveauFilter || optionFilter) {
            const cls = classesList.find((c:any) => String(c.id) === String(classeId));
            // prefer serializer read-only fields if present (classe_niveau / classe_option), fallback to class record
            const niveauVal = f.classe_niveau || cls?.niveau_classe || '';
            const optionVal = f.classe_option || cls?.option_classe || '';
            if (niveauFilter && String(niveauVal) !== String(niveauFilter)) return false;
            if (optionFilter && String(optionVal) !== String(optionFilter)) return false;
        }

        if (search) {
            const s = search.toLowerCase();
            const className = (getClasseLabel(f) || '').toString().toLowerCase();
            const anneeLabel = (getAnneeLabel(f) || '').toString().toLowerCase();
            if (!className.includes(s) && !anneeLabel.includes(s)) return false;
        }
        return true;
    });

    const indexLast = page * perPage;
    const indexFirst = indexLast - perPage;
    const pageItems = filteredItems.slice(indexFirst, indexLast);
    const totalPages = Math.ceil(filteredItems.length / perPage);

    const handleEdit = (it: any) => { setCurrent(it); setIsOpen(true); };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cet enregistrement ?')) return;
        try { await axios.delete(`${API}/frais/${id}/`); fetchItems(); } catch (err) { console.error(err); }
    };

    const exportToExcel = () => {
        const dataToExport = filteredItems.map((f:any) => ({ Annee: getAnneeLabel(f) || '-', Classe: getClasseLabel(f) || '-', Frais: f.frais_annuel, T1: f.t1_fs, T2: f.t2_fs, T3: f.t3_fs }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Frais');
        XLSX.writeFile(workbook, `Frais_Scolarite_${new Date().toLocaleDateString()}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Frais de scolarité', 14, 22);
        doc.setFontSize(11);
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
            autoTable(doc, {
                startY: 35,
                head: [['Année','Classe','Frais','T1','T2','T3']],
                body: filteredItems.map((f:any) => [getAnneeLabel(f) || '-', getClasseLabel(f) || '-', f.frais_annuel || 0, f.t1_fs || 0, f.t2_fs || 0, f.t3_fs || 0]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [37,99,235] }
            });
        doc.save('Frais_Scolarite.pdf');
    };

    return (
        <DashboardLayout>
            {/* Le composant entier est dans DashboardLayout pour conserver le state de pagination et filtres lors de l'ouverture du modal */}
            <div className="p-1 space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Frais de scolarité</h1>
                        <p className="text-sm text-slate-500 font-medium">Gestion des frais annuels par classe et année</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setCurrent(null); setIsOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
                            <Plus size={18}/> Nouveau frais
                        </button>
                    </div>
                </div>
                {/* Filtres et recherche */}
                <div className="bg-white p-2 mb-3 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                    {/* Barre de recherche */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input value={search} onChange={(e)=> setSearch(e.target.value)} placeholder="Rechercher par classe ou année..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    {/* Filtres année */}
                    <select value={anneeFilter} onChange={(e)=> setAnneeFilter(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none">
                        <option value="">Toutes années</option>
                        {annees.map(a => <option key={a.id} value={a.id}>{a.annee_scolaire}</option>)}
                    </select>
                    {/* Filtres classe */}
                    <select value={classeFilter} onChange={(e)=> setClasseFilter(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none">
                        <option value="">Toutes classes</option>
                        {classesList.map(c => <option key={c.id} value={c.id}>{c.lib_classe}</option>)}
                    </select>
                    {/* Filtres niveau */}
                    <select value={niveauFilter} onChange={(e)=> setNiveauFilter(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none">
                        <option value="">Tous niveaux</option>
                        {uniqueNiveaux.map(nv => <option key={nv} value={nv}>{getNiveauLabelFromLookup(nv)}</option>)}
                    </select>
                    <select value={optionFilter} onChange={(e)=> setOptionFilter(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none">
                        <option value="">Toutes options</option>
                        {uniqueOptions.map(op => <option key={op} value={op}>{getOptionLabelFromLookup(op)}</option>)}
                    </select>
                    {/* Export Excel et PDF */}
                    <div className="flex items-center gap-2">
                        <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><FileSpreadsheet size={16} /> Excel</button>
                        <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold"><FileText size={16} /> PDF</button>
                    </div>
                </div>
                {/* Table des frais avec pagination */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-3">Année</th>
                                <th className="p-3">Classe</th>
                                <th className="p-3 text-right">Frais annuels</th>
                                <th className="p-3 text-right">1ère</th>
                                <th className="p-3 text-right">2ème</th>
                                <th className="p-3 text-right">3ème</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                            {pageItems.map((f:any) => (
                                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-3">{getAnneeLabel(f) || '-'}</td>
                                    <td className="p-3">{getClasseLabel(f) || '-'}</td>
                                    <td className="p-3 text-right">{formatPrice(f.frais_annuel)}</td>
                                    <td className="p-3 text-right">{formatPrice(f.t1_fs)}</td>
                                    <td className="p-3 text-right">{formatPrice(f.t2_fs)}</td>
                                    <td className="p-3 text-right">{formatPrice(f.t3_fs)}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(f)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14}/></button>
                                            <button onClick={() => handleDelete(f.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between p-4">
                    <div className="text-xs text-slate-500">Affichage {indexFirst+1} - {Math.min(indexLast, filteredItems.length)} sur {filteredItems.length}</div>
                    <div className="flex items-center gap-2">
                                                <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}
                                                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black border border-blue-100">
                                                    Page {page} / {totalPages || 1}
                                                </div>
                                                <button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages || totalPages === 0}
                                                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                </div>
                </div>

                

                <ScolariteModal isOpen={isOpen} onClose={() => setIsOpen(false)} refreshList={fetchItems} selectedScolarite={current} />
            </div>
        </DashboardLayout>
    );
}