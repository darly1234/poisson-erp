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
  saveFilter
}) => (
  <div className="w-full space-y-6 animate-slide">
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Filter size={24} /></div>
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Filtros</h2>
          <p className="text-xs text-slate-400 font-medium">Lógica booleana por blocos e regras granulares.</p>
        </div>
      </div>
      <Button
        variant="primary" size="md" icon={PlusCircle}
        onClick={() => setEditingFilter({
          id: null, name: '', globalLogic: 'AND',
          blocks: [{ id: 'b1', logic: 'AND', rules: [{ fieldId: allFields[0]?.id, operator: 'contains', value: '' }] }]
        })}
      >
        Novo Filtro Inteligente
      </Button>
    </div>

    <div className="grid grid-cols-12 gap-8 items-start">
      <div className="col-span-12 lg:col-span-4 space-y-4">
        {savedFilters.map(f => (
          <div key={f.id} className={`p-5 rounded-2xl border bg-white group cursor-pointer transition-all ${editingFilter?.id === f.id ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-lg' : 'border-slate-200 hover:border-blue-300'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[13px] font-bold text-slate-800">{f.name}</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => { e.stopPropagation(); setSavedFilters([...savedFilters, { ...f, id: `f-${Date.now()}`, name: `${f.name} (Cópia)` }]); }} className="text-slate-400 hover:text-blue-500"><Copy size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); setSavedFilters(savedFilters.filter(fi => fi.id !== f.id)); }} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${f.globalLogic === 'AND' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              {f.globalLogic === 'AND' ? 'Prender Tudo' : 'Qualquer Um'}
            </span>
            <button
              onClick={() => setEditingFilter(f)}
              className="mt-4 w-full py-2 text-[10px] font-black text-blue-700 bg-slate-50 hover:bg-blue-700 hover:text-white rounded-xl uppercase tracking-wider transition-all"
            >
              Editar Estrutura
            </button>
          </div>
        ))}
      </div>

      <div className="col-span-12 lg:col-span-8">
        {editingFilter ? (
          <Card className="p-8 space-y-8 border-blue-100 shadow-2xl animate-in zoom-in-95">
            <div className="flex gap-6 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Identificação do Filtro</label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                  value={editingFilter.name}
                  onChange={e => setEditingFilter({ ...editingFilter, name: e.target.value })}
                  onKeyDown={e => e.stopPropagation()}
                  placeholder="Ex: Livros Específicos"
                />
              </div>
              <div className="w-56 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Lógica Global</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setEditingFilter({ ...editingFilter, globalLogic: 'AND' })} className={`flex-1 py-2 text-[10px] font-black rounded-lg ${editingFilter.globalLogic === 'AND' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-400'}`}>TODOS (E)</button>
                  <button onClick={() => setEditingFilter({ ...editingFilter, globalLogic: 'OR' })} className={`flex-1 py-2 text-[10px] font-black rounded-lg ${editingFilter.globalLogic === 'OR' ? 'bg-white shadow-sm text-amber-700' : 'text-slate-400'}`}>QUALQUER (OU)</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {editingFilter.blocks.map((block, bIdx) => (
                <div key={block.id} className="p-6 border border-slate-100 bg-slate-50/50 rounded-3xl border-l-4 border-l-blue-600 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">BLOCO {bIdx + 1}</span>
                      <div className="flex bg-slate-200/50 p-1 rounded-lg">
                        <button onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, logic: 'AND' } : b) })} className={`px-2 py-0.5 text-[9px] font-black rounded ${block.logic === 'AND' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>E</button>
                        <button onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, logic: 'OR' } : b) })} className={`px-2 py-0.5 text-[9px] font-black rounded ${block.logic === 'OR' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}>OU</button>
                      </div>
                    </div>
                    <button onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.filter(b => b.id !== block.id) })} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <div className="space-y-3">
                    {block.rules.map((rule, rIdx) => {
                      const ops = getOperatorsByField(rule.fieldId);
                      return (
                        <div key={rIdx} className="flex gap-2 items-center bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
                          <select className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" value={rule.fieldId} onChange={e => updateRuleInBlock(block.id, rIdx, { fieldId: e.target.value, operator: getOperatorsByField(e.target.value)[0].id })}>
                            {allFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                          </select>
                          <select className="w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" value={rule.operator} onChange={e => updateRuleInBlock(block.id, rIdx, { operator: e.target.value })}>
                            {ops.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                          {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                            <div className="flex-[2] flex gap-2">
                              <input type="text" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" value={rule.value} onChange={e => updateRuleInBlock(block.id, rIdx, { value: e.target.value })} onKeyDown={e => e.stopPropagation()} />
                              {rule.operator === 'between' && <input type="number" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" value={rule.value2 || ''} onChange={e => updateRuleInBlock(block.id, rIdx, { value2: e.target.value })} onKeyDown={e => e.stopPropagation()} />}
                            </div>
                          )}
                          <button onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, rules: b.rules.filter((_, i) => i !== rIdx) } : b) })} className="p-2 text-slate-300 hover:text-red-500"><X size={16} /></button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setEditingFilter({ ...editingFilter, blocks: editingFilter.blocks.map(b => b.id === block.id ? { ...b, rules: [...b.rules, { fieldId: allFields[0]?.id, operator: 'contains', value: '' }] } : b) })}
                      className="flex items-center gap-1.5 text-blue-700 text-[10px] font-black uppercase hover:underline mt-4 px-2 tracking-widest"
                    >
                      <PlusSquare size={14} /> Condição
                    </button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline" size="sm" className="w-full border-dashed py-4 rounded-3xl" icon={Plus}
                onClick={() => setEditingFilter({ ...editingFilter, blocks: [...editingFilter.blocks, { id: `b-${Date.now()}`, logic: 'AND', rules: [{ fieldId: allFields[0]?.id, operator: 'contains', value: '' }] }] })}
              >
                Novo Bloco de Regras
              </Button>
            </div>
            <div className="pt-8 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" size="md" onClick={() => setEditingFilter(null)}>Descartar</Button>
              <Button variant="primary" size="md" icon={SaveAll} onClick={saveFilter}>Salvar Filtro</Button>
            </div>
          </Card>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300 bg-white/50">
            <Activity size={48} className="opacity-10 mb-4" />
            <p className="font-black uppercase tracking-widest text-[11px] opacity-40">Motor de Busca Inativo</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default FilterView;
