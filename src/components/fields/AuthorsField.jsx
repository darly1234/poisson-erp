import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { phoneBrazilMask, isValidEmail } from '../../utils/masks';

const EMPTY_PESSOA = { nome: '', email: '', telefone: '' };

const DEFAULT_VALUE = {
  papel: 'Organizador',
  pessoas: [EMPTY_PESSOA]
};

const normalizePessoa = (p) => ({
  nome: p?.nome || '',
  email: p?.email || '',
  telefone: p?.telefone || ''
});

const migrateFromLegacy = (val) => {
  if (Array.isArray(val) && val.length > 0) {
    const papel = val[0]?.role || 'Organizador';
    const pessoas = val.map((p) => ({ nome: p?.nome || '', email: p?.email || '', telefone: p?.telefone || '' }));
    return { papel, pessoas };
  }
  return null;
};

const AuthorsField = ({ value, onChange }) => {
  const legacy = migrateFromLegacy(value);
  const data = value && typeof value === 'object' && Array.isArray(value.pessoas)
    ? { papel: value.papel || 'Organizador', pessoas: value.pessoas.map(normalizePessoa) }
    : legacy || DEFAULT_VALUE;

  const { papel, pessoas } = data;

  const setPapel = (novoPapel) => {
    onChange({ ...data, papel: novoPapel });
  };

  const updatePessoa = (idx, updates) => {
    const next = pessoas.map((p, i) => (i === idx ? { ...p, ...updates } : p));
    onChange({ ...data, pessoas: next });
  };

  const addPessoa = () => {
    onChange({ ...data, pessoas: [...pessoas, { ...EMPTY_PESSOA }] });
  };

  const removePessoa = (idx) => {
    if (pessoas.length <= 1) return;
    const next = pessoas.filter((_, i) => i !== idx);
    onChange({ ...data, pessoas: next });
  };

  const movePessoa = (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= pessoas.length) return;
    const next = [...pessoas];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...data, pessoas: next });
  };

  const handlePhoneChange = (idx, rawValue) => {
    if (!rawValue) {
      updatePessoa(idx, { telefone: '' });
      return;
    }
    updatePessoa(idx, { telefone: phoneBrazilMask(rawValue) });
  };

  return (
    <div className="col-span-1 md:col-span-2 space-y-4">
      <div className="flex items-center gap-4 pb-3 border-b border-slate-200">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Função do grupo</label>
        <select
          className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500 transition-all min-w-[160px]"
          value={papel}
          onChange={(e) => setPapel(e.target.value)}
        >
          <option value="Organizador">Organizador</option>
          <option value="Autor">Autor</option>
        </select>
      </div>

      <div className="space-y-3">
        {pessoas.map((pessoa, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 flex-wrap md:flex-nowrap"
          >
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => movePessoa(idx, -1)}
                disabled={idx === 0}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                title="Subir"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => movePessoa(idx, 1)}
                disabled={idx === pessoas.length - 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                title="Descer"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-2 md:gap-3">
              <input
                type="text"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                placeholder="Nome"
                value={pessoa.nome || ''}
                onChange={(e) => updatePessoa(idx, { nome: e.target.value })}
              />
              <input
                type="email"
                className={`w-full h-10 px-3 bg-slate-50 border rounded-lg text-xs font-bold outline-none transition-all placeholder:text-slate-300 ${
                  pessoa.email && !isValidEmail(pessoa.email)
                    ? 'border-amber-400 focus:border-amber-500'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="E-mail"
                value={pessoa.email || ''}
                onChange={(e) => updatePessoa(idx, { email: e.target.value })}
              />
              <input
                type="tel"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                placeholder="+55 (XX) XXXXX-XXXX"
                value={pessoa.telefone || ''}
                onChange={(e) => handlePhoneChange(idx, e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => removePessoa(idx)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Remover"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPessoa}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Adicionar pessoa
      </button>
    </div>
  );
};

export default AuthorsField;
export { EMPTY_PESSOA, DEFAULT_VALUE };
