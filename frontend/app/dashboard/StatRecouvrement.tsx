/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import React, { useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** ------------------------ Listes de valeurs ------------------------ */
const NIVEAU_CHOIX: { value: string; label: string }[] = [
  { value: "cre", label: "Crèche" },
  { value: "mat", label: "Maternel" },
  { value: "pri", label: "Primaire" },
  { value: "clg", label: "Collège" },
  { value: "lyc", label: "Lycée" },
  { value: "aut", label: "Autres" },
];

const OPTION_CHOIX: { value: string; label: string }[] = [
  { value: "se", label: "Sciences Expérimentales" },
  { value: "sm", label: "Sciences Maths" },
  { value: "ss", label: "Sciences Sociales" },
  { value: "sc", label: "Scientifiques" },
  { value: "lit", label: "Littéraires" },
  { value: "aut", label: "Autres" },
];

/** ------------------------ Types ------------------------ */
export interface Affectation {
  annee_nom: string;
  niveau_classe?: string;
  option_classe?: string;
  classe_nom?: string;
  affectation_id?: string | number;
  id?: string | number; // fallback éventuel
  eleve_id?: string | number; // fallback ancien schéma
}

export interface Recouvrement {
  annee_nom: string;
  niveau_classe?: string;
  option_classe?: string;
  classe_nom?: string;
  affectation_id?: string | number; // utilisé pour les KPI/comptes
  eleve_id?: string | number; // optionnel
  frais_total: number;
  montant_paye: number;
}

export type StatRecouvrementsProps = {
  affectations: Affectation[];
  recouvrements: Recouvrement[];
};

/** ------------------------ Helpers ------------------------ */
const toKey = (x?: string | number) => (x ?? "").toString().trim().toLowerCase();

const getAffId = (o: Partial<Affectation & Recouvrement>): string => {
  const v =
    (o.affectation_id as string | number | undefined) ??
    (o as any)?.affectationId ??
    (o.id as string | number | undefined) ??
    (o.eleve_id as string | number | undefined) ??
    "";
  return String(v);
};

const getNiveauLabel = (val?: string) =>
  NIVEAU_CHOIX.find((n) => n.value === val)?.label ?? (val ?? "N/A");

const getOptionLabel = (val?: string) =>
  OPTION_CHOIX.find((o) => o.value === val)?.label ?? (val ?? "N/A");

const fmtMoneyGNF = (v: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "GNF",
    maximumFractionDigits: 0,
  }).format(v || 0);

const fmtPct = (v: number) => `${(isFinite(v) ? v : 0).toFixed(1)}%`;

