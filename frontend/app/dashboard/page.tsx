"use client";
import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import StatEleve from './StatEleves';
import StatAffectations from './StatAffectations';

export default function DashboardPage() {
  const [eleves, setEleves] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    // Utilisation de Promise.all pour charger les deux sources
    Promise.all([
      fetch(`${apiUrl}/eleves/`).then(res => res.ok ? res.json() : []),
      fetch(`${apiUrl}/affectations/`).then(res => res.ok ? res.json() : [])
    ])
    .then(([elevesData, affData]) => {
      setEleves(elevesData);
      setAffectations(affData);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erreur de chargement des données:", err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center">Chargement des statistiques...</div>;

  return (
    <AuthGuard>
      <div className="max-w-8xl mx-auto space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tableau de Bord - Eco1</h1>
          <p className="text-zinc-500">Statistiques en temps réel de l&apos;établissement</p>
        </div>
        
        {/* Ton code StatEleve corrigé s'affichera ici */}
        <StatEleve eleves={eleves} />
        
        {/* Ton code StatAffectations corrigé s'affichera ici */}
        <StatAffectations affectations={affectations} />
      </div>
    </AuthGuard>
  );
}