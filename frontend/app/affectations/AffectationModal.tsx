/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UserPlus, School, Calendar, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Select from 'react-select';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  refreshList: () => void;
  selectedAffectation?: any;
  initialEleveId?: number | null; 
}

export default function AffectationModal({ isOpen, onClose, refreshList, selectedAffectation, initialEleveId }: Props) {
  const [formData, setFormData] = useState({
    annee_aff: '',
    classe_aff: '',
    eleve_aff: '',
    etat_aff: 'Nouv'
  });

  const [listes, setListes] = useState({
    annees: [],
    classes: [],
    eleves: []
  });

  // AffectationModal.tsx

useEffect(() => {
  if (isOpen) {
    const fetchData = async () => {
      try {
        const [resAn, resCl, resEl] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/annees/`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/classes/`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/eleves/`)
        ]);
        setListes({ annees: resAn.data, classes: resCl.data, eleves: resEl.data });
      } catch (error) {
        toast.error("Erreur lors du chargement des listes");
      }
    };
    fetchData();

    // LOGIQUE DE RÉINITIALISATION / REMPLISSAGE
    if (selectedAffectation) {
      // Cas : Modification
      setFormData({
        annee_aff: selectedAffectation.annee_aff?.toString() || '',
        classe_aff: selectedAffectation.classe_aff?.toString() || '',
        eleve_aff: selectedAffectation.eleve_aff?.toString() || '',
        etat_aff: selectedAffectation.etat_aff || 'Nouv'
      });
    } else if (initialEleveId) {
      // Cas : Nouveau via bouton "Affecter" d'un élève précis
      setFormData({
        annee_aff: '',
        classe_aff: '',
        eleve_aff: initialEleveId.toString(),
        etat_aff: 'Nouv'
      });
    } else {
      // Cas : Nouvelle Affectation pure (Bouton général)
      // ON FORCE LE VIDE ICI
      setFormData({ 
        annee_aff: '', 
        classe_aff: '', 
        eleve_aff: '', 
        etat_aff: 'Nouv' 
      });
    }
  }
}, [isOpen, selectedAffectation, initialEleveId]); // On s'assure que isOpen déclenche le reset

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // On prépare un objet avec des types de données corrects (Integers)
  const payload = {
    // On convertit les IDs en nombres. Si c'est vide, on met null.
    annee_aff: formData.annee_aff ? parseInt(formData.annee_aff) : null,
    classe_aff: formData.classe_aff ? parseInt(formData.classe_aff) : null,
    eleve_aff: formData.eleve_aff ? parseInt(formData.eleve_aff) : null,
    etat_aff: formData.etat_aff
  };

  // Sécurité : Si un ID manque, on ne fait même pas l'appel API
  if (!payload.eleve_aff || !payload.classe_aff || !payload.annee_aff) {
    toast.error("Veuillez remplir tous les champs (Élève, Classe et Année)");
    return;
  }

  try {
    if (selectedAffectation) {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/affectations/${selectedAffectation.id}/`, payload);
      toast.success("Affectation modifiée avec succès");
    } else {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/affectations/`, payload);
      toast.success("Élève affecté avec succès");
    }
    refreshList();
    onClose();
  } catch (error: any) {
    // Log précis pour voir ce que le backend rejette exactement
    console.error("Détails du rejet backend:", error.response?.data);
    
    const serverError = error.response?.data;
    if (serverError?.non_field_errors) {
      toast.error("Cet élève est déjà affecté à cette classe pour cette année.");
    } else {
      toast.error("Erreur lors de l'enregistrement. Vérifiez les données.");
    }
  }
};

  if (!isOpen) return null;

  const eleveOptions = listes.eleves.map((el: any) => ({
  value: el.id.toString(), // Convertit l'ID en string
  label: `${el.fullname} (${el.matricule})`
}));
  // Assurez-vous que la comparaison se fait aussi sur des strings
    //const selectedEleveOption = eleveOptions.find(opt => opt.value === formData.eleve_aff?.toString());
const selectedEleveOption = formData.eleve_aff 
  ? eleveOptions.find(opt => opt.value === formData.eleve_aff.toString()) 
  : null; // Force l'affichage du placeholder "Rechercher un élève..."
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
              <UserPlus size={20}/>
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {selectedAffectation ? "Modifier l'affectation" : "Nouvelle Affectation"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Élève</label>
            <Select
              options={eleveOptions}
              value={selectedEleveOption}
              onChange={(selected: any) => setFormData({...formData, eleve_aff: selected ? selected.value : ""})}
              placeholder="Rechercher un élève..."
              isSearchable
              isClearable
              noOptionsMessage={() => "Aucun élève trouvé"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.75rem',
                  borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
                }),
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><School size={14}/> Classe</label>
              <select 
                value={formData.classe_aff}
                onChange={e => setFormData({...formData, classe_aff: e.target.value})}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choisir...</option>
                {listes.classes.map((cl: any) => (
                  <option key={cl.id} value={cl.id}>{cl.lib_classe}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><Calendar size={14}/> Année</label>
              <select 
                value={formData.annee_aff}
                onChange={e => setFormData({...formData, annee_aff: e.target.value})}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choisir...</option>
                {listes.annees.map((an: any) => (
                  <option key={an.id} value={an.id}>{an.annee_scolaire}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><Activity size={14}/> État</label>
            <select 
              value={formData.etat_aff}
              onChange={e => setFormData({...formData, etat_aff: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Nouv">Nouveau/elle</option>
              <option value="adm">Admis/e</option>
              <option value="red">Redoublant/e</option>
              <option value="Cdt">Candidat(e) libre</option>
              <option value="Aut">Autre</option>
            </select>
          </div>

          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-2xl">Annuler</button>
            <button type="submit" className="flex-1 py-4 font-bold text-white bg-indigo-600 rounded-2xl shadow-lg">Confirmer</button>
          </div>
        </form>
      </div>
    </div>
  );
}