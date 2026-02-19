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

  const fetchEleves = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/eleves/?search=${search}`);
      setEleves(res.data);
      setCurrentPage(1); // Reset à la page 1 lors d'une recherche
    } catch (error) {
      console.error("Erreur chargement élèves:", error);
    }
  };

  useEffect(() => { fetchEleves(); }, [search]);

  // LOGIQUE PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = eleves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(eleves.length / itemsPerPage);

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
};

// --- FONCTION EXPORT PDF ---
const exportToPDF = () => {
  const doc = new jsPDF();
  
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
  });

  doc.save(`Liste_Eleves.pdf`);
};

  return (
    <DashboardLayout>
      {/* On utilise h-full sur le conteneur principal pour que le scroll interne fonctionne */}
      <div className="flex flex-col h-[calc(97vh-70px)] p-1 bg-slate-50">
        
        {/* HEADER & STATS (Statiques en haut) */}
        <div className="flex-none">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Élèves</h1>
              <p className="text-sm text-slate-500 font-medium">Effectif actuel de l'établissement</p>
            </div>
            <button 
              onClick={() => { setCurrentEleve(null); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
            >
              <Plus size={18}/> Inscrire un élève
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* ... Tes cartes de stats ici (gardées à l'identique) ... */}
            <StatCard icon={<Users size={24}/>} label="Total" value={stats.total} color="blue" />
            <StatCard icon={<UserCircle size={24}/>} label="Garçons" value={stats.garcons} total={stats.total} color="indigo" />
            <StatCard icon={<UserCircle size={24}/>} label="Filles" value={stats.filles} total={stats.total} color="pink" />
            <StatCard icon={<UserCircle size={24}/>} label="Autres" value={stats.autre} total={stats.total} color="slate" />
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-4">
  {/* Barre de Recherche (prend tout l'espace disponible) */}
  <div className="relative flex-1">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19}/>
    <input 
      type="text" 
      placeholder="Rechercher par nom ou matricule..." 
      className="pl-12 w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
      value={search} 
      onChange={(e) => setSearch(e.target.value)} 
    />
  </div>

  {/* Boutons d'exportation */}
  <div className="flex gap-2">
    {/* Bouton Excel */}
<button 
  onClick={exportToExcel}
  className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-colors font-bold text-sm"
>
  <FileSpreadsheet size={18} />
  <span className="hidden sm:inline">Excel</span>
</button>

{/* Bouton PDF */}
<button 
  onClick={exportToPDF}
  className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors font-bold text-sm"
>
  <FileText size={18} />
  <span className="hidden sm:inline">PDF</span>
</button>
  </div>
</div>
        </div>

        {/* CONTENEUR TABLEAU SCROLLABLE */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar relative">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 text-xs uppercase font-bold">
                  <th className="p-4 bg-slate-50">Élève</th>
                  <th className="p-4 text-center bg-slate-50">Matricule</th>
                  <th className="p-4 bg-slate-50">Sexe</th>
                  <th className="p-4 bg-slate-50">Naissance</th>
                  <th className="p-4 bg-slate-50">Parents</th>
                  <th className="p-4 text-right bg-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((eleve: any) => (
                  <tr key={eleve.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {eleve.photo ? <img src={eleve.photo} className="w-8 h-8 rounded-full object-cover shadow-sm" /> : <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserCircle size={18}/></div>}
                        <span className="font-semibold text-slate-700">{eleve.fullname}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{eleve.matricule}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${eleve.sexe === 'M' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'}`}>{eleve.sexe === 'M' ? 'M' : 'F'}</span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {/* ... Ta logique de date naissance ... */}
                      {eleve.date_naissance}
                    </td>
                    <td className="p-3 text-slate-500 text-xs truncate max-w-[150px]">
                      {eleve.pere || eleve.mere || 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(eleve)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={15}/></button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button>
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
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"
              ><ChevronLeft size={18}/></button>
              <div className="flex items-center px-4 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-100">
                Page {currentPage} / {totalPages || 1}
              </div>
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"
              ><ChevronRight size={18}/></button>
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
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-lg font-black text-slate-800">
          {value} {total && <span className="text-[10px] text-slate-400 font-normal">({total > 0 ? Math.round((value/total)*100) : 0}%)</span>}
        </h3>
      </div>
    </div>
  );
}