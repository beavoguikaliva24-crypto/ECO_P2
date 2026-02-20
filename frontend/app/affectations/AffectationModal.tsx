/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, UserPlus, School, Calendar, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  refreshList: () => void;
  selectedAffectation?: any;
}

export default function AffectationModal({ isOpen, onClose, refreshList, selectedAffectation }: Props) {
  const [formData, setFormData] = useState({
    annee_aff: '',
    classe_aff: '',
    eleve_aff: '',
    etat_aff: 'Nouv'
  });

  // États pour stocker les listes venant de l'API
  const [listes, setListes] = useState({
    annees: [],
    classes: [],
    eleves: []
  });

  useEffect(() => {
    if (isOpen) {
      // Charger les données nécessaires pour les sélecteurs
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

      if (selectedAffectation) {
        setFormData({
          annee_aff: selectedAffectation.annee_aff || '',
          classe_aff: selectedAffectation.classe_aff || '',
          eleve_aff: selectedAffectation.eleve_aff || '',
          etat_aff: selectedAffectation.etat_aff || 'Nouv'
        });
      } else {
        setFormData({ annee_aff: '', classe_aff: '', eleve_aff: '', etat_aff: 'Nouv' });
      }
    }
  }, [selectedAffectation, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedAffectation) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/affectations/${selectedAffectation.id}/`, formData);
        toast.success("Affectation modifiée");
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/affectations/`, formData);
        toast.success("Élève affecté avec succès");
      }
      refreshList();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.non_field_errors ? "Cet élève est déjà affecté à cette classe pour cette année." : "Erreur de validation";
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

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
          {/* SÉLECTEUR ÉLÈVE */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Élève</label>
            <select 
              value={formData.eleve_aff}
              onChange={e => setFormData({...formData, eleve_aff: e.target.value})}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sélectionner un élève</option>
              {listes.eleves.map((el: any) => (
                <option key={el.id} value={el.id}>{el.nom} {el.prenom1} ({el.matricule})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* SÉLECTEUR CLASSE */}
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

            {/* SÉLECTEUR ANNÉE */}
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

          {/* ÉTAT / STATUT */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><Activity size={14}/> État de l'élève</label>
            <select 
              value={formData.etat_aff}
              onChange={e => setFormData({...formData, etat_aff: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Nouv">Nouveau/elle</option>
              <option value="adm">Admis/e</option>
              <option value="red">Redoublant/e</option>
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