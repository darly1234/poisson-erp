import React, { useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
  pointerWithin
} from '@dnd-kit/core';
import {
  Plus,
  Trash2,
  GripVertical,
  MoreVertical,
  Layout,
  Rows3,
  X
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { FIELD_TYPES } from '../../constants';
import { COL_SPAN_OPTIONS } from '../../utils/metadataMigration';
import { Eye, EyeOff } from 'lucide-react';

const ICON_MAP = { Info: '📋', BookOpen: '📖', Wallet: '💰', Database: '🗄️', User: '👤' };

const genCellId = () => `cell-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function BankFieldEditor({ field, onUpdate, onClose, handleInputInteraction }) {
  return (
    <div className="p-3 mt-2 bg-white border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-blue-600 uppercase">Editar campo</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">Fechar</button>
      </div>
      <input
        className="w-full h-8 px-2 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg"
        placeholder="Label"
        value={field.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        onKeyDown={handleInputInteraction}
      />
      <select
        className="w-full h-8 px-2 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg"
        value={field.type}
        onChange={(e) => onUpdate({ type: e.target.value })}
      >
        {FIELD_TYPES.map((ft) => (
          <option key={ft.id} value={ft.id}>{ft.label}</option>
        ))}
      </select>
      {field.type === 'select' && (
        <input
          className="w-full h-8 px-2 text-[10px] bg-slate-50 border border-slate-200 rounded-lg"
          placeholder="Opções (vírgula)"
          value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
          onChange={(e) => onUpdate({ options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          onKeyDown={handleInputInteraction}
        />
      )}
      <div className="flex gap-4">
        <button onClick={() => onUpdate({ isVisible: !field.isVisible })} className="flex items-center gap-1.5 text-[10px]">
          {field.isVisible ? <Eye size={12} className="text-blue-600" /> : <EyeOff size={12} className="text-slate-300" />}
          Visível
        </button>
      </div>
    </div>
  );
}

const FieldBankItem = ({ field, isDragging }) => (
  <div
    className={`flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-50 shadow-lg' : 'hover:border-blue-300 hover:bg-blue-50/50'
      }`}
  >
    <GripVertical size={14} className="text-slate-300 shrink-0" />
    <span className="truncate flex-1">{field.label}</span>
    <span className="text-[9px] text-slate-400 uppercase">{field.type}</span>
  </div>
);

const FormLayoutBuilder = ({
  metadata,
  setMetadata,
  confirmModal,
  setConfirmModal,
  activeConfigTab,
  setActiveConfigTab,
  handleInputInteraction
}) => {
  const fieldBank = metadata?.fieldBank || [];
  const tabs = metadata?.tabs || [];
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || null);
  const [activeId, setActiveId] = useState(null);
  const [moveMenuFor, setMoveMenuFor] = useState(null);
  const [editingBankFieldId, setEditingBankFieldId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const setFieldBank = (next) => setMetadata((m) => ({ ...m, fieldBank: next }));
  const setTabs = (next) => setMetadata((m) => ({ ...m, tabs: next }));

  const getFieldDef = (fieldId) => fieldBank.find((f) => f.id === fieldId);

  const placedFieldIds = new Set();
  tabs.forEach((t) => {
    (t.rows || []).forEach((r) => {
      (r || []).forEach((c) => placedFieldIds.add(c.fieldId));
    });
  });
  const availableBankFields = fieldBank.filter((f) => !placedFieldIds.has(f.id));

  const addToBank = () => {
    const id = `f-${Date.now()}`;
    setFieldBank([
      ...fieldBank,
      { id, label: 'Novo Campo', type: 'text', isVisible: true, options: [] }
    ]);
  };

  const updateBankField = (fieldId, updates) => {
    setFieldBank(fieldBank.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const removeFromBank = (fieldId) => {
    setFieldBank(fieldBank.filter((f) => f.id !== fieldId));
    setTabs(
      tabs.map((tab) => ({
        ...tab,
        rows: tab.rows.map((row) => row.filter((c) => c.fieldId !== fieldId))
      }))
    );
  };

  const addTab = () => {
    const id = `t-${Date.now()}`;
    setTabs([...tabs, { id, label: 'Nova Aba', icon: 'Info', rows: [[]] }]);
    setActiveTabId(id);
  };

  const updateTab = (tabId, updates) => {
    setTabs(tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)));
  };

  const removeTab = (tabId) => {
    if (tabs.length <= 1) return;
    setTabs(tabs.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) setActiveTabId(tabs.find((t) => t.id !== tabId)?.id || null);
  };

  const addRow = (tabId) => {
    setTabs(tabs.map((t) => (t.id === tabId ? { ...t, rows: [...(t.rows || []), []] } : t)));
  };

  const removeRow = (tabId, rowIdx) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab?.rows?.length || tab.rows.length <= 1) return;
    setTabs(tabs.map((t) => (t.id === tabId ? { ...t, rows: t.rows.filter((_, i) => i !== rowIdx) } : t)));
  };

  const findCellLocation = (cellId) => {
    for (let ti = 0; ti < tabs.length; ti++) {
      const rows = tabs[ti].rows || [];
      for (let ri = 0; ri < rows.length; ri++) {
        const idx = rows[ri].findIndex((c) => c.cellId === cellId);
        if (idx >= 0) return { tabIdx: ti, tabId: tabs[ti].id, rowIdx: ri, cellIdx: idx };
      }
    }
    return null;
  };

  const moveCellToTab = (cellId, targetTabId) => {
    const loc = findCellLocation(cellId);
    if (!loc) return;
    const tab = tabs[loc.tabIdx];
    const cell = tab.rows[loc.rowIdx][loc.cellIdx];
    setTabs(
      tabs.map((t) => {
        if (t.id === loc.tabId) {
          const rows = t.rows
            .map((r, i) => (i === loc.rowIdx ? r.filter((c) => c.cellId !== cellId) : r))
            .filter((r) => r.length > 0);
          return { ...t, rows: rows.length ? rows : [[]] };
        }
        if (t.id === targetTabId) {
          const targetRows = [...(t.rows || [[]])];
          if (targetRows.length === 0) targetRows.push([]);
          targetRows[0] = [...(targetRows[0] || []), cell];
          return { ...t, rows: targetRows };
        }
        return t;
      })
    );
    setMoveMenuFor(null);
    setActiveTabId(targetTabId);
  };

  const updateCellColSpan = (tabId, rowIdx, cellIdx, colSpan) => {
    setTabs(
      tabs.map((t) =>
        t.id === tabId
          ? {
            ...t,
            rows: t.rows.map((r, ri) =>
              ri === rowIdx ? r.map((c, ci) => (ci === cellIdx ? { ...c, colSpan: Number(colSpan) } : c)) : r
            )
          }
          : t
      )
    );
  };

  const removeCell = (tabId, rowIdx, cellIdx) => {
    setTabs(
      tabs.map((t) =>
        t.id === tabId
          ? {
            ...t,
            rows: t.rows.map((r, ri) => (ri === rowIdx ? r.filter((_, ci) => ci !== cellIdx) : r))
          }
          : t
      )
    );
    setMoveMenuFor(null);
  };

  const handleDragStart = (e) => setActiveId(e.active.id);
  const handleDragEnd = (e) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeStr = String(active.id);
    const overStr = String(over.id);
    if (activeStr.startsWith('bank-')) {
      const fieldId = activeStr.replace('bank-', '');
      if (overStr.startsWith('row-')) {
        const [prefix, ridxStr] = overStr.split('::');
        const tabId = prefix.replace('row-', '');
        const ridx = parseInt(ridxStr, 10);
        const cell = { cellId: genCellId(), fieldId, colSpan: 12 };
        setTabs(
          tabs.map((t) =>
            t.id === tabId
              ? {
                ...t,
                rows: t.rows.map((r, i) => (i === ridx ? [...r, cell] : r))
              }
              : t
          )
        );
        setActiveTabId(tabId);
      }
    } else if (activeStr.startsWith('cell-')) {
      if (overStr.startsWith('row-')) {
        const [prefix, ridxStr] = overStr.split('::');
        const tabId = prefix.replace('row-', '');
        const ridx = parseInt(ridxStr, 10);
        const loc = findCellLocation(activeStr);
        if (!loc) return;
        const tab = tabs[loc.tabIdx];
        const cell = tab.rows[loc.rowIdx][loc.cellIdx];
        setTabs(
          tabs.map((t) => {
            if (t.id === loc.tabId) {
              const rows = t.rows.map((r, ri) => (ri === loc.rowIdx ? r.filter((c) => c.cellId !== activeStr) : r)).filter((r) => r.length > 0);
              return { ...t, rows: rows.length ? rows : [[]] };
            }
            if (t.id === tabId) {
              return {
                ...t,
                rows: t.rows.map((r, i) => (i === ridx ? [...r, cell] : r))
              };
            }
            return t;
          })
        );
        setActiveTabId(tabId);
      } else if (overStr.startsWith('tab::')) {
        const tabId = overStr.replace('tab::', '');
        moveCellToTab(activeStr, tabId);
      }
    }
  };


  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeField = activeId?.startsWith('bank-') ? getFieldDef(activeId.replace('bank-', '')) : null;
  const activeCell = activeId?.startsWith('cell-') ? (() => {
    const loc = findCellLocation(activeId);
    return loc ? tabs[loc.tabIdx]?.rows?.[loc.rowIdx]?.[loc.cellIdx] : null;
  })() : null;
  const activeCellDef = activeCell ? getFieldDef(activeCell.fieldId) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 border-b pb-4 mb-6">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Construtor de Layout de Formulário</h4>
        <span className="text-[10px] text-slate-400">Grid de 12 colunas</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 flex-1 min-h-0">
          <div className="w-56 shrink-0 space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco de Campos</h5>
              <button
                onClick={addToBank}
                className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="Novo campo"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {availableBankFields.map((f) => (
                <div key={f.id}>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <DraggableBankItem id={`bank-${f.id}`} field={f} />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingBankFieldId(editingBankFieldId === f.id ? null : f.id); }}
                      className={`p-2 rounded-lg shrink-0 ${editingBankFieldId === f.id ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                      title="Editar"
                    >
                      <Layout size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, type: 'field', id: f.id, label: f.label }); }}
                      className="p-2 rounded-lg text-slate-300 hover:text-red-500 shrink-0"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {editingBankFieldId === f.id && (
                    <BankFieldEditor
                      field={f}
                      onUpdate={(updates) => updateBankField(f.id, updates)}
                      onClose={() => setEditingBankFieldId(null)}
                      handleInputInteraction={handleInputInteraction}
                    />
                  )}
                </div>
              ))}
              {availableBankFields.length === 0 && (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400 text-center">
                  Crie campos aqui para usar no formulário
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 overflow-auto">
            <div className="flex items-center justify-between mb-0 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-wrap">
                {tabs.map((t) => (
                  <DroppableTabHeader
                    key={t.id}
                    id={`tab::${t.id}`}
                    tab={t}
                    isActive={activeTabId === t.id}
                    onClick={() => setActiveTabId(t.id)}
                    onRemove={() => tabs.length > 1 && setConfirmModal({ show: true, type: 'tab', id: t.id, label: t.label })}
                    onLabelChange={(v) => updateTab(t.id, { label: v })}
                    handleInputInteraction={handleInputInteraction}
                  />
                ))}
                <button
                  onClick={addTab}
                  className="mx-2 my-2 px-4 py-2 rounded-t-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-blue-400 hover:text-blue-600 text-[10px] font-semibold shrink-0"
                >
                  + Aba
                </button>
              </div>
            </div>

            {activeTab && (
              <div className="space-y-6 p-6 bg-white border border-slate-200 border-t-0 rounded-b-xl">
                {(activeTab.rows || [[]]).map((row, rowIdx) => (
                  <DroppableRow
                    key={`${activeTab.id}-${rowIdx}`}
                    id={`row-${activeTab.id}::${rowIdx}`}
                    row={row}
                    rowIdx={rowIdx}
                    tabId={activeTab.id}
                    fieldBank={fieldBank}
                    getFieldDef={getFieldDef}
                    onAddRow={() => addRow(activeTab.id)}
                    onRemoveRow={() => removeRow(activeTab.id, rowIdx)}
                    onUpdateColSpan={updateCellColSpan}
                    onRemoveCell={removeCell}
                    moveMenuFor={moveMenuFor}
                    setMoveMenuFor={setMoveMenuFor}
                    tabs={tabs}
                    onMoveToTab={moveCellToTab}
                    canRemoveRow={(activeTab.rows || []).length > 1}
                  />
                ))}
                {(!activeTab.rows || activeTab.rows.length === 0) && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => addRow(activeTab.id)}
                      className="py-8 px-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all"
                    >
                      <Rows3 size={32} className="mx-auto mb-2 opacity-50" />
                      <span className="text-[10px] font-black uppercase">Adicionar linha</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeId && activeField && (
            <div className="opacity-90">
              <FieldBankItem field={activeField} isDragging />
            </div>
          )}
          {activeId && activeCellDef && activeCell && (
            <div className="opacity-90 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-lg">
              <GripVertical size={14} className="text-slate-400" />
              <div>
                <p className="text-[11px] font-bold text-slate-700">{activeCellDef.label}</p>
                <p className="text-[9px] text-slate-400">{activeCellDef.type}</p>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {confirmModal?.show && (
        <DeleteConfirmModal
          confirmModal={confirmModal}
          setConfirmModal={setConfirmModal}
          executeDelete={() => {
            if (confirmModal.type === 'tab') removeTab(confirmModal.id);
            if (confirmModal.type === 'field') removeFromBank(confirmModal.id);
            setConfirmModal({ show: false });
          }}
        />
      )}
    </div>
  );
};

function DraggableBankItem({ id, field }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { type: 'bank' } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <FieldBankItem field={field} isDragging={isDragging} />
    </div>
  );
}

function DroppableTabHeader({ id, tab, isActive, onClick, onRemove, onLabelChange, handleInputInteraction }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg border transition-all cursor-pointer shrink-0 -mb-px ${isActive
        ? 'bg-white border-slate-200 border-b-white text-slate-800 shadow-sm relative z-10'
        : isOver
          ? 'bg-slate-100 border-slate-200 text-slate-600'
          : 'bg-slate-100/80 border-transparent text-slate-500 hover:bg-slate-100'
        }`}
    >
      <span className="text-base opacity-80">{ICON_MAP[tab.icon] || '📄'}</span>
      <input
        className="bg-transparent outline-none font-semibold text-[11px] w-24 text-left"
        value={tab.label}
        onChange={(e) => onLabelChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleInputInteraction}
      />
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-0.5 rounded hover:bg-slate-200/50 text-slate-400 hover:text-slate-600" title="Fechar aba">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function DroppableRow({
  id,
  row,
  rowIdx,
  tabId,
  fieldBank,
  getFieldDef,
  onAddRow,
  onRemoveRow,
  onUpdateColSpan,
  onRemoveCell,
  moveMenuFor,
  setMoveMenuFor,
  tabs,
  onMoveToTab,
  canRemoveRow
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-2xl border-2 transition-all ${isOver ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 bg-white'}`}
    >
      <div className="grid grid-cols-12 gap-4">
        {(row || []).map((cell, cellIdx) => {
          const def = getFieldDef(cell.fieldId);
          if (!def) return null;
          return (
            <div key={cell.cellId} className={`col-span-${Math.min(cell.colSpan || 12, 12)}`} style={{ gridColumn: `span ${cell.colSpan || 12}` }}>
              <DraggableCell
                cell={cell}
                def={def}
                tabId={tabId}
                rowIdx={rowIdx}
                cellIdx={cellIdx}
                onUpdateColSpan={onUpdateColSpan}
                onRemove={onRemoveCell}
                moveMenuFor={moveMenuFor}
                setMoveMenuFor={setMoveMenuFor}
                tabs={tabs}
                onMoveToTab={onMoveToTab}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={onAddRow} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-1">
          <Plus size={12} /> Adicionar linha abaixo
        </button>
        {canRemoveRow && (
          <button onClick={onRemoveRow} className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase flex items-center gap-1">
            <Trash2 size={12} /> Remover linha
          </button>
        )}
      </div>
    </div>
  );
}

function DraggableCell({ cell, def, tabId, rowIdx, cellIdx, onUpdateColSpan, onRemove, moveMenuFor, setMoveMenuFor, tabs, onMoveToTab }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: cell.cellId, data: { type: 'cell' } });
  const isMenuOpen = moveMenuFor === cell.cellId;
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 text-slate-400">
        <GripVertical size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-700 truncate">{def.label}</p>
        <p className="text-[9px] text-slate-400">{def.type}</p>
      </div>
      <select
        className="text-[9px] font-bold bg-white border border-slate-200 rounded px-2 py-1"
        value={cell.colSpan || 12}
        onChange={(e) => onUpdateColSpan(tabId, rowIdx, cellIdx, e.target.value)}
        onClick={(e) => e.stopPropagation()}
      >
        {COL_SPAN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="relative">
        <button
          onClick={() => setMoveMenuFor(isMenuOpen ? null : cell.cellId)}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-400"
        >
          <MoreVertical size={14} />
        </button>
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMoveMenuFor(null)} />
            <div className="absolute right-0 top-full mt-1 py-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[180px]">
              <p className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase">Mover para aba</p>
              {tabs.filter((t) => t.id !== tabId).map((t) => (
                <button
                  key={t.id}
                  onClick={() => onMoveToTab(cell.cellId, t.id)}
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50"
                >
                  {t.label}
                </button>
              ))}
              <button onClick={() => onRemove(tabId, rowIdx, cellIdx)} className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">
                Remover campo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FormLayoutBuilder;
