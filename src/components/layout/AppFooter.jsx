import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

const AppFooter = () => (
  <footer className="h-10 bg-white border-t flex items-center justify-between px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] shrink-0 z-20">
    <div className="flex gap-8 items-center">
      <span className="flex items-center gap-2 font-bold text-blue-900">
        <Database size={12} /> Poisson v16.13
      </span>
      <div className="h-3 w-px bg-slate-200" />
      <span className="flex items-center gap-2 text-green-600 font-bold">
        <CheckCircle2 size={12} /> Text Selection Freed
      </span>
    </div>
    <div>Darly © 2026</div>
  </footer>
);

export default AppFooter;
