import React from 'react';
import { Settings, BarChart3, Layers } from 'lucide-react';

const Sidebar = ({ view, onNavigate }) => (
  <aside className="w-60 bg-[#1F2A8A] text-white flex flex-col shrink-0 shadow-xl z-30">
    <div className="p-5 border-b border-white/10 flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transform -rotate-3">P</div>
      <div className="flex flex-col">
        <span className="font-bold uppercase text-white tracking-tight">Poisson ERP</span>
        <span className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.2em]">Enterprise Suite</span>
      </div>
    </div>
    <nav className="flex-1 py-6 px-3 space-y-1">
      <button
        onClick={() => onNavigate('list')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-white/10 text-white font-semibold shadow-inner border border-white/5' : 'text-blue-100/60 hover:bg-white/5'}`}
      >
        <Layers size={18} /> Acervo Digital
      </button>
      <button
        onClick={() => onNavigate('dashboard')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-white/10 text-white font-semibold shadow-inner border border-white/5' : 'text-blue-100/60 hover:bg-white/5'}`}
      >
        <BarChart3 size={18} /> Dashboard
      </button>
      <button
        onClick={() => onNavigate('config')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'config' ? 'bg-white/10 text-white font-semibold shadow-inner border border-white/5' : 'text-blue-100/60 hover:bg-white/5'}`}
      >
        <Settings size={18} /> Configurações
      </button>
    </nav>
    <div className="p-4 bg-black/20 border-t border-white/10 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">DA</div>
      <div className="flex flex-col">
        <span className="text-xs font-bold leading-none">Darly</span>
        <span className="text-[9px] text-blue-300/80 uppercase mt-1.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Admin
        </span>
      </div>
    </div>
  </aside>
);

export default Sidebar;
