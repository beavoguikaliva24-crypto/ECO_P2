"use client";
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Eleve {
  sexe: 'M' | 'F' | 'O';
}

export default function StatEleve({ eleves = [] }: { eleves?: Eleve[] }) {
    const stats = useMemo(() => {
    const total = eleves.length;
    const garcons = eleves.filter(e => e.sexe === 'M').length;
    const filles = eleves.filter(e => e.sexe === 'F').length;
    const autres = eleves.filter(e => e.sexe === 'O').length;
    
    const pourcentageG = total > 0 ? ((garcons / total) * 100).toFixed(1) : "0";
    const pourcentageF = total > 0 ? ((filles / total) * 100).toFixed(1) : "0";
    const pourcentageO = total > 0 ? ((autres / total) * 100).toFixed(1) : "0";

    // Données pour l'histogramme
    const chartData = [
      { name: 'Garçons', valeur: garcons, color: '#3b82f6' },
      { name: 'Filles', valeur: filles, color: '#ec4899' },
      { name: 'Autres', valeur: autres, color: '#eab308' },
    ];

    return { total, garcons, filles, autres, pourcentageG, pourcentageF, pourcentageO, chartData };
  }, [eleves]);

  return (
    <div className="space-y-5">
      {/* --- GRILLE DES CARTES --- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {/* Carte : Total */}
        <div className="bg-gray-200 pl-2 p-3 rounded-2xl shadow-sm border border-zinc-200">
          <span className="p-2 bg-gray-500 text-gray-100 rounded-lg text-sm font-semibold">Total</span>
          <h3 className="text-4xl font-black text-zinc-900 mt-4">{stats.total}</h3>
          <p className="text-sm text-zinc-500">Élèves enregistrés</p>
        </div>

        {/* Carte : Garçons */}
        <div className="bg-blue-50 pl-2 p-3 rounded-2xl shadow-sm border border-zinc-200 border-t-4 border-t-blue-500">
          <div className="flex flex-wrap justify-between items-center">
            <span className="p-1 text-sm font-bold text-zinc-100 bg-blue-500 rounded-lg uppercase">Garçons</span>
            <span className="text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded text-xs">{stats.pourcentageG}%</span>
          </div>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">{stats.garcons}</h3>
          <div className="w-full bg-zinc-300 h-2 rounded-full mt-4">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.pourcentageG}%` }}></div>
          </div>
        </div>

        {/* Carte : Filles */}
        <div className="bg-pink-50 pl-2 p-3 rounded-2xl shadow-sm border border-zinc-200 border-t-4 border-t-pink-500">
          <div className="flex flex-wrap justify-between items-center">
            <span className="p-1 text-sm font-bold text-zinc-100 bg-pink-500 rounded-lg uppercase">Filles</span>
            <span className="text-pink-600 font-bold bg-pink-100 px-2 py-1 rounded text-xs">{stats.pourcentageF}%</span>
          </div>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">{stats.filles}</h3>
          <div className="w-full bg-zinc-300 h-2 rounded-full mt-4">
            <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${stats.pourcentageF}%` }}></div>
          </div>
        </div>

        {/* Carte : Autres */}
        <div className="bg-yellow-50 pl-2 p-3 rounded-2xl shadow-sm border border-zinc-200 border-t-4 border-t-yellow-500">
          <div className="flex flex-wrap justify-between items-center">
            <span className="p-1 text-sm font-bold text-zinc-100 bg-yellow-500 rounded-lg uppercase">Autres</span>
            <span className="text-yellow-600 font-bold bg-yellow-100 px-2 py-1 rounded text-xs">{stats.pourcentageO}%</span>
          </div>
          <h3 className="text-4xl font-black text-zinc-900 mt-2">{stats.autres}</h3>
          <div className="w-full bg-zinc-300 h-2 rounded-full mt-4">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${stats.pourcentageO}%` }}></div>
          </div>
        </div>
        {/* --- SECTION HISTOGRAMME --- */}
      <div className="bg-white pl-2 rounded-2xl shadow-sm border border-zinc-200">
        <h3 className="text-sm font-bold text-zinc-100 ml-[-9] mb-2 mt-[-10p] p-1 bg-blue-900 text-center">Répartition Graphique</h3>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 0, right: 2, left: -40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />1
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="valeur" radius={[10, 10, 0, 0]} barSize={60}>
                {stats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </div>
  );
}