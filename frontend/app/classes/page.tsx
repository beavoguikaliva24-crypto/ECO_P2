/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../dashboard/layout';
import { 
    Plus, Edit, Search, Trash2, UserCircle, Users, ChevronLeft, ChevronRight, 
    FileSpreadsheet, FileText, Download } from 'lucide-react';
import ClasseModal from './ClasseModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ClassesPage(){
    const [classes, setClasses] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [niveauFilter, setNiveauFilter] = useState('');
    const [optionFilter, setOptionFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentClasse, setCurrentClasse] = useState<any | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    const fetchClasses = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await axios.get(`${API}/classes/${qs}`);
            setClasses(res.data);
            setCurrentPage(1);
        } catch (err) { console.error('Erreur chargement classes', err); }
    };

    useEffect(() => { fetchClasses(); }, [search]);

    // filteredClasses: apply niveau/option filters client-side (backend doesn't support these params)
    const filteredClasses = classes.filter((c:any) => {
        if (niveauFilter && (c.niveau_classe || 'aut') !== niveauFilter) return false;
        if (optionFilter && (c.option_classe || 'aut') !== optionFilter) return false;
        return true;
    });

    const stats = {
        total: filteredClasses.length
    };

    // Statistiques par niveau et par option
    const niveauLabels: any = { cre: 'Crèche', mat: 'Maternel', pri: 'Primaire', clg: 'Collège', lyc: 'Lycée', aut: 'Autres' };
    const optionLabels: any = { se: 'Sciences Expér.', sm: 'Sciences Math.', ss: 'Sciences Sociales', sc: 'Scientifiques', lit: 'Littéraires', aut: 'Autres' };

    const niveauStats: any = {};
    const optionStats: any = {};
    filteredClasses.forEach((c:any) => {
        const n = c.niveau_classe || 'aut';
        const o = c.option_classe || 'aut';
        niveauStats[n] = (niveauStats[n] || 0) + 1;
        optionStats[o] = (optionStats[o] || 0) + 1;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = filteredClasses.map(c => ({ Code: c.code_classe, Classe: c.lib_classe, Niveau: c.niveau_classe, Option: c.option_classe }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");
        XLSX.writeFile(workbook, `Liste_Classes_${new Date().toLocaleDateString()}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Liste des Classes', 14, 22);
        doc.setFontSize(11);
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
        autoTable(doc, {
            startY: 35,
            head: [['Code', 'Classe', 'Niveau', 'Option']],
            body: filteredClasses.map((c:any) => [c.code_classe, c.lib_classe, c.niveau_classe || '-', c.option_classe || '-']),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [37, 99, 235] }
        });
        doc.save('Liste_Classes.pdf');
    };

    const handleEdit = (c: any) => { setCurrentClasse(c); setIsModalOpen(true); };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(97vh-70px)] p-1 bg-slate-50">
                <div className="flex-none">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Classes</h1>
                            <p className="text-sm text-slate-500 font-medium">Liste et gestion des classes</p>
                        </div>
                        <button onClick={() => { setCurrentClasse(null); setIsModalOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-100 transition-all"
                        >
                            <Plus size={18}/> Enregistrer une classe
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600`}><Users size={20}/></div>
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total</p>
                                <h3 className="text-lg font-black text-slate-800">{stats.total}</h3>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-3 grid grid-cols-2 gap-2">
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Par niveau</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(niveauStats).map(([k,v]) => (
                                        <div key={k} className="px-3 py-1 bg-slate-50 rounded-full text-sm font-semibold text-slate-700">{niveauLabels[k] || k}: {v}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Par option</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(optionStats).map(([k,v]) => (
                                        <div key={k} className="px-3 py-1 bg-slate-50 rounded-full text-sm font-semibold text-slate-700">{optionLabels[k] || k}: {v}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* BARRE DE RECHERCHE ET FILTRES */}
                     <div className="bg-white p-2 mb-3 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19}/>
                                <input type="text" placeholder="Rechercher par code ou nom de classe..." 
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={search} onChange={(e) => setSearch(e.target.value)} 
                                />
                            </div>

                            <select value={niveauFilter} onChange={(e) => setNiveauFilter(e.target.value)} 
                            className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Tous niveaux</option>
                                {Object.entries(niveauLabels).map(([k,label]) => <option key={k} value={k}>{label}</option>)}
                            </select>

                            <select value={optionFilter} onChange={(e) => setOptionFilter(e.target.value)} 
                                className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Toutes options</option>
                                {Object.entries(optionLabels).map(([k,label]) => <option key={k} value={k}>{label}</option>)}
                            </select>

                        {/* Export Excel et PDF */}
                                            <div className="flex items-center gap-2">
                                                <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><FileSpreadsheet size={16} /> Excel</button>
                                                <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold"><FileText size={16} /> PDF</button>
                                            </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-md">
                                <tr className="text-slate-500 text-xs uppercase font-bold">
                                    <th className="p-4 bg-slate-50">Classe</th>
                                    <th className="p-4 text-center bg-slate-50">Code</th>
                                    <th className="p-4 bg-slate-50">Niveau</th>
                                    <th className="p-4 bg-slate-50">Option</th>
                                    <th className="p-4 text-right bg-slate-50">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {currentItems.map((c:any) => (
                                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                    <Users size={18}/>
                                                </div>
                                                <span className="font-semibold text-slate-700">{c.lib_classe}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{c.code_classe}</span>
                                        </td>
                                        <td className="p-3 text-slate-600">{c.niveau_classe || '-'}</td>
                                        <td className="p-3 text-slate-600">{c.option_classe || '-'}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg"><Edit size={15}/></button>
                                                <button className="p-1.5 text-red-600 hover:bg-red-50 cursor-pointer rounded-lg"><Trash2 size={15}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex-none p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Affichage de <span className="text-slate-800">{indexOfFirstItem + 1}</span> à <span className="text-slate-800">{Math.min(indexOfLastItem, classes.length)}</span> sur <span className="text-slate-800">{classes.length}</span> classes
                        </p>
                        <div className="flex gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-all">
                                <ChevronLeft size={18}/>
                            </button>
                            <div className="flex items-center px-4 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-100">
                                Page {currentPage} / {totalPages || 1}
                            </div>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-all">
                                <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                </div>

                <ClasseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refreshList={fetchClasses} selectedClasse={currentClasse} />
            </div>
        </DashboardLayout>
    );
}