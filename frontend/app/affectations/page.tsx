"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Filter, FileText, Download, 
  Users, GraduationCap, Calendar, TrendingUp, 
  Info, RefreshCw, Edit, ChevronLeft, ChevronRight
} from 'lucide-react';
import AffectationModal from '../affectations/AffectationModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DashboardLayout from '../dashboard/layout';

export default function AffectationsPage() {
  const [affectations, setAffectations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAff, setSelectedAff] = useState(null);
  
  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');

  // --- ÉTATS POUR LA PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Nombre de lignes par page

  const fetchAffectations = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/affectations/`);
      setAffectations(res.data);
    } catch (error) { console.error("Erreur de chargement", error); }
  };

  useEffect(() => { fetchAffectations(); }, []);

  // --- LOGIQUE DE FILTRE ---
  const filteredData = useMemo(() => {
    return affectations.filter((aff: any) => {
      const matchSearch = (aff.eleve_details?.fullname + aff.eleve_details?.matricule)
        .toLowerCase().includes(searchTerm.toLowerCase());
      const matchClasse = filterClasse === '' || aff.classe_nom === filterClasse;
      const matchAnnee = filterAnnee === '' || aff.annee_nom === filterAnnee;
      return matchSearch && matchClasse && matchAnnee;
    });
  }, [affectations, searchTerm, filterClasse, filterAnnee]);

  // --- LOGIQUE DE PAGINATION ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Réinitialiser la page quand on filtre
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterClasse, filterAnnee]);

  // --- STATISTIQUES (Basées sur les données filtrées) ---
  const stats = {
    total: filteredData.length,
    nouveaux: filteredData.filter((a: any) => a.etat_aff?.toLowerCase() === 'nouv').length,
    admis : filteredData.filter((a: any) => a.etat_aff?.toLowerCase() === 'adm').length,
    redoublants : filteredData.filter((a: any) => a.etat_aff?.toLowerCase() === 'red').length,
    cdt : filteredData.filter((a: any) => a.etat_aff?.toLowerCase() === 'cdt').length,
    autres: filteredData.filter((a: any) => a.etat_aff?.toLowerCase() === 'aut').length,
    classes: new Set(filteredData.map((a: any) => a.classe_nom)).size,
  };

  // --- EXPORTATION ---
  const exportExcel = () => {
    const data = filteredData.map(a => ({
      Matricule: a.eleve_details?.matricule,
      Eleve: a.eleve_details?.fullname,
      Classe: a.classe_nom,
      Année: a.annee_nom,
      Statut: a.etat_aff
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Affectations");
    XLSX.writeFile(wb, "Affectations_Eleves.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Affectations", 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['Matricule', 'Nom Complet', 'Classe', 'Année']],
      body: filteredData.map(a => [
        a.eleve_details?.matricule, a.eleve_details?.fullname, a.classe_nom, a.annee_nom
      ]),
    });
    doc.save("Affectations.pdf");
  };

  return (
    <DashboardLayout>
      <div className="p-1 space-y-3">
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-slate-800">Affectations</h1>
                <p className="text-sm text-slate-500 font-medium">Gestion des inscriptions par classe</p>
              </div>
              <button onClick={() => { setSelectedAff(null); setIsModalOpen(true); }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
                <Plus size={18}/> Nouvelle Affectation
              </button>
            </div>

            {/* CARTES STATISTIQUES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              <StatCard title="Total" value={stats.total} icon={<Users size={20} className="text-blue-600"/>} color="bg-blue-50" />
              <StatCard title="Nouveaux" value={stats.nouveaux} icon={<TrendingUp size={20} className="text-emerald-600"/>} color="bg-emerald-50" />
              <StatCard title="Admis" value={stats.admis} icon={<GraduationCap size={20} className="text-orange-600"/>} color="bg-orange-50" />
              <StatCard title="Redoublants" value={stats.redoublants} icon={<RefreshCw size={20} className="text-amber-600"/>} color="bg-amber-50" />
              <StatCard title="CDT" value={stats.cdt} icon={<Calendar size={20} className="text-purple-600"/>} color="bg-purple-50" />
              <StatCard title="Autres" value={stats.autres} icon={<Info size={20} className="text-slate-600"/>} color="bg-slate-50" />
              <StatCard title="Classes" value={stats.classes} icon={<GraduationCap size={20} className="text-purple-600"/>} color="bg-purple-50" />
            </div>

            {/* BARRE DE RECHERCHE ET FILTRES */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Rechercher par nom ou matricule..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFilterAnnee(e.target.value)}>
                <option value="">Toutes les années</option>
                {[...new Set(affectations.map((a:any) => a.annee_nom))].map(an => <option key={an} value={an}>{an}</option>)}
              </select>
              <select className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFilterClasse(e.target.value)}>
                <option value="">Toutes les classes</option>
                {[...new Set(affectations.map((a:any) => a.classe_nom))].map(cl => <option key={cl} value={cl}>{cl}</option>)}
              </select>
              <div className="flex gap-2 border-l pl-4 border-slate-100">
                <button onClick={exportExcel} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
                  <Download size={18}/>
                </button>
                <button onClick={exportPDF} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                  <FileText size={18}/>
                </button>
              </div>
            </div>
        {/* TABLEAU AVEC SCROLL ET PAGINATION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          {/* Container Scrollable */}
          <div className="overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-md">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Élève</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase">Classe</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase text-center">Statut</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.map((aff: any) => (
                  <tr key={aff.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{aff.eleve_details?.fullname}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{aff.eleve_details?.matricule}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-blue-600">{aff.classe_nom}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">{aff.annee_nom}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        aff.etat_aff?.toLowerCase() === 'nouv' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                        {aff.etat_aff}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setSelectedAff(aff); setIsModalOpen(true); }} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
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

          {/* BARRE DE PAGINATION (Identique aux élèves) */}
          <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="text-xs font-medium text-slate-500">
              Affichage de <span className="text-slate-800 font-bold">{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> à <span className="text-slate-800 font-bold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> sur <span className="text-slate-800 font-bold">{filteredData.length}</span> affectations
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black border border-blue-100">
                Page {currentPage} / {totalPages || 1}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <AffectationModal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
          refreshList={fetchAffectations} selectedAffectation={selectedAff}
        />
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color }: any) {
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