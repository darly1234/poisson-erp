import React from 'react';
import { Filter, PlusCircle, Copy, Trash2, SaveAll, Plus, PlusSquare, X, Activity } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const FilterView = ({
  savedFilters, setSavedFilters,
  editingFilter, setEditingFilter,
  allFields,
  setActiveFilterId,
  getOperatorsByField,
  updateRuleInBlock,
  saveFilter,
  setConfirmModal
}) => (
  <div className="w-full space-y-6 animate-slide">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl"><Filter size={20} className="md:w-6 md:h-6" /></div>
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Filtros</h2>
          <p className="text-[10px] md:text-xs text-slate-400 font-medium">Lógica booleana por blocos e regras.</p>
        </div>
      </div>
      <Button
        variant="primary" size="sm" icon={PlusCircle}
        className="w-full sm:w-auto"
        onClick={() => setEditingFilter({
          id: null, name: '', globalLogic: 'AND',
          blocks: [{ id: 'b1', logic: 'AND', rules: [{ fieldId: allFields[0]?.id, operator: 'contains', value: '' }] }]
        })}
      >
        Novo Filtro
      </Button>
    </div>

    <div className="grid grid-cols-12 gap-6 md:gap-8 items-start">
      <div className="col-span-12 lg:col-span-4 space-y-4">
        {savedFilters.map(f => (
          <div key={f.id} className={`p-4 md:p-5 rounded-2xl border bg-white group cursor-pointer transition-all ${editingFilter?.id === f.id ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-lg' : 'border-slate-200 hover:border-blue-300'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs md:text-[13px] font-bold text-slate-800">{f.name}</span>
              <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => { e.stopPropagation(); setSavedFilters([...savedFilters, { ...f, id: `f-${Date.now()}`, name: `${f.name} (Cópia)` }]); }} className="text-slate-400 hover:text-blue-500"><Copy size={13} /></button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmModal({
                      show: true,
                      type: 'filter',
                      id: f.id,
                      label: f.name
                    });
                  }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <span className={`text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${f.globalLogic === 'AND' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              {f.globalLogic === 'AND' ? 'Prender Tudo' : 'Qualquer Um'}
            </span>
            <button
              onClick={() => setEditingFilter(f)}
              className="mt-4 w-full py-2 text-[9px] md:text-[10px] font-black text-blue-700 bg-slate-50 hover:bg-blue-700 hover:text-white rounded-xl uppercase tracking-wider transition-all"
            >
              Editar Estrutura
            </button>
          </div>
        ))}
      </div>

      <div className="col-span-12 lg:col-span-8">
        {editingFilter ? (
          <Card className="p-4 md:p-8 space-y-6 md:space-y-8 border-blue-100 shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Identificação do Filtro</label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs md:text-sm outline-none focus:border-blue-500"
                  value={editingFilter.name}
                  onChange={e => setEditingFilter({ ...editingFilter, name: e.target.value })}
                  onKeyDown={e => e.stopPropagation()}
                  placeholder="Ex: Livros Específicos"
                />
              </div>
              <div className="md:w-56 space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Lógica Global</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setEditingFilter({ ...editingFilter, globalLogic: 'AND' })} className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-[10px] font-black rounded-lg ${editingFilter.globalLogic === 'AND' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-400'}`}>TODOS (E)</button>
                  <button onClick={() => setEditingFilter({ ...editingFilter, globalLogic: 'OR' })} className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-[10px] font-black rounded-lg ${editingFilter.globalLogic === 'OR' ? 'bg-white shadow-sm text-amber-700' : 'text-slate-400'}`}>QUALQUER (OU)</button>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              {editingFilter.blocks.map((block, bIdx) => (
                <div key={block.id} className="p-4 md:p-6 border border-slate-100 bg-slate-50/50 rounded-2xl md:rounded-3xl border-l-[6px] border-l-blue-600 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">BLOCO {bIdx + 1}</span>
                      <div className="flex bg-slate-200/50 p-0.5 rounded-lg">
                        <button onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, logic: 'AND' } : b) })} className={`px-2 py-0.5 text-[8px] md:text-[9px] font-black rounded ${block.logic === 'AND' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>E</button>
                        <button onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, logic: 'OR' } : b) })} className={`px-2 py-0.5 text-[8px] md:text-[9px] font-black rounded ${block.logic === 'OR' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}>OU</button>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmModal({
                        show: true,
                        type: 'filter_block',
                        id: block.id,
                        label: `Bloco ${bIdx + 1}`
                      })}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    {block.rules.map((rule, rIdx) => {
                      const ops = getOperatorsByField(rule.fieldId);
                      return (
                        <div key={rIdx} className="flex flex-col md:flex-row gap-2 items-stretch md:items-center bg-white p-3 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm relative">
                          <select className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] md:text-[11px] font-bold outline-none" value={rule.fieldId} onChange={e => updateRuleInBlock(block.id, rIdx, { fieldId: e.target.value, operator: getOperatorsByField(e.target.value)[0].id })}>
                            {allFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                          </select>
                          <select className="md:w-36 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] md:text-[11px] font-bold outline-none" value={rule.operator} onChange={e => updateRuleInBlock(block.id, rIdx, { operator: e.target.value })}>
                            {ops.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                          {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                            <div className="flex-1 md:flex-[2] flex gap-2">
                              <input type="text" className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] md:text-xs outline-none" value={rule.value} onChange={e => updateRuleInBlock(block.id, rIdx, { value: e.target.value })} onKeyDown={e => e.stopPropagation()} />
                              {rule.operator === 'between' && <input type="number" className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] md:text-xs outline-none" value={rule.value2 || ''} onChange={e => updateRuleInBlock(block.id, rIdx, { value2: e.target.value })} onKeyDown={e => e.stopPropagation()} />}
                            </div>
                          )}
                          <button onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, rules: b.rules.filter((_, i) => i !== rIdx) } : b) })} className="absolute top-2 right-2 md:static p-1 text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, rules: [...b.rules, { fieldId: allFields[0]?.id, operator: 'contains', value: '' }] } : b) })}
                      className="flex items-center gap-1.5 text-blue-700 text-[9px] md:text-[10px] font-black uppercase hover:underline mt-2 px-1 tracking-widest"
                    >
                      <PlusSquare size={14} /> Condição
                    </button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline" size="sm" className="w-full border-dashed py-3 md:py-4 rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase" icon={Plus}
                onClick={() => setEditingFilter({ ...editingFilter, blocks: [...editingFilter.blocks, { id: `b-${Date.now()}`, logic: 'AND', rules: [{ fieldId: allFields[0]?.id, operator: 'contains', value: '' }] }] })}
              >
                Novo Bloco de Regras
              </Button>
            </div>
            <div className="pt-4 md:pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3">
              <Button variant="outline" size="md" className="w-full md:w-auto" onClick={() => setEditingFilter(null)}>Descartar</Button>
              <Button variant="primary" size="md" className="w-full md:w-auto" icon={SaveAll} onClick={saveFilter}>Salvar Filtro</Button>
            </div>
          </Card>
        ) : (
          <div className="h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-slate-200 rounded-3xl md:rounded-[3rem] text-slate-300 bg-white/50">
            <Activity size={32} className="opacity-10 mb-4 md:w-12 md:h-12" />
            <p className="font-black uppercase tracking-widest text-[9px] md:text-[11px] opacity-40">Motor de Busca Inativo</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default FilterView;
