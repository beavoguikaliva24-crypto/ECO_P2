"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import StatRecouvrements, {
  Affectation as AffectationT,
  Recouvrement as RecouvrementT,
} from "./StatRecouvrement";

type AnyObj = Record<string, any>;

const pick = (o: AnyObj | undefined, ...keys: string[]) =>
  keys.reduce((v, k) => (v ??= o?.[k]), undefined as any);

const toArray = (data: any) => (Array.isArray(data) ? data : data?.results ?? []);

export default function StatsRecouvrementContainer() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api" || "http://127.0.0.1:8000/api" || "http://beapc:8000/api";
  const [affectations, setAffectations] = useState<AffectationT[]>([]);
  const [recouvrements, setRecouvrements] = useState<RecouvrementT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const [affRes, recRes] = await Promise.all([
          axios.get(`${API}/affectations/`),
          axios.get(`${API}/recouvrements/`),
        ]);

        // Normalize affectations
        const affArr = toArray(affRes.data).map((a: AnyObj): AffectationT => ({
          annee_nom: a.annee_nom ?? pick(a, "annee", "nom") ?? a.annee ?? "",
          classe_nom: a.classe_nom ?? pick(a, "classe", "nom") ?? a.classe ?? "",
          niveau_classe: a.niveau_classe ?? pick(a, "classe", "niveau") ?? a.niveau ?? "",
          option_classe: a.option_classe ?? pick(a, "classe", "option") ?? a.option ?? "",
          affectation_id: a.affectation_id ?? a.id ?? a.eleve_aff ?? a.eleve_id ?? a?.affectation?.id ?? "",
          id: a.id,
          eleve_id: a.eleve_aff ?? a.eleve_id ?? a?.eleve?.id,
        }));

        // Normalize recouvrements
        const recArr = toArray(recRes.data).map((r: AnyObj): RecouvrementT => ({
          annee_nom: r.annee_nom ?? r?.affectation?.annee_nom ?? "",
          classe_nom: r.classe_nom ?? r?.affectation?.classe_nom ?? "",
          niveau_classe: r.niveau_classe ?? r?.affectation?.niveau_classe ?? "",
          option_classe: r.option_classe ?? r?.affectation?.option_classe ?? "",
          affectation_id: r.affectation_id ?? r?.affectation?.id ?? r.id ?? r.id_affectation ?? "",
          eleve_id: r.eleve_id ?? r?.affectation?.eleve_aff ?? r?.affectation?.eleve_id,
          frais_total: Number(r.frais_total ?? 0),
          montant_paye: Number(r.montant_paye ?? 0),
        }));

        if (!mounted) return;
        setAffectations(affArr);
        setRecouvrements(recArr);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [API]);

  if (loading)
    return <div className="p-4 text-sm text-zinc-500">Chargement…</div>;

  return (
    <StatRecouvrements
      affectations={affectations}
      recouvrements={recouvrements}
    />
  );
}
