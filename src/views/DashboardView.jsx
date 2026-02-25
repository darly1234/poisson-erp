import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart2, PieChart as PieIcon, Hash, TrendingUp, Sigma, Filter,
  Plus, X, Trash2, MoreVertical, ChevronRight, ChevronLeft, LayoutDashboard, Check, GripVertical
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DrillDownModal from '../components/modals/DrillDownModal';

// ── Color palette ────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

// ── Widget type definitions ──────────────────────────────────────────────────
const WIDGET_TYPES = [
  { id: 'bar', label: 'Gráfico de Barras', icon: BarChart2, desc: 'Distribuição por categorias', gradient: 'from-indigo-500 to-blue-600', eligible: ['text', 'select'] },
  { id: 'pie', label: 'Gráfico de Pizza', icon: PieIcon, desc: 'Proporção entre categorias', gradient: 'from-violet-500 to-purple-600', eligible: ['text', 'select'] },
  { id: 'kpi_count', label: 'Contagem', icon: Hash, desc: 'Nº de registros (total ou filtrado)', gradient: 'from-sky-500 to-cyan-600', eligible: ['text', 'select', 'number', 'currency', 'date', 'all'] },
  { id: 'kpi_avg', label: 'Média', icon: TrendingUp, desc: 'Valor médio de um campo numérico', gradient: 'from-emerald-500 to-green-600', eligible: ['number', 'currency'] },
  { id: 'kpi_sum', label: 'Soma', icon: Sigma, desc: 'Somatório de um campo numérico', gradient: 'from-amber-500 to-orange-500', eligible: ['number', 'currency'] },
  { id: 'kpi_category', label: 'KPI por Categoria', icon: Filter, desc: 'Contagem de uma categoria específica', gradient: 'from-rose-500 to-pink-600', eligible: ['text', 'select'] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const numVal = (v) => parseFloat(String(v ?? '0').replace(/[^\d,.]/g, '').replace(',', '.')) || 0;

const computeWidget = (widget, records, allFields) => {
  const field = allFields.find(f => f.id === widget.fieldId);
  if (!field && widget.chartType !== 'kpi_count') return null;

  switch (widget.chartType) {
    case 'bar':
    case 'pie': {
      const count = {};
      records.forEach(r => { const v = r.data[field.id] || 'N/A'; count[v] = (count[v] || 0) + 1; });
      const total = records.length;
      return Object.keys(count).sort((a, b) => count[b] - count[a]).map((k, i) => ({
        name: k, value: count[k], percent: total ? +((count[k] / total) * 100).toFixed(1) : 0,
        fill: PALETTE[i % PALETTE.length]
      }));
    }
    case 'kpi_count': {
      if (!field) return { value: records.length, label: 'registros' };
      if (widget.categoryFilter) {
        return { value: records.filter(r => String(r.data[field.id] || '') === widget.categoryFilter).length, label: widget.categoryFilter };
      }
      return { value: records.length, label: 'registros' };
    }
    case 'kpi_avg': {
      const vals = records.map(r => numVal(r.data[field.id])).filter(v => v > 0);
      return { value: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '0', label: field.label };
    }
    case 'kpi_sum': {
      const sum = records.reduce((acc, r) => acc + numVal(r.data[field.id]), 0);
      return { value: field.type === 'currency' ? `R$ ${sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : sum.toLocaleString('pt-BR'), label: field.label };
    }
    case 'kpi_category': {
      const cat = widget.categoryFilter || '';
      return { value: records.filter(r => String(r.data[field.id] || '') === cat).length, label: cat, sublabel: field.label };
    }
    default: return null;
  }
};

// ── Custom bar label ─────────────────────────────────────────────────────────
const BarLabel = ({ x, y, width, height, value }) => (
  <text x={x + width + 6} y={y + height / 2} dy="0.35em" fontSize={10} fontWeight={700} fill="#6366f1" textAnchor="start">{value}</text>
);

// ── Pie label ────────────────────────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, outerRadius, value, percent }) => {
  const R = Math.PI / 180, r = outerRadius + 22;
  const x = cx + r * Math.cos(-midAngle * R), y = cy + r * Math.sin(-midAngle * R);
  if (!value) return null;
  return <text x={x} y={y} fontSize={10} fontWeight={700} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{value} ({(percent * 100).toFixed(0)}%)</text>;
};

// ── Widget Card shell ────────────────────────────────────────────────────────
const WidgetShell = ({ widget, allFields, onRemove, children, accentGradient }) => {
  const [menu, setMenu] = useState(false);
  const field = allFields.find(f => f.id === widget.fieldId);
  const typeDef = WIDGET_TYPES.find(t => t.id === widget.chartType);
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
      <div className={`h-1.5 bg-gradient-to-r ${accentGradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${accentGradient} shadow-lg`}>
              {typeDef && <typeDef.icon size={16} className="text-white" />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{typeDef?.label}</p>
              <p className="text-[13px] font-black text-slate-700 leading-tight">{field?.label || 'Todos os registros'}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenu(m => !m)} className="p-1.5 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100">
              <MoreVertical size={16} />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 min-w-[140px] py-2">
                  <button onClick={() => { onRemove(); setMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} /> Remover widget
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── KPI widget ───────────────────────────────────────────────────────────────
const KpiWidget = ({ label, value, sublabel, accentGradient, icon: Icon }) => (
  <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${accentGradient} p-6 shadow-xl h-full flex flex-col justify-center items-center text-center`}>
    <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top right,white,transparent)' }} />
    <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
    <div className="relative z-10 w-full">
      {sublabel && <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1 truncate">{sublabel}</p>}
      <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-2 truncate">{label}</p>
      <p className="text-2xl sm:text-3xl font-black text-white truncate" title={String(value)}>{value}</p>
    </div>
    {Icon && <div className="absolute top-4 right-4 opacity-20"><Icon size={24} className="text-white" /></div>}
  </div>
);

// ── Add Widget Drawer ────────────────────────────────────────────────────────
const AddWidgetDrawer = ({ allFields, records, onAdd, onClose }) => {
  const [step, setStep] = useState(1);               // 1=type, 2=field, 3=category
  const [selectedType, setSelectedType] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const typeDef = WIDGET_TYPES.find(t => t.id === selectedType);

  // Eligible fields for a given chart type
  const eligibleFields = useMemo(() => {
    if (!typeDef) return [];
    if (typeDef.eligible.includes('all')) return allFields;
    return allFields.filter(f => typeDef.eligible.includes(f.type));
  }, [typeDef, allFields]);

  // Categories available for a selected field across records (injected from parent via allFields only — actual values come from parent)
  const goBack = () => {
    if (step === 3) { setStep(2); setSelectedCategory(null); }
    else if (step === 2) { setStep(1); setSelectedField(null); }
    else onClose();
  };

  const handleTypeSelect = (typeId) => { setSelectedType(typeId); setStep(2); };

  const handleFieldSelect = (field) => {
    setSelectedField(field);
    if (selectedType === 'kpi_category') setStep(3);
    else {
      // For kpi_count with a field, check if we need category step
      onAdd({ chartType: selectedType, fieldId: field?.id || null, categoryFilter: null });
    }
  };

  const handleFinish = () => {
    onAdd({ chartType: selectedType, fieldId: selectedField?.id || null, categoryFilter: selectedCategory });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Drawer header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button onClick={goBack} className="p-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                  <ChevronLeft size={18} />
                </button>
              )}
              <div>
                <p className="text-white font-black text-base">
                  {step === 1 && 'Tipo de Widget'}
                  {step === 2 && 'Selecionar Variável'}
                  {step === 3 && 'Selecionar Categoria'}
                </p>
                <p className="text-white/60 text-[11px]">
                  {step === 1 && 'Qual visualização deseja adicionar?'}
                  {step === 2 && typeDef?.desc}
                  {step === 3 && `Qual valor de "${selectedField?.label}" quer monitorar?`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
              <X size={18} />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1.5 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full flex-1 transition-all ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Choose type */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {WIDGET_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTypeSelect(t.id)}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${t.gradient} shadow-md group-hover:scale-110 transition-transform`}>
                    <t.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-slate-800">{t.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Choose field */}
          {step === 2 && (
            <div className="space-y-2">
              {selectedType === 'kpi_count' && (
                <button
                  onClick={() => handleFieldSelect(null)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <div>
                    <p className="text-[12px] font-black text-slate-800">Total de registros</p>
                    <p className="text-[10px] text-slate-400">Contagem geral do acervo</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              )}
              {eligibleFields.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum campo compatível encontrado.
                </div>
              )}
              {eligibleFields.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleFieldSelect(f)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <div>
                    <p className="text-[12px] font-black text-slate-800">{f.label}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{f.type}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Choose category */}
          {step === 3 && (
            <CategoryStep field={selectedField} records={records} onSelect={setSelectedCategory} selected={selectedCategory} onFinish={handleFinish} />
          )}
        </div>
      </div>
    </div>
  );
};

// Category step receives records directly as a prop
const CategoryStep = ({ field, records, onSelect, selected, onFinish }) => {
  const categories = useMemo(() => {
    if (!field) return [];

    // Para campos select: usa as options definidas no campo (fonte confiável)
    if (field.type === 'select' && field.options?.length > 0) {
      return field.options
        .map(o => (typeof o === 'string' ? o : (o.value || o.label)))
        .filter(Boolean);
    }

    // Para campos text: deriva dos valores reais nos registros
    const set = new Set(records.map(r => r.data[field.id]).filter(Boolean));
    return [...set].sort();
  }, [field, records]);

  return (
    <div className="space-y-2">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(String(cat))}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${selected === cat ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'}`}
        >
          <span className="text-[12px] font-black text-slate-800">{cat}</span>
          {selected === cat && <Check size={16} className="text-indigo-600" />}
        </button>
      ))}
      {selected && (
        <button
          onClick={onFinish}
          className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-200"
        >
          Adicionar Widget
        </button>
      )}
    </div>
  );
};

