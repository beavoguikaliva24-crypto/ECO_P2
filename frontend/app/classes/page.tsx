"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../dashboard/layout';
import { 
  Plus, Edit, Search, Trash2, UserCircle, Users, ChevronLeft, ChevronRight, 
  FileSpreadsheet, FileText, Download } from 'lucide-react';


export default function ClassesPage(){ 

    /*if (loading) return <div className="p-10 text-center">Chargement des statistiques...</div>;*/
    return (
        <DashboardLayout>
            <div className="p-3">
                {/* On utilise h-full sur le conteneur principal pour que le scroll interne fonctionne */}
                <div className="flex flex-col h-[calc(97vh-70px)] p-1 bg-slate-50">
            
                    {/* HEADER & STATS (Statiques en haut) */}
                    <div className="flex-none">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Classes</h1>
                                <p className="text-sm text-slate-500 font-medium"></p>
                            </div>
                            <button
                            className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-100 transition-all"
                            >
                                <Plus size={18}/> Enregistrer une classe
                            </button>
                        </div>
                    </div>
                </div>
            </div>  
            {/* Ton code StatEleve corrigé s'affichera ici */}
        </DashboardLayout>
    );
}