import React from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

const ColumnManager = ({ visibleColumns, setVisibleColumns, allFields, onClose }) => (
  <div className="absolute right-10 top-40 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-5 animate-in zoom-in-95 origin-top-right">
    <div className="flex justify-between items-center mb-4 border-b pb-3">
      <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Configurar Grelha</span>
      <button onClick={onClose} className="text-slate-300 hover:text-red-500 p-1"><X size={16} /></button>
    </div>
    <div className="max-h-[350px] overflow-y-auto scrollbar-thin pr-1 space-y-4">
      <div className="space-y-2">
        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-2">Visibilidade & Ordem</span>
        {visibleColumns.map((colId, idx) => {
          const field = allFields.find(f => f.id === colId) || { label: 'ID', id: 'id' };
          if (field.isVisible === false && colId !== 'id') return null;
          return (
            <div key={colId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 group">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => setVisibleColumns(prev => prev.filter(c => c !== colId))}
                  className="w-4 h-4 rounded-md text-blue-600 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-700">{field.label}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { const n = [...visibleColumns]; if (idx > 0) [n[idx], n[idx - 1]] = [n[idx - 1], n[idx]]; setVisibleColumns(n); }} className="p-1 hover:bg-white rounded text-slate-400 hover:text-blue-600"><ArrowUp size={12} /></button>
                <button onClick={() => { const n = [...visibleColumns]; if (idx < n.length - 1) [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; setVisibleColumns(n); }} className="p-1 hover:bg-white rounded text-slate-400 hover:text-blue-600"><ArrowDown size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Disponíveis</span>
        {allFields.concat({ id: 'id', label: 'ID' })
          .filter(f => !visibleColumns.includes(f.id) || (f.isVisible === false && f.id !== 'id'))
          .map(field => {
            const isMetadataInvisible = field.isVisible === false && field.id !== 'id';
            return (
              <div
                key={field.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border border-transparent transition-all ${isMetadataInvisible ? 'bg-red-50 hover:bg-red-100/50' : 'hover:bg-slate-50 cursor-pointer'}`}
                onClick={() => { if (!isMetadataInvisible) setVisibleColumns(prev => [...prev, field.id]); }}
              >
                <input type="checkbox" checked={false} readOnly className={`w-4 h-4 rounded-md ${isMetadataInvisible ? 'text-red-300 border-red-200' : 'text-slate-300'}`} />
                <span className={`text-[11px] font-bold ${isMetadataInvisible ? 'text-red-500' : 'text-slate-400'}`}>
                  {field.label} {isMetadataInvisible && <span className="text-[8px] opacity-60 ml-1 font-black">(INVISÍVEL)</span>}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  </div>
);

export default ColumnManager;
