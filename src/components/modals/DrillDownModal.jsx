import React, { useState } from 'react';
import { X, Edit2, Search } from 'lucide-react';

/**
 * DrillDownModal
 * Shows all records that match a specific field/value filter.
 * Allows the user to click "Editar" to navigate into the full detail view.
 */
const DrillDownModal = ({ field, category, records, allFields, onClose, onOpenRecord }) => {
    const [search, setSearch] = useState('');

    // Filter records where this field matches the clicked category
    const filtered = records.filter((r) => {
        const val = r.data?.[field.id];
        return String(val ?? '').trim() === String(category).trim();
    });

    const searched = search.trim()
        ? filtered.filter((r) => {
            const title = r.data?.title || r.data?.nome || r.data?.name || Object.values(r.data || {})[0] || '';
            return String(title).toLowerCase().includes(search.toLowerCase()) || String(r.id).includes(search);
        })
        : filtered;

    // Determine a display name for each record
    const getRecordTitle = (record) =>
        record.data?.title || record.data?.nome || record.data?.name ||
        Object.values(record.data || {}).find(v => typeof v === 'string' && v.length > 2) ||
        `Registro #${record.id}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{field.label}</p>
                        <h2 className="text-lg font-black text-white">{category}</h2>
                        <p className="text-[11px] text-white/70 mt-0.5">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar dentro destes registros..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Records list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                    {searched.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            Nenhum registro encontrado.
                        </div>
                    ) : (
                        searched.map((record) => {
                            const title = getRecordTitle(record);
                            // Show a few extra fields as metadata
                            const extraFields = allFields
                                .filter(f => f.id !== field.id && f.isVisible !== false)
                                .slice(0, 3);

                            return (
                                <div
                                    key={record.id}
                                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-2xl transition-all group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">#{record.id}</span>
                                            <p className="text-sm font-black text-slate-800 truncate">{title}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {extraFields.map(f => {
                                                const val = record.data?.[f.id];
                                                if (!val) return null;
                                                return (
                                                    <span key={f.id} className="text-[10px] text-slate-500">
                                                        <span className="font-semibold text-slate-400">{f.label}:</span> {String(val).slice(0, 40)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onOpenRecord(record)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 size={12} />
                                        Abrir
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 text-center">
                        Clique em <span className="font-bold text-indigo-600">Abrir</span> para visualizar e editar um registro completo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DrillDownModal;
