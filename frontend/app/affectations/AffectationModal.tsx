/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, UserPlus, School, Calendar, Activity } from "lucide-react";
import { toast } from "react-hot-toast";
import Select from "react-select";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    refreshList: () => void;
    selectedAffectation?: any;
    initialEleveId?: number | null;
    // ⬇️ NOUVEAU CONTRAT : on envoie l'objet recouvrement prêt à ouvrir
    onOpenRecouvrement?: (recouvrement: any) => void;
}

/** Convertit en entier sûr, sinon renvoie null */
function toInt(value: any): number | null {
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : null;
}

/** Récupère une affectation par triplet (GET filtré) et vérifie la correspondance */
async function getAffectationByTriplet(eleveId: number, classeId: number, anneeId: number) {
    const url = `${API}/affectations/?eleve_aff=${eleveId}&classe_aff=${classeId}&annee_aff=${anneeId}`;
    const { data } = await axios.get(url);
    const arr: any[] = Array.isArray(data) ? data : (data?.results ?? []);

    // GARDE-FOU : on s’assure que ça correspond vraiment au triplet demandé
    return (
        arr.find(
            (a: any) =>
                Number(a?.eleve_aff) === Number(eleveId) &&
                Number(a?.classe_aff) === Number(classeId) &&
                Number(a?.annee_aff) === Number(anneeId)
            ) || null
    );
}

    /** Assure (get-or-create) l’existence d’une affectation */
async function ensureAffectation(payload: {
    eleve_aff: number;
    classe_aff: number;
    annee_aff: number;
    etat_aff?: string;
}){
    // 1) Tente l’endpoint idempotent /ensure/ s’il existe côté DRF
    try {
        const { data } = await axios.post(`${API}/affectations/ensure/`, payload);
        return data;
    } catch {
        // On tombe sur le fallback GET/POST
    }
    // 2) Fallback : POST direct, puis si déjà existant → GET filtré
    try {
        const { data } = await axios.post(`${API}/affectations/`, payload);
        return data;
    } catch (error: any) {
        const serverError = error?.response?.data;
        if (serverError?.non_field_errors) {
            const existante = await getAffectationByTriplet(
                payload.eleve_aff,
                payload.classe_aff,
                payload.annee_aff
            );
            if (existante) return existante;
        }
        throw error;
    }
}

/** GET recouvrement par affectation, avec vérification */
async function getRecouvrementByAffectation(affectationId: number) {
    const url = `${API}/recouvrements/?affectation=${affectationId}`;
    const { data } = await axios.get(url);
    const arr: any[] = Array.isArray(data) ? data : (data?.results ?? []);
    return arr.find((r: any) => Number(r?.affectation) === Number(affectationId)) || null;
}

/** Assure (get-or-create) l’existence d’un recouvrement pour l’affectation donnée */
async function ensureRecouvrement(affectationId: number) {
    // 1) Tente /ensure/ s’il existe
    try {
        const { data } = await axios.post(`${API}/recouvrements/ensure/`, { affectation: affectationId });
        return data;
    } catch {
        // Fallback
    }

    // 2) Fallback GET/POST
    const existant = await getRecouvrementByAffectation(affectationId);
    if (existant) return existant;

    const { data } = await axios.post(`${API}/recouvrements/`, { affectation: affectationId });
    return data;
}

