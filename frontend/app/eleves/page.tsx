/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
//* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Search, Trash2, UserCircle, Users, ChevronLeft, ChevronRight, 
  FileSpreadsheet, FileText, Download } from 'lucide-react';
import EleveModal from '../eleves/EleveModal';
import DashboardLayout from '../dashboard/layout';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ElevesPage() {
    const [eleves, setEleves] = useState([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEleve, setCurrentEleve] = useState(null);
  
    // PAGINATION STATES
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api" || "http://127.0.0.1:8000/api" || "http://beapc:8000/api";

    const fetchEleves = async () => {
        try {
            const res = await axios.get(`${API}/eleves/?search=${search}`);
            setEleves(res.data);
            setCurrentPage(1); // Reset à la page 1 lors d'une recherche
        } 
        catch (error) { console.error("Erreur chargement élèves:", error);}
    };

    useEffect(() => { fetchEleves(); }, [search]);

    // LOGIQUE PAGINATION
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = eleves.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(eleves.length / itemsPerPage);
    //const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEleve, setSelectedEleve] = useState(null);

    const stats = {
        total: eleves.length,
        garcons: eleves.filter((e: any) => e.sexe === 'M').length,
        filles: eleves.filter((e: any) => e.sexe === 'F').length,
        autre: eleves.filter((e: any) => e.sexe !== 'M' && e.sexe !== 'F').length
    };

    // --- FONCTION EXPORT EXCEL ---
    const exportToExcel = () => {
    // On prépare les données pour qu'elles soient lisibles (on nettoie les colonnes inutiles)
        const dataToExport = eleves.map((e: any) => ({
            Matricule: e.matricule,
            Nom_Complet: e.fullname,
            Sexe: e.sexe === 'M' ? 'Masculin' : 'Féminin',
            Date_Naissance: e.date_naissance,
            Lieu_Naissance: e.lieu_naissance,
            Pere: e.pere || 'N/A',
            Mere: e.mere || 'N/A',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Eleves");
        XLSX.writeFile(workbook, `Liste_Eleves_${new Date().toLocaleDateString()}.xlsx`);
    }

    // --- FONCTION EXPORT PDF ---
    const exportToPDF = () => {
        const doc = new jsPDF();

        // En-tête du PDF avec titre et date de génération
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("M E P U A", 14, 15);
  
        // Titre du document
        doc.setFontSize(18);
        doc.text("Liste des Élèves", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

        // Configuration du tableau PDF
        autoTable(doc, {
            startY: 35,
            head: [['Matricule', 'Nom Complet', 'Sexe', 'Naissance', 'Parents']],
            body: eleves.map((e: any) => [
                e.matricule,
                e.fullname,
                e.sexe,
                `${e.date_naissance} à ${e.lieu_naissance || ''}`,
                `P: ${e.pere || '-'} / M: ${e.mere || '-'}`
            ]),
            headStyles: { fillColor: [37, 99, 235] }, // Bleu correspondant à ton thème
            styles: { fontSize: 8 },
            theme: 'striped',
            didDrawPage: (data) => {
                // Ajout d'un pied de page avec numéro de page et total d'élèves quand le tableau dépasse une page et que le pied de page est dessiné avec chaque page et un tiret de page
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(`Page ${doc.getNumberOfPages()} - Total: ${eleves.length}`, 14, 290);
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 170, 290, { align: 'center' });
            }
        });

        doc.save(`Liste_Eleves.pdf`);
    };
    
    const handleEdit = (eleve: any) => {
    setCurrentEleve(eleve); // C'est ici qu'on fixe la donnée
    setIsModalOpen(true);
};
    return (
        <DashboardLayout>
            {/* On utilise h-full sur le conteneur principal pour que le scroll interne fonctionne */}
            <div className="flex flex-col h-[calc(97vh-70px)] p-1 bg-slate-50">
        
                {/* HEADER & STATS (Statiques en haut) */}
                <div className="flex-none">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Élèves</h1>
                            <p className="text-sm text-slate-500 font-medium">Effectif actuel de l'établissement</p>
                        </div>
                        <button onClick={() => { setCurrentEleve(null); setIsModalOpen(true); }}
                          className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-100 transition-all"
                        >
                            <Plus size={18}/> Inscrire un élève
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {/* ... Tes cartes de stats ici (gardées à l'identique) ... */}
                        <StatCard icon={<Users size={20}/>} label="Total" value={stats.total} color="blue" />
                        <StatCard icon={<UserCircle size={20}/>} label="Garçons" value={stats.garcons} total={stats.total} color="indigo" />
                        <StatCard icon={<UserCircle size={20}/>} label="Filles" value={stats.filles} total={stats.total} color="pink" />
                        <StatCard icon={<UserCircle size={20}/>} label="Autres" value={stats.autre} total={stats.total} color="slate" />
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mb-3">
                        {/* Barre de Recherche (prend tout l'espace disponible) */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19}/>
                            <input type="text" placeholder="Rechercher par nom ou matricule..." 
                                className="pl-12 w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                                value={search} onChange={(e) => setSearch(e.target.value)} 
                            />
                        </div>

                        {/* Boutons d'exportation */}
                        <div className="flex gap-2">
                            {/* Bouton Excel */}
                            <button onClick={exportToExcel}
                                className="flex cursor-pointer items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-colors font-bold text-sm"
                            >
                                <FileSpreadsheet size={18} />
                                <span className="hidden sm:inline">Excel</span>
                            </button>                       

                            {/* Bouton PDF */}
                            <button onClick={exportToPDF}
                                className="flex cursor-pointer items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors font-bold text-sm"
                            >
                                <FileText size={18} />
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                        </div>
                    </div>
                </div>                      

                {/* CONTENEUR TABLEAU SCROLLABLE */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-md">
                            <tr className="text-slate-500 text-xs uppercase font-bold">
                                <th className="p-4 bg-slate-50">Élève</th>
                                <th className="p-4 text-center bg-slate-50">Matricule</th>
                                <th className="p-4 bg-slate-50">Sexe</th>
                                <th className="p-4 bg-slate-50">Naissance</th>
                                <th className="p-4 bg-slate-50">Parents</th>
                                <th className="p-4 text-right bg-slate-50">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                            {currentItems.map((eleve: any) => (
                                <tr key={eleve.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            {eleve.photo ? <img src={eleve.photo} className="w-8 h-8 rounded-full object-cover shadow-sm" /> : 
                                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                    <UserCircle size={18}/>
                                                </div>
                                            }
                                            <span className="font-semibold text-slate-700">{eleve.fullname}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{eleve.matricule}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold 
                                            ${eleve.sexe === 'M' ? 'bg-indigo-50 text-indigo-600' : eleve.sexe === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-slate-50 text-slate-600'}`}>{eleve.sexe === 'M' ? 'M' : eleve.sexe === 'F' ? 'F' : '-'}</span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        {(() => {
                                            const { jour_naissance: j, mois_naissance: m, annee_naissance: a } = eleve;                              
                                            // Cas 1 : Tout est connu (différent de 0)
                                            if (j > 0 && m > 0 && a > 0) {
                                                return `${j.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${a}`;                                            
                                            }                                                                            
                                            // Cas 2 : Jour inconnu, mais mois et année connus                                        
                                            if (m > 0 && a > 0) {                                            
                                                const moisNom = new Date(2000, m - 1).toLocaleDateString('fr-FR', { month: 'long' });                                            
                                                return `${moisNom.charAt(0).toUpperCase() + moisNom.slice(1)} ${a}`;                                            
                                            }                                      
                                            // Cas 3 : Seule l'année est connue                                        
                                            if (a > 0) {                                            
                                                return `En ${a}`;                                            
                                            }
                                            // Sinon
                                            return "N/A";
                                        
                                        })()}

                                        {eleve.lieu_naissance && ` à ${eleve.lieu_naissance}`}
                                      
                                    </td>
                                    <td className="p-3 text-slate-500 text-xs">
                                        <div className="flex items-center gap-2">
                                            {/* On affiche une icône Users seulement s'il y a au moins un parent */}
                                            {(eleve.pere || eleve.mere) && <Users size={14} className="text-slate-400 shrink-0" />}
        
                                            <div className="line-clamp-1" title={ eleve.pere && eleve.mere ? `Père: ${eleve.pere} / Mère: ${eleve.mere}` : ""}>
                                                {(() => {
                                                    const hasPere = !!eleve.pere;
                                                    const hasMere = !!eleve.mere;
                                                
                                                    if (hasPere && hasMere) return (
                                                        <span className="font-medium text-slate-700">De {eleve.pere} et de {eleve.mere}</span>
                                                    );

                                                    if (hasPere) return (
                                                        <span className="font-medium text-slate-700">De {eleve.pere}</span>
                                                    );

                                                    if (hasMere) return (
                                                        <span className="font-medium text-slate-700">De {eleve.mere}</span>
                                                    );
                                                
                                                    return <span className="text-slate-300 italic">N/A</span>;
                                                })()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(eleve)} className="p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg"><Edit size={15}/></button>
                                            <button className="p-1.5 text-red-600 hover:bg-red-50 cursor-pointer rounded-lg"><Trash2 size={15}/></button>
                                        </div>
                                    </td>
                                </tr>
                        ))}
                    </tbody>
                </table>
                
                </div>    
                    {/* BARRE DE PAGINATION (Fixe au bas du tableau) */}
                    <div className="flex-none p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Affichage de <span className="text-slate-800">{indexOfFirstItem + 1}</span> à <span className="text-slate-800">{Math.min(indexOfLastItem, eleves.length)}</span> sur <span className="text-slate-800">{eleves.length}</span> élèves
                        </p>
                        <div className="flex gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-all">
                                <ChevronLeft size={18}/>
                            </button>
                            <div className="flex items-center px-4 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-100">
                                Page {currentPage} / {totalPages || 1}
                            </div>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}
                                className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"
                            >
                                <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <EleveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refreshList={fetchEleves} selectedEleve={currentEleve} />
        </DashboardLayout>
    );
}

// Petit composant interne pour les cartes de stats afin d'alléger le code principal
function StatCard({ icon, label, value, total, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        indigo: "bg-indigo-50 text-indigo-600",
        pink: "bg-pink-50 text-pink-600",
        slate: "bg-slate-50 text-slate-600"
    };
    return (
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
                <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
                    <h3 className="text-lg font-black text-slate-800">
                        {value} {total && <span className="text-[10px] text-slate-400 font-normal">({total > 0 ? Math.round((value/total)*100) : 0}%)</span>}
                    </h3>
            </div>
        </div>
    );
}