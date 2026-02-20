/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  // Empêcher l'accès si déjà connecté
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Envoi des identifiants :", { username, password });
      // Appel à ton API Django (LoginView)
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
        username,
        password
      });

      // Dans handleLogin, après la requête axios réussie
const userData = res.data.user || res.data; // Prend 'user' s'il existe, sinon l'objet entier

localStorage.setItem('user', JSON.stringify(userData));
      
     // On vérifie plusieurs clés possibles (prenom, first_name, username)
const displayName = userData.prenom || userData.first_name || userData.username || "Utilisateur";

toast.success(`Bienvenue ${displayName} !`);

// Redirection
router.replace('/dashboard');
      
    } catch (error: any) {
      console.log("Détails de l'erreur backend:", error.response?.data);
      // 1. On récupère le message d'erreur précis envoyé par Django
      // Django renvoie souvent soit { error: "..." } soit { detail: "..." }
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           "Identifiants invalides";

      // 2. On affiche le toast d'erreur
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });

      // 3. Shake animation
      setShake(true);
      setTimeout(() => setShake(false), 500);

      console.error("Login Error Status:", error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-700">ECO1</h1>
          <p className="text-gray-500 mt-2">Gestion Scolaire - Connexion</p>
        </div>

        <form onSubmit={handleLogin} className={`space-y-6 ${shake ? 'animate-shake' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Ex: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Vérification...
              </span>
            ) : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}