/* ===================== Composant ===================== */
export default function AffectationModal({isOpen,onClose,refreshList,selectedAffectation, initialEleveId,onOpenRecouvrement,}: Props) {
    const [formData, setFormData] = useState({annee_aff: "",classe_aff: "",eleve_aff: "",etat_aff: "Nouv",});
    const [listes, setListes] = useState({annees: [] as any[], classes: [] as any[], eleves: [] as any[],});
    const [saving, setSaving] = useState(false);
    const [openingRecouvrement, setOpeningRecouvrement] = useState(false);

    /* ===================== Helpers communs ===================== */
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api" || "http://127.0.0.1:8000/api" || "http://beapc:8000/api";


    /* ---------- Chargement listes + (ré)init form à l’ouverture ---------- */
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                const [resAn, resCl, resEl] = await Promise.all([
                axios.get(`${API}/annees/`),
                axios.get(`${API}/classes/`),
                axios.get(`${API}/eleves/`),
                ]);
                setListes({ annees: resAn.data, classes: resCl.data, eleves: resEl.data });
            } catch (error) {
                toast.error("Erreur lors du chargement des listes");
                console.error(error);
            }
        };

        // (Re)chargement des listes
        fetchData();

        // Remplissage / Reset du formulaire
        if (selectedAffectation) {
            setFormData({
                annee_aff: selectedAffectation.annee_aff?.toString() || "",
                classe_aff: selectedAffectation.classe_aff?.toString() || "",
                eleve_aff: selectedAffectation.eleve_aff?.toString() || "",
                etat_aff: selectedAffectation.etat_aff || "Nouv",
            });
        } else if (initialEleveId) {
            setFormData({
                annee_aff: "",
                classe_aff: "",
                eleve_aff: String(initialEleveId),
                etat_aff: "Nouv",
            });
        } else {setFormData({ 
            annee_aff: "", 
            classe_aff: "", 
            eleve_aff: "", 
            etat_aff: "Nouv" 
        });}
    }, [isOpen, selectedAffectation, initialEleveId]);

  /* ---------- Submit Affectation (créer / modifier) ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const payload = {
      annee_aff: toInt(formData.annee_aff),
      classe_aff: toInt(formData.classe_aff),
      eleve_aff: toInt(formData.eleve_aff),
      etat_aff: formData.etat_aff,
    };

    if (!payload.eleve_aff || !payload.classe_aff || !payload.annee_aff) {
      toast.error("Veuillez remplir les champs Élève, Classe et Année");
      return;
    }

    try {
      setSaving(true);
      if (selectedAffectation?.id) {
        await axios.put(`${API}/affectations/${selectedAffectation.id}/`, payload);
        toast.success("Affectation modifiée avec succès");
      } else {
        await axios.post(`${API}/affectations/`, payload);
        toast.success("Élève affecté avec succès");
      }
      refreshList();
      onClose();
    } catch (error: any) {
      console.error("Erreur enregistrement affectation:", error?.response?.data || error);
      const serverError = error?.response?.data;
      if (serverError?.non_field_errors) {
        toast.error("Cet élève est déjà affecté à cette classe pour cette année.");
      } else {
        toast.error("Erreur lors de l'enregistrement. Vérifiez les données.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Ouverture Recouvrement depuis Affectation ---------- */
  const handleRecouvrementClick = async () => {
    if (openingRecouvrement) return;

    const eleveId = toInt(formData.eleve_aff);
    const classeId = toInt(formData.classe_aff);
    const anneeId = toInt(formData.annee_aff);

    if (!eleveId || !classeId || !anneeId) {
      toast.error("Veuillez d'abord sélectionner Élève, Classe et Année");
      return;
    }

    try {
      setOpeningRecouvrement(true);

      // 1) Déterminer / Assurer l’affectation
      let affectation: any = selectedAffectation;
      if (!affectation?.id) {
        affectation = await ensureAffectation({
          eleve_aff: eleveId,
          classe_aff: classeId,
          annee_aff: anneeId,
          etat_aff: formData.etat_aff || "Nouv",
        });
      }

      const affId = toInt(affectation?.id ?? affectation?.pk ?? affectation);
      if (!affId) throw new Error("Affectation introuvable après ensure");

      // 2) Assurer le recouvrement lié
      const rec = await ensureRecouvrement(affId);

      // 3) Ouvrir le RecouvrementModal via le parent avec l'objet 'rec'
      onOpenRecouvrement?.(rec);

      // 4) Fermer le modal Affectation
      onClose();
    } catch (error: any) {
      console.error("Ouverture recouvrement - erreur:", error?.response?.data || error);
      const serverError = error?.response?.data;
      if (serverError?.non_field_errors) {
        toast.error("Conflit d'affectation (déjà existante).");
      } else {
        toast.error("Impossible d’ouvrir le recouvrement.");
      }
    } finally {
      setOpeningRecouvrement(false);
    }
  };

  if (!isOpen) return null;

  const eleveOptions = listes.eleves.map((el: any) => ({
    value: el.id.toString(),
    label: `${el.fullname} (${el.matricule})`,
  }));

  const selectedEleveOption =
    formData.eleve_aff ? eleveOptions.find((opt) => opt.value === formData.eleve_aff.toString()) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {selectedAffectation ? "Modifier l'affectation" : "Nouvelle Affectation"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Élève */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Élève
            </label>
            <Select
              options={eleveOptions}
              value={selectedEleveOption}
              onChange={(selected: any) => setFormData({ ...formData, eleve_aff: selected ? selected.value : "" })}
              placeholder="Rechercher un élève..."
              isSearchable
              isClearable
              noOptionsMessage={() => "Aucun élève trouvé"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.75rem",
                  borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
                }),
              }}
            />
          </div>

          {/* Classe / Année */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                <School size={14} /> Classe
              </label>
              <select
                value={formData.classe_aff}
                onChange={(e) => setFormData({ ...formData, classe_aff: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choisir...</option>
                {listes.classes.map((cl: any) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.lib_classe}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                <Calendar size={14} /> Année
              </label>
              <select
                value={formData.annee_aff}
                onChange={(e) => setFormData({ ...formData, annee_aff: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choisir...</option>
                {listes.annees.map((an: any) => (
                  <option key={an.id} value={an.id}>
                    {an.annee_scolaire}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* État */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              <Activity size={14} /> État
            </label>
            <select
              value={formData.etat_aff}
              onChange={(e) => setFormData({ ...formData, etat_aff: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Nouv">Nouveau/elle</option>
              <option value="adm">Admis/e</option>
              <option value="red">Redoublant/e</option>
              <option value="Cdt">Candidat(e) libre</option>
              <option value="Aut">Autre</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-2xl">
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 font-bold text-white bg-indigo-600 rounded-2xl shadow-lg disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Confirmer"}
            </button>

            <button
              type="button"
              onClick={handleRecouvrementClick}
              disabled={openingRecouvrement}
              className="flex-1 py-4 font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 rounded-2xl shadow-lg transition-colors"
            >
              {openingRecouvrement ? "Ouverture..." : "Recouvrement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}