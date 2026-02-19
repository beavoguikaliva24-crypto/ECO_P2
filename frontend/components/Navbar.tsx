"use client";
import { useEffect, useState } from 'react';
import { logout } from '@/lib/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="navbar bg-white shadow-md px-6 py-3 flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">Bienvenue,</span>
        <span className="font-bold text-blue-600">{user?.prenom} {user?.nom}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="badge badge-outline p-3 uppercase font-semibold text-xs">
          {user?.role || "Utilisateur"}
        </span>
        <button 
          onClick={logout}
          className="btn btn-sm btn-error btn-outline"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}