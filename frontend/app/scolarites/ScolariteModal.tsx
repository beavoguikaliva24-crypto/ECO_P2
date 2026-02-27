/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  refreshList: () => void;
  selectedScolarite?: any;
}

export default function ScolariteModal({ isOpen, onClose, refreshList, selectedScolarite }: Props){
  const [form, setForm] = useState({ annee_fs: '', classe_fs: '', frais_annuel: '', t1_fs: '', t2_fs: '', t3_fs: '' });
  const [annees, setAnnees] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const fetchRefs = async () => {
      try{
        const [aRes, cRes] = await Promise.all([axios.get(`${API}/annees/`), axios.get(`${API}/classes/`)]);
        setAnnees(aRes.data);
        setClasses(cRes.data);
      }catch(err){ console.error(err); }
    };
    fetchRefs();
  }, []);

  useEffect(() => {
    if(selectedScolarite) setForm({ annee_fs: selectedScolarite.annee_fs || '', classe_fs: selectedScolarite.classe_fs || '', frais_annuel: selectedScolarite.frais_annuel ?? '', t1_fs: selectedScolarite.t1_fs ?? '', t2_fs: selectedScolarite.t2_fs ?? '', t3_fs: selectedScolarite.t3_fs ?? '' });
    else setForm({ annee_fs: '', classe_fs: '', frais_annuel: '', t1_fs: '', t2_fs: '', t3_fs: '' });
  }, [selectedScolarite, isOpen]);

  const handleSave = async () => {
    try{
      const payload = {
        annee_fs: form.annee_fs,
        classe_fs: form.classe_fs,
        frais_annuel: Number(form.frais_annuel) || 0,
        t1_fs: Number(form.t1_fs) || 0,
        t2_fs: Number(form.t2_fs) || 0,
        t3_fs: Number(form.t3_fs) || 0,
      };
      if(selectedScolarite) await axios.put(`${API}/frais/${selectedScolarite.id}/`, payload);
      else await axios.post(`${API}/frais/`, payload);
      toast.success('Enregistré');
      refreshList();
      onClose();
    }catch(err:any){ console.error(err?.response || err); toast.error('Erreur'); }
  };

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white"><Save size={20}/></div>
            <h2 className="text-xl font-black">{selectedScolarite ? 'Modifier frais' : 'Nouveau frais'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-full text-slate-400"><X size={22}/></button>
        </div>

        <form onSubmit={(e)=>{ e.preventDefault(); handleSave(); }} className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Année</label>
            <select required value={form.annee_fs} onChange={(e)=> setForm({ ...form, annee_fs: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl">
              <option value="">-- Choisir --</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.annee_scolaire}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Classe</label>
            <select required value={form.classe_fs} onChange={(e)=> setForm({ ...form, classe_fs: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl">
              <option value="">-- Choisir --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.lib_classe}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Frais annuels</label>
            <input type="number" value={form.frais_annuel} onChange={(e)=> setForm({ ...form, frais_annuel: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">1ère tranche</label>
            <input type="number" value={form.t1_fs} onChange={(e)=> setForm({ ...form, t1_fs: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">2ème tranche</label>
            <input type="number" value={form.t2_fs} onChange={(e)=> setForm({ ...form, t2_fs: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">3ème tranche</label>
            <input type="number" value={form.t3_fs} onChange={(e)=> setForm({ ...form, t3_fs: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" />
          </div>

          <div className="col-span-2 flex gap-4 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-2xl">Annuler</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl">{selectedScolarite ? 'Mettre à jour' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