/** ------------------------ Composant principal ------------------------ */
export default function StatRecouvrements({
  affectations = [],
  recouvrements = [],
}: StatRecouvrementsProps) {
  /** ---------------- Filtres (état) ---------------- */
  const [selectedAnnee, setSelectedAnnee] = useState<string>("");
  const [selectedClasse, setSelectedClasse] = useState<string>("");
  const [selectedNiveau, setSelectedNiveau] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("");

  /** ---------------- Listes pour les <select> ---------------- */
  const listeAnnees = useMemo(() => {
    const an = new Set<string>();
    for (const a of affectations) a.annee_nom && an.add(a.annee_nom);
    for (const r of recouvrements) r.annee_nom && an.add(r.annee_nom);
    return Array.from(an).sort().reverse();
  }, [affectations, recouvrements]);

  const listeClasses = useMemo(() => {
    const cl = new Set<string>();
    for (const r of recouvrements) r.classe_nom && cl.add(r.classe_nom);
    for (const a of affectations) a.classe_nom && cl.add(a.classe_nom);
    return Array.from(cl).sort();
  }, [affectations, recouvrements]);

  const listeNiveaux = useMemo(
    () => NIVEAU_CHOIX.map((n) => ({ value: n.value, label: n.label })),
    []
  );

  const listeOptions = useMemo(
    () => OPTION_CHOIX.map((o) => ({ value: o.value, label: o.label })),
    []
  );

  /** ---------------- Application des filtres ---------------- */
  const match = useCallback(
    (x: {
      annee_nom?: string;
      classe_nom?: string;
      niveau_classe?: string;
      option_classe?: string;
    }) => {
      if (selectedAnnee && toKey(x.annee_nom) !== toKey(selectedAnnee)) return false;
      if (selectedClasse && toKey(x.classe_nom) !== toKey(selectedClasse)) return false;
      if (selectedNiveau && toKey(x.niveau_classe) !== toKey(selectedNiveau)) return false;
      if (selectedOption && toKey(x.option_classe) !== toKey(selectedOption)) return false;
      return true;
    },
    [selectedAnnee, selectedClasse, selectedNiveau, selectedOption]
  );

  const affectationsFiltrees = useMemo(
    () => affectations.filter((a) => match(a)),
    [affectations, match]
  );

  const recouvFiltre = useMemo(
    () => recouvrements.filter((r) => match(r)),
    [recouvrements, match]
  );

  /** ---------------- KPI (tous liés aux filtres) ---------------- */
  const totalAffectationsFiltrees = useMemo(() => {
    // 👉 Comme sur ta page Affectations: total = longueur du tableau filtré
    return affectationsFiltrees.length;
  }, [affectationsFiltrees]);

  const {
    nbRecouvrementsFiltres,
    totalFrais,
    totalPaye,
    totalRestant,
    pctPaye,
    pctRestant,
  } = useMemo(() => {
    // 👉 Recouvrements calculés SANS lier aux affectations, mais soumis aux mêmes filtres
    // Compte par dossier unique (affectation_id) pour éviter double-compte si plusieurs lignes
    const setRecouv = new Set<string>();
    let frais = 0;
    let paye = 0;
    for (const r of recouvFiltre) {
      const id = getAffId(r);
      if (id) setRecouv.add(id);
      frais += Number(r.frais_total || 0);
      paye += Number(r.montant_paye || 0);
    }
    const restant = Math.max(0, frais - paye);
    return {
      nbRecouvrementsFiltres: setRecouv.size,
      totalFrais: frais,
      totalPaye: paye,
      totalRestant: restant,
      pctPaye: frais > 0 ? (paye / frais) * 100 : 0,
      pctRestant: frais > 0 ? (restant / frais) * 100 : 0,
    };
  }, [recouvFiltre]);

  /** ---------------- Données Graphiques (filtrées) ---------------- */
  const parClasse = useMemo(() => {
    const map = new Map<string, { name: string; paye: number; restant: number; total: number }>();
    for (const r of recouvFiltre) {
      const key = r.classe_nom || "N/A";
      if (!map.has(key)) map.set(key, { name: key, paye: 0, restant: 0, total: 0 });
      const m = Number(r.montant_paye || 0);
      const f = Number(r.frais_total || 0);
      const row = map.get(key)!;
      row.paye += m;
      row.restant += Math.max(0, f - m);
      row.total += f;
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [recouvFiltre]);

  const parNiveau = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recouvFiltre) {
      const key = getNiveauLabel(r.niveau_classe);
      map.set(key, (map.get(key) || 0) + (r.montant_paye > 0 ? 1 : 0));
    }
    return Array.from(map, ([name, total]) => ({ name, total }));
  }, [recouvFiltre]);

  const parOption = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recouvFiltre) {
      const key = getOptionLabel(r.option_classe);
      map.set(key, (map.get(key) || 0) + (r.montant_paye > 0 ? 1 : 0));
    }
    return Array.from(map, ([name, total]) => ({ name, total }));
  }, [recouvFiltre]);

  /** ---------------- Rendu ---------------- */
  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <SelectField
          label="Année"
          value={selectedAnnee}
          onChange={setSelectedAnnee}
          options={[{ value: "", label: "Toutes" }, ...listeAnnees.map((a) => ({ value: a, label: a }))]}
        />
        <SelectField
          label="Classe"
          value={selectedClasse}
          onChange={setSelectedClasse}
          options={[{ value: "", label: "Toutes" }, ...listeClasses.map((c) => ({ value: c, label: c }))]}
        />
        <SelectField
          label="Niveau"
          value={selectedNiveau}
          onChange={setSelectedNiveau}
          options={[{ value: "", label: "Tous" }, ...listeNiveaux]}
        />
        <SelectField
          label="Option"
          value={selectedOption}
          onChange={setSelectedOption}
          options={[{ value: "", label: "Toutes" }, ...listeOptions]}
        />
      </div>

      {/* KPI (tous dépendent des filtres) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard title="Total Affectations (filtrées)" value={totalAffectationsFiltrees} icon={<span className="i-heroicons-user-group" />} />
        <KpiCard title="Total Recouvrements (≥ 0, filtrés)" value={nbRecouvrementsFiltres} icon={<span className="i-heroicons-clipboard-document-check" />} />
        <KpiCard title="Somme Totale Frais (filtrés)" value={fmtMoneyGNF(totalFrais)} tone="amber" />
        <KpiCard title="Somme Totale Payée (filtrés)" value={fmtMoneyGNF(totalPaye)} tone="emerald" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiProgress title="% Payé (filtré)" value={pctPaye} color="#10b981" subtitle={fmtMoneyGNF(totalPaye)} />
        <KpiProgress title="% Restant (filtré)" value={pctRestant} color="#ef4444" subtitle={fmtMoneyGNF(totalRestant)} />
      </div>

      {/* Graphiques (filtrés) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardChart title="Payé vs Restant par classe (filtré)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={parClasse} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 'dataMax']} allowDecimals={false} padding={{ top: 0, bottom: 0 }}/> 
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={30} />
                <Tooltip contentStyle={{ borderRadius: '12px',border: 'none',boxShadow: '0 4px 12px rgba(0,0,0,0.1)',}}
                  formatter={(value: any, name: any) => [fmtMoneyGNF(Number(value)), name]}
                />
                <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingBottom: 0, marginBottom: 0 }} />
                <Bar dataKey="paye"    stackId="a" fill="#10b981" name="Payé"    radius={[4, 4, 0, 0]} />
                <Bar dataKey="restant" stackId="a" fill="#ef4444" name="Restant" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardChart>

        <div className="grid grid-cols-1 gap-6">
          <ChartCard title="Élèves payeurs par Niveau (filtré)" data={parNiveau} color="#3b82f6" />
          <ChartCard title="Élèves payeurs par Option (filtré)" data={parOption} color="#4f46e5" />
        </div>
      </div>
    </div>
  );
}

/** ------------------------ Composants UI ------------------------ */
function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-zinc-600">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
        {options.map((opt) => (
          <option key={`${label}-${opt.value}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function KpiCard({ title, value, tone = "sky", icon }: {
  title: string;
  value: React.ReactNode;
  tone?: "sky" | "emerald" | "amber" | "rose" | "indigo" | "violet" | "slate";
  icon?: React.ReactNode;
}) {
  const toneMap: Record<string, { bg: string; text: string; ring: string }> = {
    sky: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
    violet: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
    slate: { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-200" },
  };
  const t = toneMap[tone] || toneMap.slate;

  return (
    <div className={`bg-white rounded-2xl border border-zinc-200 shadow-sm p-3 ring-1 ${t.ring}`}>
      <div className="flex items-start gap-3">
        <div className={`h-9 w-9 flex items-center justify-center rounded-lg ${t.bg} ${t.text} text-lg font-bold`}>
          {icon ?? <span>∑</span>}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-zinc-500">{title}</div>
          <div className="text-xl md:text-2xl font-black tracking-tight text-zinc-800">{value}</div>
        </div>
      </div>
    </div>
  );
}

function KpiProgress({ title, value, color = "#10b981", subtitle }: {
  title: string;
  value: number; // 0-100
  color?: string;
  subtitle?: string;
}) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-zinc-500">{title}</div>
        <div className="text-xs font-bold text-zinc-600">{fmtPct(pct)}</div>
      </div>
      <div className="mt-2 h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      {subtitle && <div className="mt-2 text-xs text-zinc-500">{subtitle}</div>}
    </div>
  );
}

function ChartCard({ title, data, color }: { title: string; data: any[]; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
      <h4 className="text-sm bg-gray-700 p-2 font-semibold text-zinc-100 mb-2 uppercase text-center tracking-wide">
        {title}
      </h4>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 10, left: -35, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={30} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CardChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
      <h4 className="text-sm bg-gray-700 p-2 font-semibold text-zinc-100 mb-2 uppercase text-center tracking-wide">
        {title}
      </h4>
      <div className="p-3">{children}</div>
    </div>
  );
}
