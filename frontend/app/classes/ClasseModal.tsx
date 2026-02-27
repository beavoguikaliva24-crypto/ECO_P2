/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	refreshList: () => void;
	selectedClasse?: any;
}

export default function ClasseModal({ isOpen, onClose, refreshList, selectedClasse }: Props) {
	const [form, setForm] = useState({ code_classe: '', lib_classe: '', niveau_classe: '', option_classe: '' });
	const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api" || "http://beapc:8000/api"|| "http://127.0.0.1:8000/api";

	const niveauChoices = [
		{ value: 'cre', label: 'Crèche' },
		{ value: 'mat', label: 'Maternel' },
		{ value: 'pri', label: 'Primaire' },
		{ value: 'clg', label: 'Collège' },
		{ value: 'lyc', label: 'Lycée' },
		{ value: 'aut', label: 'Autres' },
	];
	const optionChoices = [
		{ value: 'se', label: 'Sciences Expérimentales' },
		{ value: 'sm', label: 'Sciences Mathématiques' },
		{ value: 'ss', label: 'Sciences Sociales' },
		{ value: 'sc', label: 'Scientifiques' },
		{ value: 'lit', label: 'Littéraires' },
		{ value: 'aut', label: 'Autres' },
	];

	useEffect(() => {
		if (selectedClasse) setForm({ code_classe: selectedClasse.code_classe || '', lib_classe: selectedClasse.lib_classe || '', niveau_classe: selectedClasse.niveau_classe || '', option_classe: selectedClasse.option_classe || '' });
		else setForm({ code_classe: '', lib_classe: '', niveau_classe: '', option_classe: '' });
	}, [selectedClasse, isOpen]);

	const handleSave = async () => {
		try {
			if (selectedClasse) {
				await axios.put(`${API}/classes/${selectedClasse.id}/`, form);
				toast.success('Classe mise à jour');
			} else {
				await axios.post(`${API}/classes/`, form);
				toast.success('Classe créée');
			}
			refreshList();
			onClose();
		} catch (err: any) {
			console.error(err?.response || err);
			toast.error('Erreur lors de l\'enregistrement');
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
			<div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
				<div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
							<Save size={20} />
						</div>
						<h2 className="text-xl font-black text-slate-800">{selectedClasse ? 'Modifier la classe' : 'Nouvelle classe'}</h2>
					</div>
					<button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400">
						<X size={24} />
					</button>
				</div>

				<form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6">
					<div className="grid grid-cols-1 gap-4">
						<div>
							<label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Code</label>
							<input required value={form.code_classe} onChange={(e) => setForm({ ...form, code_classe: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" />
						</div>
						<div>
							<label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Libellé</label>
							<input required value={form.lib_classe} onChange={(e) => setForm({ ...form, lib_classe: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" />
						</div>
						<div>
							<label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Niveau</label>
							<select value={form.niveau_classe} onChange={(e) => setForm({ ...form, niveau_classe: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500">
								{niveauChoices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
							</select>
						</div>
						<div>
							<label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Option</label>
							<select value={form.option_classe} onChange={(e) => setForm({ ...form, option_classe: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500">
								{optionChoices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
							</select>
						</div>
					</div>

					<div className="flex gap-4 mt-6">
						<button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-2xl font-bold">Annuler</button>
						<button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold">{selectedClasse ? 'Mettre à jour' : 'Créer'}</button>
					</div>
				</form>
			</div>
		</div>
	);
}
