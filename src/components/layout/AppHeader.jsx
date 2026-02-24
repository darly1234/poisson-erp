import React from 'react';
import { ChevronRight, Mail, Save } from 'lucide-react';
import Button from '../ui/Button';

const AppHeader = ({ view, setView }) => (
  <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
      <span>Poisson</span>
      <ChevronRight size={10} />
      <span className="text-slate-900">
        {view === 'list' ? 'Acervo' : view === 'dashboard' ? 'BI' : 'Ajustes'}
      </span>
    </div>
    <div className="flex items-center gap-4">
      {view === 'detail' && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-right-2">
          <Button variant="outline" size="sm" onClick={() => setView('list')}>Voltar</Button>
          <Button variant="primary" size="sm" icon={Save} onClick={() => setView('list')}>Guardar Registro</Button>
        </div>
      )}
      <div className="h-6 w-px bg-slate-200" />
      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
        <Mail size={18} />
      </button>
    </div>
  </header>
);

export default AppHeader;
