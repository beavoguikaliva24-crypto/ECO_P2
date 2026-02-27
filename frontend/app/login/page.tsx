/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) router.push('/dashboard');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/login/`, { username, password });
      const userData = res.data.user || res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      
      const displayName = userData.prenom || userData.first_name || userData.username || "Utilisateur";
      toast.success(`Bienvenue, ${displayName} !`);
      router.replace('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Identifiants invalides");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      
      {/* IMAGE DE FOND FLOUTÉE */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/bg.jpg')", // <--- Mets le nom de ton fichier ici
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)', // Intensité du flou
          transform: 'scale(1.1)' // Évite les bords blancs dus au flou
        }}
      />
      
      {/* OVERLAY SOMBRE (Optionnel, pour aider au contraste) */}
      <div className="absolute inset-0 bg-slate-100/50 z-10" />

      {/* CONTENEUR FORMULAIRE */}
      <div className={`relative z-20 w-full max-w-3xl flex flex-col lg:flex-row bg-white backdrop-blur-2xl rounded-[1.5rem] shadow-2xl overflow-hidden border border-white/50 transition-all duration-500 ${shake ? 'animate-shake' : ''}`}>
        
        {/* SECTION GAUCHE : FORMULAIRE */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
          <div className="mb-6 text-center lg:text-left flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-[-20px]">
                <div className="rounded-lg shadow-md">
                    <img src="/eco1.png" alt="Logo" className="h-15 w-15 object-contain" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tighter">ECORYS-224</h1>
            </div>
            <p className="text-sm text-slate-500 pt-5 font-medium tracking-tight">Veuillez vous identifier</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Utilisateur</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Identifiant"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Mot de passe</label>
                <button type="button" className="text-[11px] font-bold text-blue-600 hover:underline">Oublié ?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Connexion <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-xs">
            © {new Date().getFullYear()} ECORYS-224 Système Scolaire. Tous droits réservés.
          </p>
        </div>

        {/* SECTION DROITE (Visuel latéral) */}
        <div className="hidden md:flex lg:w-[50%] h-40 lg:h-auto relative bg-slate-100/50 border-t lg:border-t-0 lg:border-l border-white/20 overflow-hidden">
            <img
                src="/log_side3.png"
                alt="Side"
                className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-white/1" />
            
            <div className="absolute bottom-4 left-4 right-4 text-black hidden lg:block">
                <div className="bg-blue/60 backdrop-blur-md p-4 rounded-xl border border-white/30 shadow-xl">
                    <p className="text-xs text-center font-semibold leading-relaxed">Solution digitale pour l'excellence académique.</p>
                </div>
            </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}