"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  X, Save, User, Phone, MapPin, Briefcase, Wallet, Calendar, AlertCircle, CheckCircle2, Percent
} from "lucide-react";
import { toast } from "react-hot-toast";

interface RecouvrementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // On attend un objet recouvrement (ou au moins { id }).
  recouvrement?: any; // { id, affectation, affectation_details, frais_paiement, v1..v12, d1..d12, reduction, statut_ar, montant_statut_ar, ... }
}

const STATUT_OPTIONS = [
  { value: "Ins", label: "Inscription" },
  { value: "Reins", label: "Réinscription" },
  { value: "Aut", label: "Autre" },
];

export default function RecouvrementModal({
  isOpen,
  onClose,
  onSuccess,
  recouvrement,
}: RecouvrementModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"versements" | "tuteur" | "parametres">("parametres");

  // ----- 1) Source de vérité: rec (snapshot du serveur) -----
  const [rec, setRec] = useState<any>(recouvrement);
  const recId = rec?.id ?? rec?.pk;

  // Garde rec synchronisé avec la prop
  useEffect(() => {
    setRec(recouvrement);
  }, [recouvrement]);

  // Si on n'a qu'un id ou des détails incomplets, on refetch au premier open
  useEffect(() => {
    const fetchRec = async () => {
      if (!recId || !isOpen) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api" || "http://127.0.0.1:8000/api" || "http://beapc:8000/api";
        const { data } = await axios.get(`${API_URL}/recouvrements/${recId}/`);
        setRec(data);
      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger le recouvrement");
      }
    };
    if (isOpen && recId && !rec?.affectation_details) {
      fetchRec();
    }
  }, [isOpen, recId]); // volontairement pas `rec` pour éviter une boucle

  // ----- 2) Form local: uniquement les champs éditables -----
  const [formData, setFormData] = useState<any>({});
  useEffect(() => {
    if (!rec) return;
    // Prépare l’état éditable + les détails lecture seule (pour le header)
    setFormData({
      id: rec.id,
      affectation: rec.affectation,
      affectation_details: rec.affectation_details ?? null, // pour l'entête
      // champs tuteur
      tuteur_paiement: rec.tuteur_paiement ?? "",
      contact_tuteur_paiement: rec.contact_tuteur_paiement ?? "",
      adresse_tuteur_paiement: rec.adresse_tuteur_paiement ?? "",
      profession_tuteur_paiement: rec.profession_tuteur_paiement ?? "",
      // nouveaux champs paramètres
      reduction: Number(rec.reduction ?? 0), // 0-100
      statut_ar: rec.statut_ar ?? "Aut",
      montant_statut_ar: Number(rec.montant_statut_ar ?? 0),
      // versements
      ...Array.from({ length: 12 }).reduce((acc: Record<string, number | string>, _, i) => {
        const n = i + 1;
        acc[`v${n}`] = Number(rec[`v${n}`] ?? 0);
        acc[`d${n}`] = rec[`d${n}`] ?? "";
        return acc;
      }, {}),
    });
  }, [rec]);

  // ----- 3) Dérivés (affichage) -----
  const fraisTotal = Number(rec?.frais_paiement ?? 0);
  const totalPaye = useMemo(() => {
    let s = 0;
    for (let i = 1; i <= 12; i++) s += Number(formData?.[`v${i}`] ?? 0);
    return s;
  }, [formData]);
  const resteAPayer = Math.max(0, fraisTotal - totalPaye);

  // ----- 4) Handlers -----
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (/^v\d{1,2}$/.test(name)) {
      setFormData((prev: any) => ({ ...prev, [name]: Number(value || 0) }));
    } else if (name === "reduction" || name === "montant_statut_ar") {
      // nombres simples
      const asNum = Number(value || 0);
      setFormData((prev: any) => ({ ...prev, [name]: asNum }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData?.id) return;
    setLoading(true);
    try {
      const payload: any = {
        // On envoie uniquement ce qui est éditable côté UI
        tuteur_paiement: formData.tuteur_paiement,
        contact_tuteur_paiement: formData.contact_tuteur_paiement,
        adresse_tuteur_paiement: formData.adresse_tuteur_paiement,
        profession_tuteur_paiement: formData.profession_tuteur_paiement,
        // nouveaux champs
        reduction: Number(formData.reduction ?? 0),
        statut_ar: formData.statut_ar ?? "Aut",
        montant_statut_ar: Number(formData.montant_statut_ar ?? 0),
      };
      for (let i = 1; i <= 12; i++) {
        payload[`v${i}`] = Number(formData[`v${i}`] ?? 0);
        payload[`d${i}`] = formData[`d${i}`] || null; // string ISO ou null
      }
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/recouvrements/${formData.id}/`, payload);
      toast.success("Recouvrement enregistré");
      onSuccess?.();
      onClose();
    } catch (e: any) {
      console.error(e?.response?.data || e);
      toast.error("Erreur lors de l’enregistrement");
    } finally {
      setLoading(false);
    }
  };

  // ----- 5) Rendu -----
  if (!isOpen) return null;
  if (!rec) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-6">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b bg-zinc-50 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {formData.affectation_details?.eleve_fullname}
            </h2>
            <p className="text-sm text-zinc-500">
              Matricule: <span className="font-bold">{formData.affectation_details?.eleve_matricule}</span>{"  "}
              Classe: <span className="font-bold">{formData.affectation_details?.classe_lib}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* RÉSUMÉ FINANCIER RAPIDE */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-white border-b">
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-[10px] uppercase font-bold text-blue-600">Total Frais (après réduction)</p>
            <p className="text-lg font-black">{fraisTotal.toLocaleString()} FG</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-emerald-600">Déjà Payé</p>
            <p className="text-lg font-black">{totalPaye.toLocaleString()} FG</p>
          </div>
          <div className={`p-3 rounded-2xl border ${resteAPayer > 0 ? "bg-rose-50 border-rose-100" : "bg-green-50 border-green-100"}`}>
            <p className="text-[10px] uppercase font-bold text-zinc-600">Reste à payer</p>
            <p className={`text-lg font-black ${resteAPayer > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {resteAPayer.toLocaleString()} FG
            </p>
          </div>
        </div>

        {/* NAVIGATION ONGLETS */}
        <div className="flex px-6 pt-4 gap-6 border-b">
            <button
            onClick={() => setActiveTab("parametres")}
            className={`pb-3 text-sm font-bold transition-all ${activeTab === "parametres" ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-400"}`}
          >
            Paramètres (Réduction & Statut)
          </button>
          <button
            onClick={() => setActiveTab("versements")}
            className={`pb-3 text-sm font-bold transition-all ${activeTab === "versements" ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-400"}`}
          >
            Versements (v1 - v12)
          </button>
          <button
            onClick={() => setActiveTab("tuteur")}
            className={`pb-3 text-sm font-bold transition-all ${activeTab === "tuteur" ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-400"}`}
          >
            Informations Tuteur
          </button>
          
        </div>

        {/* CONTENU FORMULAIRE */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === "tuteur" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <User size={14} /> Nom du Tuteur
                </label>
                <input
                  type="text"
                  name="tuteur_paiement"
                  value={formData.tuteur_paiement || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <Phone size={14} /> Contact
                </label>
                <input
                  type="text"
                  name="contact_tuteur_paiement"
                  value={formData.contact_tuteur_paiement || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <MapPin size={14} /> Adresse
                </label>
                <input
                  type="text"
                  name="adresse_tuteur_paiement"
                  value={formData.adresse_tuteur_paiement || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <Briefcase size={14} /> Profession
                </label>
                <input
                  type="text"
                  name="profession_tuteur_paiement"
                  value={formData.profession_tuteur_paiement || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : activeTab === "parametres" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <Percent size={14} /> Réduction (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  name="reduction"
                  value={Number(formData.reduction ?? 0)}
                  onChange={handleChange}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-zinc-400">Appliquée côté serveur lors de l'enregistrement.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Statut</label>
                <select
                  name="statut_ar"
                  value={formData.statut_ar ?? "Aut"}
                  onChange={handleChange}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUT_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Montant (Statut)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  name="montant_statut_ar"
                  value={Number(formData.montant_statut_ar ?? 0)}
                  onChange={handleChange}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-bold text-[10px] text-zinc-400 uppercase px-2">
                <div className="col-span-1 text-center">N°</div>
                <div className="col-span-6">Montant (FG)</div>
                <div className="col-span-5">Date de Versement</div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 12 }).map((_, i) => {
                  const num = i + 1;
                  return (
                    <div key={num} className="grid grid-cols-12 gap-3 items-center bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                      <div className="col-span-1 text-center font-black text-zinc-400 text-sm">v{num}</div>
                      <div className="col-span-6 relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input
                          type="number"
                          name={`v${num}`}
                          value={formData[`v${num}`] ?? 0}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          min={0}
                        />
                      </div>
                      <div className="col-span-5 relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input
                          type="date"
                          name={`d${num}`}
                          value={formData[`d${num}`] || ""}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t bg-zinc-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {resteAPayer <= 0 ? (
              <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                <CheckCircle2 size={16} /> Compte soldé
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                <AlertCircle size={16} /> En attente de {resteAPayer.toLocaleString()} FG
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-6 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-200 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              <Save size={18} /> {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
