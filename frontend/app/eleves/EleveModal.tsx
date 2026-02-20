/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, UserPlus, User, Calendar, MapPin, Users as FamilyIcon, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EleveModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshList: () => void;
  selectedEleve?: any;
}

export default function EleveModal({ isOpen, onClose, refreshList, selectedEleve }: EleveModalProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom1: '',
    prenom2: '',
    prenom3: '',
    sexe: 'O', 
    jour_naissance: '',
    mois_naissance: '',
    annee_naissance: '',
    lieu_naissance: '',
    pere: '',
    mere: '',
    matricule: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (selectedEleve) {
      setFormData({
        nom: selectedEleve.nom || '',
        prenom1: selectedEleve.prenom1 || '',
        prenom2: selectedEleve.prenom2 || '',
        prenom3: selectedEleve.prenom3 || '',
        sexe: selectedEleve.sexe || 'O',
        jour_naissance: selectedEleve.jour_naissance || '',
        mois_naissance: selectedEleve.mois_naissance || '',
        annee_naissance: selectedEleve.annee_naissance || '',
        lieu_naissance: selectedEleve.lieu_naissance || '',
        pere: selectedEleve.pere || '',
        mere: selectedEleve.mere || '',
        matricule: selectedEleve.matricule || ''
      });
    } else {
      setFormData({ nom: '', prenom1: '', prenom2: '', prenom3: '', sexe: 'O', jour_naissance: '', mois_naissance: '', annee_naissance: '', lieu_naissance: '', pere: '', mere: '', matricule: '' });
    }
  }, [selectedEleve, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const data = new FormData();

  // On prépare les données pour correspondre aux attentes du modèle Django
  const submissionData = {
    ...formData,
    // Conversion forcée en entier (0 si vide) pour correspondre aux IntegerField de Django
    jour_naissance: parseInt(formData.jour_naissance) || 0,
    mois_naissance: parseInt(formData.mois_naissance) || 0,
    annee_naissance: parseInt(formData.annee_naissance) || 0,
  };

  // On retire le matricule de l'envoi s'il est vide (Django le générera)
  if (!submissionData.matricule) {
    delete (submissionData as any).matricule;
  }

  // Remplissage du FormData
  Object.keys(submissionData).forEach(key => {
    const value = (submissionData as any)[key];
    if (value !== null) {
      data.append(key, value.toString());
    }
  });

  if (photo) data.append('photo', photo);

  try {
    if (selectedEleve) {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/eleves/${selectedEleve.id}/`, data);
      toast.success("Élève mis à jour !");
    } else {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/eleves/`, data);
      toast.success("Élève ajouté avec succès !");
    }
    refreshList();
    onClose();
  } catch (error: any) {
    // Debug crucial : affiche l'erreur exacte renvoyée par Django
    console.error("Erreur Django détaillée:", error.response?.data);
    toast.error("Erreur de validation. Vérifiez les champs.");
  }
};

  if (!isOpen) return null;

  return (
    // CONTENEUR AVEC FLOU (backdrop-blur)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
      
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              {selectedEleve ? <Save size={20}/> : <UserPlus size={20}/>}
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {selectedEleve ? "Modifier l'élève" : "Inscription Élève"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400">
            <X size={24}/>
          </button>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="p-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-5">
            
            {/* IDENTITÉ */}
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><User size={14}/> Nom</label>
              <input type="text" value={formData.nom} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                onChange={e => setFormData({...formData, nom: e.target.value})} />
            </div>
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><User size={14}/> Prénom 1</label>
              <input type="text" value={formData.prenom1} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={e => setFormData({...formData, prenom1: e.target.value})} />
            </div>

            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1 block">Prénom 2 (Optionnel)</label>
              <input type="text" value={formData.prenom2} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={e => setFormData({...formData, prenom2: e.target.value})} />
            </div>
              <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1 block">Prénom 3 (Optionnel)</label>
              <input type="text" value={formData.prenom3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={e => setFormData({...formData, prenom3: e.target.value})} />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1 block">Sexe</label>
              <div className="flex gap-2">
                {['O', 'F', 'M'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({...formData, sexe: s})}
                    className={`flex-1 p-3 rounded-xl font-bold transition-all ${formData.sexe === s ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}
                  >
                    {s === 'O' ? 'Autre' : s === 'F' ? 'Féminin' : s === 'M' ? 'Masculin' : '?'}
                  </button>
                ))}
              </div>
            </div>

            {/* NAISSANCE */}
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><Calendar size={14}/> Date de naissance</label>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={formData.jour_naissance} placeholder="JJ" className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => setFormData({...formData, jour_naissance: e.target.value})} />
                <input type="number" value={formData.mois_naissance} placeholder="MM" className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => setFormData({...formData, mois_naissance: e.target.value})} />
                <input type="number" value={formData.annee_naissance} placeholder="AAAA" className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => setFormData({...formData, annee_naissance: e.target.value})} />
              </div>
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><MapPin size={14}/> Lieu de naissance</label>
              <input type="text" value={formData.lieu_naissance} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setFormData({...formData, lieu_naissance: e.target.value})} />
            </div>

            {/* PARENTS */}
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><FamilyIcon size={14}/> Nom du Père</label>
              <input type="text" value={formData.pere} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setFormData({...formData, pere: e.target.value})} />
            </div>
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><FamilyIcon size={14}/> Nom de la Mère</label>
              <input type="text" value={formData.mere} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setFormData({...formData, mere: e.target.value})} />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1"><Camera size={14}/> Photo de l'élève</label>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                <input type="file" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                  onChange={e => setPhoto(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-10">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">
              Annuler
            </button>
            <button type="submit" className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              {selectedEleve ? "Mettre à jour" : "Confirmer l'inscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}