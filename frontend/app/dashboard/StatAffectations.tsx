"use client";
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Importez vos constantes ou définissez-les ici
const NIVEAU_CHOIX = [
  { value: 'cre', label: 'Crèche' },
  { value: 'mat', label: 'Maternel' },
  { value: 'pri', label: 'Primaire' },
  { value: 'clg', label: 'Collège' },
  { value: 'lyc', label: 'Lycée' },
  { value: 'aut', label: 'Autres' },
];

const OPTION_CHOIX = [
  { value: 'se', label: 'Sciences Expérimentales' },
  { value: 'sm', label: 'Sciences Maths' },
  { value: 'ss', label: 'Sciences Sociales' },
  { value: 'sc', label: 'Scientifiques' },
  { value: 'lit', label: 'Littéraires' },
  { value: 'aut', label: 'Autres' },
];

export default function StatAffectations({ affectations = [] }) {
  const [selectedAnnee, setSelectedAnnee] = useState("");

  // Fonctions de traduction pour les graphiques
  const getNiveauLabel = (val) => NIVEAU_CHOIX.find(n => n.value === val)?.label || val;
  const getOptionLabel = (val) => OPTION_CHOIX.find(o => o.value === val)?.label || val;

  const listeAnnees = useMemo(() => {
    const annees = affectations.map(a => a.annee_nom).filter(Boolean); // Utilisation de annee_nom simplifié
    return Array.from(new Set(annees)).sort().reverse();
  }, [affectations]);

  const dataFiltree = useMemo(() => {
    return selectedAnnee 
      ? affectations.filter(a => a.annee_nom === selectedAnnee)
      : affectations;
  }, [affectations, selectedAnnee]);

  const stats = useMemo(() => {
    // 1. Par Année
    const anneesMap = affectations.reduce((acc, a) => {
      const label = a.annee_nom || "N/A";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    // 2. Par Option (Traduction du code en Label)
    const optionsMap = dataFiltree.reduce((acc, a) => {
      const rawValue = a.option_classe || "aut";
      const label = getOptionLabel(rawValue);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    // 3. Par Niveau (Traduction du code en Label)
    const niveauxMap = dataFiltree.reduce((acc, a) => {
      const rawValue = a.niveau_classe || "aut";
      const label = getNiveauLabel(rawValue);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return {
      dataAnnee: Object.keys(anneesMap).map(k => ({ name: k, total: anneesMap[k] })),
      dataOption: Object.keys(optionsMap).map(k => ({ name: k, total: optionsMap[k] })),
      dataNiveau: Object.keys(niveauxMap).map(k => ({ name: k, total: niveauxMap[k] }))
    };
  }, [affectations, dataFiltree]);

  return (
    <div className="space-y-3">
      {/* Filtre */}
      <div className="bg-white p-2 rounded-xl border border-zinc-200 flex items-center gap-4 shadow-sm">
        <span className="text-sm font-semibold text-zinc-600">Filtrer par année :</span>
        <select 
          value={selectedAnnee} 
          onChange={(e) => setSelectedAnnee(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les années</option>
          {listeAnnees.map(an => <option key={an} value={an}>{an}</option>)}
        </select>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Par année" data={stats.dataAnnee} color="#4f46e5" />
        <ChartCard title="Par Option" data={stats.dataOption} color="#3b82f6" />
        <ChartCard title="Par Niveau" data={stats.dataNiveau} color="#10b981" />
      </div>
    </div>
  );
}

// Composant réutilisable pour éviter la répétition
function ChartCard({ title, data, color }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
      <h4 className="text-sm bg-gray-600 p-1 font-bold text-zinc-100 mb-2 uppercase text-center">{title}</h4>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 10, left: -35, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
                dataKey="name" 
                tick={{fontSize: 10}} 
                interval={0} 
                angle={-20} 
                textAnchor="end" 
                height={30}
            />
            <YAxis tick={{fontSize: 12}} />
            <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}