// ── Sortable wrapper ─────────────────────────────────────────────────────────
const SortableWidgetCard = ({ id, className, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group cursor-grab active:cursor-grabbing ${className || ''}`}
    >
      {/* Visual grip indicator — appears on hover */}
      <div className="absolute top-3 left-3 z-20 p-1.5 rounded-xl bg-white/80 text-slate-400 shadow transition-all opacity-0 group-hover:opacity-100 pointer-events-none">
        <GripVertical size={14} />
      </div>
      {children}
    </div>
  );
};

const DashboardView = ({ records, allFields, dashWidgets, setDashWidgets, onOpenRecord }) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [drillDown, setDrillDown] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Inject records for CategoryStep — removed in favor of prop passing

  const addWidget = useCallback((cfg) => {
    setDashWidgets(prev => [...prev, { id: `w-${Date.now()}`, ...cfg }]);
    setShowDrawer(false);
  }, [setDashWidgets]);

  const removeWidget = useCallback((id) => {
    setDashWidgets(prev => prev.filter(w => w.id !== id));
  }, [setDashWidgets]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setDashWidgets(prev => {
        const oldIndex = prev.findIndex(w => w.id === active.id);
        const newIndex = prev.findIndex(w => w.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, [setDashWidgets]);

  const handleCategoryClick = (field, category) => setDrillDown({ field, category });

  const renderWidget = (widget) => {
    const typeDef = WIDGET_TYPES.find(t => t.id === widget.chartType);
    const accentGradient = typeDef?.gradient || 'from-indigo-500 to-violet-500';
    const data = computeWidget(widget, records, allFields);
    const field = allFields.find(f => f.id === widget.fieldId);

    // KPI variants — rendered without shell (full-gradient card)
    if (['kpi_count', 'kpi_avg', 'kpi_sum', 'kpi_category'].includes(widget.chartType)) {
      if (!data) return null;
      return (
        <div key={widget.id} className="relative group h-full">
          <KpiWidget
            value={data.value}
            label={data.label}
            sublabel={data.sublabel}
            accentGradient={accentGradient}
            icon={typeDef?.icon}
          />
          <button
            onClick={() => removeWidget(widget.id)}
            className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/40 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      );
    }

    // Chart variants
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    return (
      <WidgetShell key={widget.id} widget={widget} allFields={allFields} onRemove={() => removeWidget(widget.id)} accentGradient={accentGradient}>
        <p className="text-[9px] text-slate-400 italic text-right mb-1">Clique para filtrar registros</p>

        {widget.chartType === 'bar' && (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`bg${widget.id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} />
                <Bar dataKey="value" fill={`url(#bg${widget.id})`} radius={[0, 6, 6, 0]} barSize={18} style={{ cursor: 'pointer' }} onClick={e => field && handleCategoryClick(field, e.name)}>
                  <LabelList content={<BarLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {widget.chartType === 'pie' && (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {data.map((d, i) => (
                      <linearGradient key={i} id={`pg${widget.id}${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={d.fill} stopOpacity={1} />
                        <stop offset="100%" stopColor={d.fill} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value"
                    labelLine={false} label={PieLabel}
                    onClick={e => field && handleCategoryClick(field, e.name)} style={{ cursor: 'pointer' }}>
                    {data.map((_, i) => <Cell key={i} fill={`url(#pg${widget.id}${i})`} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.slice(0, 6).map((d, i) => (
                <button key={i} onClick={() => field && handleCategoryClick(field, d.name)}
                  className="flex items-center gap-1.5 text-[9px] text-slate-600 font-semibold hover:text-indigo-600 transition-colors">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                  {d.name}
                </button>
              ))}
            </div>
          </>
        )}
      </WidgetShell>
    );
  };

  return (
    <div className="animate-slide space-y-8 p-1">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Dashboard</h2>
            <p className="text-[11px] text-slate-400">{dashWidgets.length} widget{dashWidgets.length !== 1 ? 's' : ''} configurado{dashWidgets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Adicionar Widget
        </button>
      </div>

      {/* Widget grid with dnd-kit sortable */}
      {dashWidgets.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={e => setActiveId(e.active.id)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={dashWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-6">
              {dashWidgets.map(w => {
                const isKpi = ['kpi_count', 'kpi_avg', 'kpi_sum', 'kpi_category'].includes(w.chartType);
                return (
                  <SortableWidgetCard
                    key={w.id}
                    id={w.id}
                    className={isKpi ? "col-span-1" : "col-span-2"}
                  >
                    {renderWidget(w)}
                  </SortableWidgetCard>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-xl">
              <LayoutDashboard size={44} className="text-indigo-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Plus size={20} className="text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Dashboard em branco</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-8">
            Adicione widgets para visualizar seus dados de forma bonita e interativa.
          </p>
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-indigo-200"
          >
            <Plus size={18} />
            Adicionar meu primeiro widget
          </button>
        </div>
      )}

      {/* Add Widget Drawer */}
      {showDrawer && (
        <AddWidgetDrawer allFields={allFields} records={records} onAdd={addWidget} onClose={() => setShowDrawer(false)} />
      )}

      {/* Drill-down modal */}
      {drillDown && (
        <DrillDownModal
          field={drillDown.field}
          category={drillDown.category}
          records={records}
          allFields={allFields}
          onClose={() => setDrillDown(null)}
          onOpenRecord={(record) => { setDrillDown(null); onOpenRecord(record); }}
        />
      )}
    </div>
  );
};

export default DashboardView;
