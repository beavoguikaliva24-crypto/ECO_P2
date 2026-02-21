"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Search, FileText, Download, Users, GraduationCap, Calendar, TrendingUp, Info, RefreshCw, Edit, ChevronLeft, ChevronRight} from 'lucide-react';
import AffectationModal from '../affectations/AffectationModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import DashboardLayout from '../dashboard/layout';
import { toast } from 'react-hot-toast';

interface EleveDetails {
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

export default function AffectationsPage() {
    const [affectations, setAffectations] = useState<Affectation[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAff, setSelectedAff] = useState<Affectation | null>(null);
    const NIVEAU_CHOIX = [
        { value: 'cre', label: 'Crèche' }, { value: 'mat', label: 'Maternel' },
        { value: 'pri', label: 'Primaire' }, { value: 'clg', label: 'Collège' },
        { value: 'lyc', label: 'Lycée' }, { value: 'aut', label: 'Autres' },
    ];
    const OPTION_CHOIX = [
        { value: 'se', label: 'Sciences Expérimentales' },{ value: 'sm', label: 'Sciences Maths' },
        { value: 'ss', label: 'Sciences Scociales' },{ value: 'sc', label: 'Scientifiques' },
        { value: 'lit', label: 'Littéraires' },{ value: 'aut', label: 'Autres' },

    ];
const getNiveauLabel = (value: string) => {
  return NIVEAU_CHOIX.find(n => n.value === value)?.label || value;
};

const getOptionLabel = (value: string) => {
  return OPTION_CHOIX.find(o => o.value === value)?.label || value;
};
  
  // 0. États des filtres
  const [searchTerm, setSearchTerm] = useState("");
const [filterAnnee, setFilterAnnee] = useState("");
const [filterClasse, setFilterClasse] = useState("");
const [filterNiveau, setFilterNiveau] = useState("");
const [filterOption, setFilterOption] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // 1. CHARGEMENT DES DONNÉES
  const fetchAffectations = async () => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/affectations/`);
    console.log("STRUCTURE DONNÉES :", res.data[0]); // <--- Regardez ceci dans la console F12
    setAffectations(res.data);
  } catch (error) { 
    console.error("Erreur de chargement", error); 
    toast.error("Erreur de connexion à l'API");
  }
};

// 2. LOGIQUE DE FILTRAGE
const filteredData = useMemo(() => {
  return affectations.filter((aff: Affectation) => {
    // Recherche par nom ou matricule
    const matchesSearch = 
      aff.eleve_details?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aff.eleve_details?.matricule?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtres exacts
    const matchesAnnee = filterAnnee ? aff.annee_nom === filterAnnee : true;
    const matchesClasse = filterClasse ? aff.classe_nom === filterClasse : true;
    
    // Nouveaux filtres (Niveau et Option)
    // On vérifie si la propriété existe dans votre objet 'aff' (ex: aff.niveau_nom ou aff.classe_details?.niveau)
    const matchesNiveau = filterNiveau ? aff.niveau_classe === filterNiveau : true;
    const matchesOption = filterOption ? aff.option_classe === filterOption : true;
    
    return matchesSearch && matchesAnnee && matchesClasse && matchesNiveau && matchesOption;
  });
}, [affectations, searchTerm, filterAnnee, filterClasse, filterNiveau, filterOption]); 

  useEffect(() => { 
    fetchAffectations(); 
  }, []);

  // 4. PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // 5. STATISTIQUES
  const stats = useMemo(() => ({
    total: filteredData.length,
    nouveaux: filteredData.filter((a: Affectation) => a.etat_aff?.toLowerCase() === 'nouv').length,
    admis: filteredData.filter((a: Affectation) => a.etat_aff?.toLowerCase() === 'adm').length,
    redoublants: filteredData.filter((a: Affectation) => a.etat_aff?.toLowerCase() === 'red').length,
    cdt: filteredData.filter((a: Affectation) => a.etat_aff?.toLowerCase() === 'cdt').length,
    autres: filteredData.filter((a: Affectation) => a.etat_aff?.toLowerCase() === 'aut').length,
    classes: new Set(filteredData.map((a: Affectation) => a.classe_nom)).size,
  }), [filteredData]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAff(null);
  };

  // 6. EXPORTS
  const exportExcel = () => {
    const data = filteredData.map(a => ({
      Matricule: a.eleve_details?.matricule,
      Eleve: a.eleve_details?.fullname,
      Sexe: a.eleve_details?.genre || a.eleve_details?.sexe,
      Classe: a.classe_nom,
      Année: a.annee_nom,
      Statut: a.etat_aff
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

  // --- 1. FONCTION DE STRUCTURE (FIXE SUR CHAQUE PAGE) ---
  const drawFixedStructure = (pdfDoc: any) => {
    try {
      pdfDoc.saveGraphicsState();
      pdfDoc.setGState(new pdfDoc.GState({ opacity: 0.1 }));
      pdfDoc.addImage(logoUrl, 'JPEG', pageWidth/2 - 75, pageHeight/2 - 75, 150, 150);
      pdfDoc.restoreGraphicsState();
    } catch (e) {}

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("MEPUA", 10, 10);
    pdfDoc.text("DCE : MATOTO", 10, 15);
    pdfDoc.text("IRE : CONAKRY", 10, 20);
    pdfDoc.text("REPUBLIQUE DE GUINEE", pageWidth - 10, 10, { align: "right" });
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Travail - Justice - Solidarité", pageWidth - 10, 15, { align: "right" });

    try { pdfDoc.addImage(logoUrl, 'JPEG', pageWidth/2 - 12, 5, 24, 24); } catch (e) {}
    
    pdfDoc.setDrawColor(0);
    pdfDoc.line(10, 30, pageWidth - 10, 30);
    pdfDoc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

    pdfDoc.setFontSize(8);
    pdfDoc.text("Groupe Scolaire ECO1 - Matoto - Conakry", 10, pageHeight - 15);
    pdfDoc.text("Page " + pdfDoc.internal.getNumberOfPages(), pageWidth - 10, pageHeight - 15, { align: "right" });
  };

  // --- 2. GROUPER PAR ANNÉE ET CLASSE ---
  const groupes = filteredData.reduce((acc: Record<string, Affectation[]>, curr) => {
    const annee = curr.annee_nom || "Année Inconnue";
    const classe = curr.classe_nom || "Sans Classe";
    const cle = `${annee} | ${classe}`; // La clé magique
    
    if (!acc[cle]) acc[cle] = [];
    acc[cle].push(curr);
    return acc;
  }, {});

  const listeCles = Object.keys(groupes);

  const formatDateNaissance = (details: EleveDetails | undefined) => {
  // Récupération des valeurs numériques du modèle
  const j = details?.jour_naissance; // de 0 à 31
  const m = details?.mois_naissance; // de 0 à 12
  const a = details?.annee_naissance; // 0 ou 1970+

  const lieu = details?.lieu_naissance ? ` à ${details.lieu_naissance}` : '';

  // Cas où rien n'est renseigné (tout est à 0 ou 0000)
  if ((!a || a === 0) && (!m || m === 0) && (!j || j === 0)) return 'N/A';

  let dateFormatee = "";

  // 1. CAS ANNÉE SEULE (Jour et Mois sont à 0)
  if (j === 0 && m === 0) {
    dateFormatee = `${a}`;
  } 
  // 2. CAS MOIS / ANNÉE (Jour est à 0)
  else if (j === 0) {
    const moisPadded = (m ?? 0).toString().padStart(2, '0');
    dateFormatee = `${moisPadded}/${a}`;
  } 
  // 3. CAS COMPLET (Tout est différent de 0)
  else {
    const jourPadded = (j ?? 0).toString().padStart(2, '0');
    const moisPadded = (m ?? 0).toString().padStart(2, '0');
    dateFormatee = `${jourPadded}/${moisPadded}/${a}`;
  }

  return `${dateFormatee}${lieu}`;
};

  // --- 3. BOUCLER SUR LES GROUPES ---
  listeCles.forEach((cle, index) => {
    const donneesGroupe = groupes[cle];
    
    // Stats pour ce groupe précis
    const total = donneesGroupe.length;
    const garcons = donneesGroupe.filter(a => a.eleve_details?.genre === 'M' || a.eleve_details?.sexe === 'M').length;
    const filles = donneesGroupe.filter(a => a.eleve_details?.genre === 'F' || a.eleve_details?.sexe === 'F').length;

    // Titre de la section (Année | Classe)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(cle, pageWidth / 2, 40, { align: "center" });

    autoTable(doc, {
      startY: 45,
      head: [['Matricule', 'Nom Complet', 'Sexe', 'Statut','Date et Lieu de Naissance']],
      body: donneesGroupe.map(a => [
        a.eleve_details?.matricule || '-', 
        a.eleve_details?.fullname || '-', 
        a.eleve_details?.sexe ? (a.eleve_details.genre || a.eleve_details.sexe) : '-',
        a.etat_aff || '-',
       formatDateNaissance(a.eleve_details),// Appel de la fonction ici
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => drawFixedStructure(doc)
    });

    // Position après le tableau
    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // Vérifier l'espace pour les stats et la signature
    if (finalY > pageHeight - 60) {
      doc.addPage();
      drawFixedStructure(doc);
      finalY = 40;
    }

    // Affichage des statistiques
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const colWidth = (pageWidth - 20) / 4;
    doc.text(`TOTAL : ${total}`, 15, finalY);
    doc.text(`GARCONS : ${garcons}`, 15 + colWidth, finalY);
    doc.text(`FILLES : ${filles}`, 15 + (colWidth * 2), finalY);
    doc.text(`AUTRES : ${total - garcons - filles}`, 15 + (colWidth * 3), finalY);

    // Direction
    doc.setFontSize(12);
    doc.text("LA DIRECTION", pageWidth / 2, finalY + 25, { align: "center" });
    const textW = doc.getTextWidth("LA DIRECTION");
    doc.line(pageWidth/2 - textW/2, finalY + 26, pageWidth/2 + textW/2, finalY + 26);

    // Si ce n'est pas le dernier groupe, on change de page
    if (index < listeCles.length - 1) {
      doc.addPage();
    }
  });

  doc.save("Rapport_Eco1_Global.pdf");
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
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              <StatCard title="Total" value={stats.total} icon={<Users size={20} className="text-blue-600"/>} color="bg-blue-50" />
              <StatCard title="Nouveaux" value={stats.nouveaux} icon={<TrendingUp size={20} className="text-emerald-600"/>} color="bg-emerald-50" />
              <StatCard title="Admis" value={stats.admis} icon={<GraduationCap size={20} className="text-orange-600"/>} color="bg-orange-50" />
              <StatCard title="Redoublants" value={stats.redoublants} icon={<RefreshCw size={20} className="text-amber-600"/>} color="bg-amber-50" />
              <StatCard title="CDT" value={stats.cdt} icon={<Calendar size={20} className="text-purple-600"/>} color="bg-purple-50" />
              <StatCard title="Autres" value={stats.autres} icon={<Info size={20} className="text-slate-600"/>} color="bg-slate-50" />
              <StatCard title="Classes" value={stats.classes} icon={<GraduationCap size={20} className="text-purple-600"/>} color="bg-purple-50" />
            </div>

            {/* BARRE DE RECHERCHE ET FILTRES */}
<div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
  <div className="relative flex-1 min-w-[200px]">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
    <input type="text" placeholder="Rechercher..."
      className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* Filtre Année */}
  <select className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
    onChange={(e) => setFilterAnnee(e.target.value)}>
    <option value="">Toutes les années</option>
    {[...new Set(affectations.map((a: Affectation) => a.annee_nom))].map((an: string | undefined) => <option key={an} value={an}>{an}</option>)}
  </select>

{/* Filtre Niveau */}
<select 
  className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
  onChange={(e) => setFilterNiveau(e.target.value)}
  value={filterNiveau}
>
  <option value="">Tous les niveaux</option>
  {NIVEAU_CHOIX.map(niv => (
    <option key={niv.value} value={niv.value}>{niv.label}</option>
  ))}
</select>

{/* Filtre Option */}
<select 
  className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
  onChange={(e) => setFilterOption(e.target.value)}
  value={filterOption}
>
  <option value="">Toutes les options</option>
  {OPTION_CHOIX.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>

  {/* Filtre Classe */}
  <select className="bg-slate-50 border-none rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
    onChange={(e) => setFilterClasse(e.target.value)}>
    <option value="">Toutes les classes</option>
    {[...new Set(affectations.map((a: Affectation) => a.classe_nom))].map((cl: string | undefined) => <option key={cl} value={cl}>{cl}</option>)}
  </select>

  <div className="flex gap-2 border-l pl-4 border-slate-100">
    <button onClick={exportExcel} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
      <Download size={18}/>
    </button>
    <button onClick={exportToPDF} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
      <FileText size={18}/>
    </button>
  </div>
</div>
        {/* TABLEAU AVEC SCROLL ET PAGINATION */}
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
                      <div className="font-bold text-slate-700">{aff.eleve_details?.fullname}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{aff.eleve_details?.matricule}</div>
                    </td>
                    <td className="pl-4 pb-1 pt-1">
                      <div className="text-sm font-semibold text-blue-600">{aff.classe_nom}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">{aff.annee_nom}</div>
                    </td>
                    <td className="pl-4 pb-1 pt-1">
  <div className="text-sm font-medium text-slate-700">
    {getNiveauLabel(aff.niveau_classe)}
  </div>
</td>
<td className="pl-4 pb-1 pt-1">
  <div className="text-sm font-medium text-slate-700">
    {getOptionLabel(aff.option_classe)}
  </div>
</td>
                    <td className="pl-4 pb-1 pt-1 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        aff.etat_aff?.toLowerCase() === 'nouv' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                        {aff.etat_aff}
                      </span>
                    </td>
                    <td className="pl-4 pb-1 pt-1 text-right">
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
  isOpen={isModalOpen} 
  onClose={handleCloseModal} // Correction ici : juste le nom de la fonction
  refreshList={fetchAffectations} 
  selectedAffectation={selectedAff}
/>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

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