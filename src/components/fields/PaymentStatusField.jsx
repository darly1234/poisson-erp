import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const EMPTY_PARCEL = { valor: '', status: 'Em aberto' };
const STATUS_OPTIONS = ['Em aberto', 'Pago', 'Atrasado', 'Cancelado'];
const MAIN_STATUS_OPTIONS = ['Em aberto', 'Pago', 'Cortesia', 'Permuta', 'Parcelado'];

// Helper for formatting currency string to number or formatted display, adapted from masks
const formatCurrency = (val) => {
    if (!val) return '';
    let num = String(val).replace(/\D/g, '');
    if (!num) return '';
    num = (Number(num) / 100).toFixed(2);
    return Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const PaymentStatusField = ({ value, onChange }) => {
    // Migrate from old string format or empty to new object format
    const data = typeof value === 'object' && value !== null
        ? value
        : { status: typeof value === 'string' ? value : 'Em aberto', parcelas: [] };

    const status = data.status || 'Em aberto';
    const parcelas = Array.isArray(data.parcelas) ? data.parcelas : [];

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        onChange({ ...data, status: newStatus });
    };

    const updateParcelas = (newParcelas) => {
        onChange({ ...data, parcelas: newParcelas });
    };

    const handleQtdChange = (e) => {
        let qtd = parseInt(e.target.value) || 0;
        if (qtd < 0) qtd = 0;
        if (qtd > 60) qtd = 60; // Hard limit

        let newParcelas = [...parcelas];
        if (qtd > newParcelas.length) {
            const diff = qtd - newParcelas.length;
            for (let i = 0; i < diff; i++) {
                newParcelas.push({ ...EMPTY_PARCEL });
            }
        } else if (qtd < newParcelas.length) {
            newParcelas = newParcelas.slice(0, qtd);
        }
        updateParcelas(newParcelas);
    };

    const updateParcela = (idx, updates) => {
        const next = parcelas.map((p, i) => (i === idx ? { ...p, ...updates } : p));
        updateParcelas(next);
    };

    const removeParcela = (idx) => {
        const next = parcelas.filter((_, i) => i !== idx);
        updateParcelas(next);
    };

    const addParcela = () => {
        updateParcelas([...parcelas, { ...EMPTY_PARCEL }]);
    };

    return (
        <div className="col-span-1 md:col-span-2 space-y-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                    Status Geral do Pagamento
                </label>
                <select
                    className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                    value={status}
                    onChange={handleStatusChange}
                >
                    {MAIN_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            {status === 'Parcelado' && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            Número de Parcelas
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="60"
                            value={parcelas.length || ''}
                            onChange={handleQtdChange}
                            className="w-24 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-center"
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-3">
                        {parcelas.map((parcela, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 md:gap-4 p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex-wrap md:flex-nowrap"
                            >
                                <div className="w-16 shrink-0 text-center text-[10px] font-black uppercase text-slate-400">
                                    Parcela {idx + 1}
                                </div>

                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                                        placeholder="Valor (R$)"
                                        value={parcela.valor || ''}
                                        onChange={(e) => {
                                            const val = String(e.target.value).replace(/\D/g, '');
                                            updateParcela(idx, { valor: val ? formatCurrency(val) : '' });
                                        }}
                                    />
                                    <select
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                        value={parcela.status || 'Em aberto'}
                                        onChange={(e) => updateParcela(idx, { status: e.target.value })}
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeParcela(idx)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                    title="Remover Parcela"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}

                        {parcelas.length > 0 && (
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={addParcela}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} /> Adicionar Parcela Avulsa
                                </button>
                            </div>
                        )}
                        {parcelas.length === 0 && (
                            <div className="text-[10px] text-slate-400 italic px-2">Nenhuma parcela configurada. Digite o número acima para começar.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentStatusField;
