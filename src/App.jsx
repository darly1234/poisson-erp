import React, { useState, useMemo, useEffect } from 'react';
import { Info, BookOpen, Wallet } from 'lucide-react';

import { poppinsStyle, TEXT_OPERATORS, NUMERIC_OPERATORS } from './constants';
import { normalizeMetadata, isLegacyMetadata } from './utils/metadataMigration';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import ListView from './views/ListView';
import DashboardView from './views/DashboardView';
import DetailView from './views/DetailView';
import ConfigView from './views/ConfigView';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './views/auth/LoginPage';
import RegisterPage from './views/auth/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from './views/auth/ForgotPasswordPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("React Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-800 border-2 border-red-200 rounded-xl m-10">
          <h1 className="text-2xl font-bold mb-4">Ocorreu um erro de renderização:</h1>
          <pre className="p-4 bg-white border border-red-100 rounded overflow-auto text-xs">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Recarregar Página</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState(() => {
    // Detecta link de reset de senha na URL
    const params = new URLSearchParams(window.location.search);
    return params.get('token') ? 'reset' : 'login';
  });
  const resetToken = new URLSearchParams(window.location.search).get('token');

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1340] to-[#1a2060] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    if (authPage === 'register') return <RegisterPage onGoLogin={() => setAuthPage('login')} />;
    if (authPage === 'forgot') return <ForgotPasswordPage onGoLogin={() => setAuthPage('login')} />;
    if (authPage === 'reset') return <ResetPasswordPage token={resetToken} onGoLogin={() => { window.history.replaceState({}, '', '/'); setAuthPage('login'); }} />;
    return <LoginPage onGoRegister={() => setAuthPage('register')} onGoForgot={() => setAuthPage('forgot')} />;
  }

  return <AppMain />;  // continua para o app principal
}

function AppMain() {
  const [view, setView] = useState('list');
  const [subView, setSubView] = useState('livros');

  const [metadata, setMetadata] = useState({
    tabs: [
      {
        id: 't1', label: 'Administrativo', icon: Info, fields: [
          { id: 'f1', label: 'Nome do Autor', type: 'text', isVisible: true, isBI: true },
          { id: 'f2', label: 'Telefone Autor', type: 'phone', isVisible: false, isBI: false },
          { id: 'f3', label: 'Status Relacionamento', type: 'select', options: ['Ativo', 'Em Pausa', 'Finalizado'], isVisible: true, isBI: true }
        ]
      },
      {
        id: 't2', label: 'Produção', icon: BookOpen, fields: [
          { id: 'f6', label: 'Título da Obra', type: 'text', isVisible: true, isBI: true },
          { id: 'f7', label: 'Formato', type: 'select', isVisible: true, isBI: true, options: ['E-book', 'Impresso', 'Ambos'] },
          { id: 'f10', label: 'Status Pagamento', type: 'select', options: ['Pendente', 'Pago', 'Atrasado'], isVisible: true, isBI: true },
          { id: 'f11', label: 'Páginas', type: 'number', isVisible: true, isBI: true }
        ]
      },
      {
        id: 't3', label: 'Financeiro', icon: Wallet, fields: [
          { id: 'f9', label: 'Valor Pagamento', type: 'currency', isVisible: true, isBI: true },
          { id: 'f20', label: 'Documentação', type: 'file', isVisible: true, isBI: false }
        ]
      }
    ]
  });

  const allFields = useMemo(() => {
    if (metadata.fieldBank?.length) return metadata.fieldBank;
    return metadata.tabs?.flatMap(t => t.fields || []) || [];
  }, [metadata]);

  const [records, setRecords] = useState([
    { id: 'I-001', data: { f6: 'Dom Casmurro', f1: 'Machado de Assis', f7: '978-85-359-0277-7', f3: 'Ativo', f10: 'Pago', f11: '256', f9: 'R$ 5.400,00', f20: [] } },
    { id: 'I-002', data: { f6: 'O Alienista', f1: 'Machado de Assis', f7: '978-85-359-0000-1', f3: 'Ativo', f10: 'Pendente', f11: '120', f9: 'R$ 2.100,00', f20: [] } }
  ]);

  const [savedFilters, setSavedFilters] = useState([
    { id: 'f-default', name: 'Livros Ativos', globalLogic: 'AND', blocks: [{ id: 'b1', logic: 'AND', rules: [{ fieldId: 'f3', operator: 'equals', value: 'Ativo', value2: '' }] }] }
  ]);
  const [activeFilterId, setActiveFilterId] = useState('all');
  const [editingFilter, setEditingFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [visibleColumns, setVisibleColumns] = useState(['id', 'f6', 'f1', 'f3', 'f10']);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('t1');
  const [activeConfigTab, setActiveConfigTab] = useState('metadata');
  const [editingTabId, setEditingTabId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, id: null, parentId: null, label: '' });
  const [dragActiveFieldId, setDragActiveFieldId] = useState(null);

  const [dashWidgets, setDashWidgets] = useState([]);


  useEffect(() => {
    if (view === 'config' && normalizeMetadata && isLegacyMetadata(metadata)) {
      setMetadata(normalizeMetadata(metadata));
    }
  }, [view]);

  // Carregar dados do backend ao iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const [recordsData, metadataData, filtersData] = await Promise.all([
          api.getRecords(),
          api.getMetadata(),
          api.getFilters()
        ]);

        if (recordsData.length > 0) {
          setRecords(recordsData.map(r => ({ id: r.id, data: r.data })));
        }

        if (metadataData && (metadataData.tabs || metadataData.fieldBank)) {
          setMetadata(normalizeMetadata(metadataData));
        }

        if (filtersData.length > 0) {
          setSavedFilters(filtersData.map(f => ({ ...f.config, id: f.id, name: f.name })));
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };
    loadData();
  }, []);


  const effectiveColumns = useMemo(() => {
    return visibleColumns.filter(colId => {
      if (colId === 'id') return true;
      const field = allFields.find(f => f.id === colId);
      return field && field.isVisible !== false;
    });
  }, [visibleColumns, allFields]);

  const getOperatorsByField = (fieldId) => {
    const field = allFields.find(f => f.id === fieldId);
    return ['number', 'currency'].includes(field?.type) ? NUMERIC_OPERATORS : TEXT_OPERATORS;
  };

  const updateRuleInBlock = (blockId, ruleIdx, updates) => {
    setEditingFilter(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId
          ? { ...b, rules: b.rules.map((r, i) => i === ruleIdx ? { ...r, ...updates } : r) }
          : b
      )
    }));
  };

  const saveFilter = () => {
    if (!editingFilter.name) return;
    if (editingFilter.id) {
      setSavedFilters(prev => prev.map(f => f.id === editingFilter.id ? { ...editingFilter } : f));
    } else {
      const newFilter = { ...editingFilter, id: `f-${Date.now()}` };
      setSavedFilters(prev => [...prev, newFilter]);
      setActiveFilterId(newFilter.id);
    }
    setSubView('livros');
    setEditingFilter(null);
  };

  const handleOpenDetail = (record) => {
    setSelectedRecord(record);

    const firstTab = metadata.tabs.find(t => {
      // Busca na estrutura nova (Construtor de Layout com rows)
      if (t.rows) {
        return t.rows.some(row => row.fields?.some(f => f.isVisible !== false));
      }
      // Busca na estrutura antiga (Fallback)
      if (t.fields) {
        return t.fields.some(f => f.isVisible !== false);
      }
      return false;
    });

    setActiveDetailTab(firstTab?.id || metadata.tabs[0]?.id);
    setView('detail');
  };

  const filteredRecords = useMemo(() => {
    let res = [...records];
    if (activeFilterId !== 'all') {
      const filter = savedFilters.find(f => f.id === activeFilterId);
      if (filter && filter.blocks) {
        res = res.filter(record => {
          const blockResults = filter.blocks.map(block => {
            const ruleResults = block.rules.map(rule => {
              const rawVal = record.data[rule.fieldId];
              const fieldDef = allFields.find(f => f.id === rule.fieldId);
              const isNumeric = ['number', 'currency'].includes(fieldDef?.type);
              if (rule.operator === 'is_empty') return !rawVal || rawVal === "" || (Array.isArray(rawVal) && rawVal.length === 0);
              if (rule.operator === 'is_not_empty') return !!rawVal && rawVal !== "" && (!Array.isArray(rawVal) || rawVal.length > 0);
              if (isNumeric) {
                const num = parseFloat(String(rawVal || "0").replace(/[^\d,]/g, '').replace(',', '.'));
                const target = parseFloat(String(rule.value || "0").replace(',', '.'));
                const target2 = parseFloat(String(rule.value2 || "0").replace(',', '.'));
                switch (rule.operator) {
                  case 'equals': return num === target;
                  case 'not_equals': return num !== target;
                  case 'greater_than': return num > target;
                  case 'greater_equal': return num >= target;
                  case 'less_than': return num < target;
                  case 'less_equal': return num <= target;
                  case 'between': return num >= target && num <= target2;
                  default: return true;
                }
              } else {
                const val = String(rawVal || "").toLowerCase();
                const target = String(rule.value || "").toLowerCase();
                switch (rule.operator) {
                  case 'equals': return val === target;
                  case 'not_equals': return val !== target;
                  case 'contains': return val.includes(target);
                  case 'not_contains': return !val.includes(target);
                  case 'starts': return val.startsWith(target);
                  case 'ends': return val.endsWith(target);
                  default: return true;
                }
              }
            });
            return block.logic === 'AND' ? ruleResults.every(r => r) : ruleResults.some(r => r);
          });
          return filter.globalLogic === 'AND' ? blockResults.every(r => r) : blockResults.some(r => r);
        });
      }
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      res = res.filter(r =>
        r.id.toLowerCase().includes(s) ||
        Object.values(r.data).some(v => String(v).toLowerCase().includes(s))
      );
    }
    return res;
  }, [records, searchTerm, activeFilterId, savedFilters, allFields]);

  const sortedRecords = useMemo(() => {
    let sortable = [...filteredRecords];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const aVal = sortConfig.key === 'id' ? a.id : (a.data[sortConfig.key] || '');
        const bVal = sortConfig.key === 'id' ? b.id : (b.data[sortConfig.key] || '');
        const field = allFields.find(f => f.id === sortConfig.key);
        const isNumeric = ['number', 'currency'].includes(field?.type);
        if (isNumeric) {
          const nA = parseFloat(String(aVal).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          const nB = parseFloat(String(bVal).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          return sortConfig.direction === 'asc' ? nA - nB : nB - nA;
        }
        const strA = String(aVal).toLowerCase();
        const strB = String(bVal).toLowerCase();
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredRecords, sortConfig, allFields]);

  const totalPages = Math.ceil(sortedRecords.length / rowsPerPage) || 1;
  const paginated = sortedRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleExportExcel = () => {
    const tableHeader = effectiveColumns.map(c => allFields.find(f => f.id === c)?.label || 'ID').join('</th><th>');
    const tableRows = sortedRecords.map(r => {
      const cells = effectiveColumns.map(c => c === 'id' ? r.id : (Array.isArray(r.data[c]) ? r.data[c].join(', ') : r.data[c] || '')).join('</td><td>');
      return `<tr><td>${cells}</td></tr>`;
    }).join('');
    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table><thead><tr><th>${tableHeader}</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Acervo_Poisson.xls`;
    link.click();
  };

  const handleMoveTab = (index, direction) => {
    const newTabs = [...metadata.tabs];
    const target = index + direction;
    if (target < 0 || target >= newTabs.length) return;
    [newTabs[index], newTabs[target]] = [newTabs[target], newTabs[index]];
    setMetadata({ ...metadata, tabs: newTabs });
  };

  const handleUpdateTabLabel = (id, label) =>
    setMetadata({ ...metadata, tabs: metadata.tabs.map(t => t.id === id ? { ...t, label } : t) });

  const handleMoveField = (tabId, fieldIdx, direction) => {
    setMetadata(prev => ({
      ...prev,
      tabs: prev.tabs.map(t => {
        if (t.id !== tabId) return t;
        const newFields = [...t.fields];
        const target = fieldIdx + direction;
        if (target < 0 || target >= newFields.length) return t;
        [newFields[fieldIdx], newFields[target]] = [newFields[target], newFields[fieldIdx]];
        return { ...t, fields: newFields };
      })
    }));
  };

  const handleUpdateField = (tabId, fieldId, updates) => {
    setMetadata(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id !== tabId ? t : { ...t, fields: t.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) }
      )
    }));
  };

  const handleAddField = (tabId) => {
    const fieldId = `f-${Date.now()}`;
    setMetadata(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id === tabId
          ? { ...t, fields: [...t.fields, { id: fieldId, label: 'Novo Campo', type: 'text', isVisible: true, isBI: false, options: [] }] }
          : t
      )
    }));
  };

  const executeDelete = () => {
    if (confirmModal.type === 'tab') {
      setMetadata({ ...metadata, tabs: metadata.tabs.filter(t => t.id !== confirmModal.id) });
      if (editingTabId === confirmModal.id) setEditingTabId(null);
    } else if (confirmModal.type === 'field') {
      setMetadata({
        ...metadata,
        tabs: metadata.tabs.map(t =>
          t.id === confirmModal.parentId ? { ...t, fields: t.fields.filter(f => f.id !== confirmModal.id) } : t
        )
      });
    }
    setConfirmModal({ show: false, type: null, id: null, parentId: null, label: '' });
  };

  const handleDrag = (e, fieldId) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveFieldId(fieldId);
    else if (e.type === "dragleave") setDragActiveFieldId(null);
  };

  const handleDrop = async (e, fieldId) => {
    e.preventDefault(); e.stopPropagation();
    setDragActiveFieldId(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const isNew = selectedRecord?.isNew;
      const recordId = isNew ? 'DRAFT' : selectedRecord?.id;

      try {
        const uploadPromises = files.map(f => api.uploadFile(recordId, f));
        const uploadedFiles = await Promise.all(uploadPromises);

        const currentFiles = Array.isArray(selectedRecord.data[fieldId]) ? selectedRecord.data[fieldId] : [];
        const newFilesList = uploadedFiles.map(res => ({ name: res.name, url: res.url }));

        const updated = { ...selectedRecord, data: { ...selectedRecord.data, [fieldId]: [...currentFiles, ...newFilesList] } };
        setSelectedRecord(updated);
        setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));

        if (!isNew && selectedRecord?.id) api.updateRecord(selectedRecord.id, updated.data);
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Falha ao enviar arquivo de anexo.');
      }
    }
  };

  const handleFileSelection = async (e, fieldId) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const isNew = selectedRecord?.isNew;
      const recordId = isNew ? 'DRAFT' : selectedRecord?.id;

      try {
        const uploadPromises = files.map(f => api.uploadFile(recordId, f));
        const uploadedFiles = await Promise.all(uploadPromises);

        const currentFiles = Array.isArray(selectedRecord.data[fieldId]) ? selectedRecord.data[fieldId] : [];
        const newFilesList = uploadedFiles.map(res => ({ name: res.name, url: res.url }));

        const updated = { ...selectedRecord, data: { ...selectedRecord.data, [fieldId]: [...currentFiles, ...newFilesList] } };
        setSelectedRecord(updated);
        setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));

        if (!isNew && selectedRecord?.id) api.updateRecord(selectedRecord.id, updated.data);
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Falha ao enviar arquivo de anexo.');
      }
    }
  };

  const removeFile = (fieldId, fileToRemove) => {
    const currentFiles = Array.isArray(selectedRecord.data[fieldId]) ? selectedRecord.data[fieldId] : [];
    const filteredFiles = currentFiles.filter(f => {
      if (typeof f === 'string' && typeof fileToRemove === 'string') return f !== fileToRemove;
      if (f.name && fileToRemove.name) return f.name !== fileToRemove.name;
      return f !== fileToRemove;
    });

    const updated = { ...selectedRecord, data: { ...selectedRecord.data, [fieldId]: filteredFiles } };
    setSelectedRecord(updated);
    setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
  };

  const dashData = useMemo(() => {
    const biFields = allFields.filter(f => f.isBI);
    const byField = {};
    biFields.forEach(field => {
      if (field.type === 'select' || field.type === 'text') {
        const count = records.reduce((acc, r) => {
          const v = r.data[field.id] || 'N/A';
          acc[v] = (acc[v] || 0) + 1;
          return acc;
        }, {});
        const total = records.length;
        byField[field.id] = {
          type: 'categorical',
          data: Object.keys(count).map(k => ({
            name: k,
            value: count[k],
            percent: total ? ((count[k] / total) * 100).toFixed(1) : 0
          }))
        };
      } else if (field.type === 'number' || field.type === 'currency') {
        const dimField = biFields.find(f => (f.type === 'text' || f.type === 'select') && f.id !== field.id);
        const dimKey = dimField?.id || 'f1';
        const byCategory = records.reduce((acc, r) => {
          const cat = r.data[dimKey] || 'Outro';
          const raw = r.data[field.id] || '0';
          const val = parseFloat(String(raw).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(val);
          return acc;
        }, {});
        const flat = records.map(r => parseFloat(String(r.data[field.id] || '0').replace(/[^\d,]/g, '').replace(',', '.')) || 0);
        const totalSum = flat.reduce((a, b) => a + b, 0);
        const totalCount = flat.filter(v => !isNaN(v) && v > 0).length || 1;
        byField[field.id] = {
          type: 'numeric',
          data: Object.keys(byCategory).map(cat => {
            const vals = byCategory[cat];
            const sum = vals.reduce((a, b) => a + b, 0);
            const avg = vals.length ? sum / vals.length : 0;
            return {
              name: cat,
              value: sum,
              media: avg,
              count: vals.length,
              percent: totalSum ? ((sum / totalSum) * 100).toFixed(1) : 0
            };
          }),
          total: totalSum,
          media: totalCount ? totalSum / totalCount : 0
        };
      }
    });
    return byField;
  }, [records, allFields]);

  const currentDetailTabLayout = useMemo(() => {
    const tab = metadata.tabs?.find(t => t.id === activeDetailTab);
    const fieldBank = metadata.fieldBank || [];
    const getField = (id) => fieldBank.find(f => f.id === id);
    if (metadata.fieldBank && tab?.rows) {
      return (tab.rows || []).map(row =>
        (row || []).map(cell => ({ field: getField(cell.fieldId), colSpan: cell.colSpan || 12 })).filter(c => c.field && c.field.isVisible !== false)
      ).filter(row => row.length > 0);
    }
    const fields = tab?.fields?.filter(f => f.isVisible !== false) || [];
    return fields.length ? [fields.map(f => ({ field: f, colSpan: 12 }))] : [];
  }, [activeDetailTab, metadata]);

  const handleInputInteraction = (e) => { e.stopPropagation(); };



  const handleNavigate = (v) => {
    setView(v);
    if (v === 'list') setSubView('livros');
    if (v === 'config') {
      const toSave = metadata.fieldBank
        ? { fieldBank: metadata.fieldBank, tabs: metadata.tabs.map(t => ({ ...t, icon: typeof t.icon === 'string' ? t.icon : t.icon?.displayName || t.id })) }
        : metadata.tabs.map(t => ({ ...t, icon: t.icon?.displayName || t.id }));
      api.saveMetadata(metadata.fieldBank ? toSave : toSave);
    }
  };



  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden antialiased text-sm">
      <style>{poppinsStyle}</style>

      <Sidebar view={view} onNavigate={handleNavigate} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AppHeader view={view} setView={setView} />

        <section className="flex-1 overflow-auto p-6 scrollbar-thin bg-[#F8FAFC]">
          <div className="w-full min-w-0 space-y-6">

            {view === 'list' && (
              <ListView
                subView={subView} setSubView={setSubView}
                activeFilterId={activeFilterId} setActiveFilterId={setActiveFilterId}
                savedFilters={savedFilters} setSavedFilters={setSavedFilters}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                setCurrentPage={setCurrentPage}
                showColumnManager={showColumnManager} setShowColumnManager={setShowColumnManager}
                visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns}
                allFields={allFields} effectiveColumns={effectiveColumns}
                paginated={paginated} handleOpenDetail={handleOpenDetail}
                sortConfig={sortConfig} requestSort={requestSort}
                rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
                currentPage={currentPage} totalPages={totalPages}
                filteredRecords={filteredRecords}
                records={records} setRecords={setRecords}
                editingFilter={editingFilter} setEditingFilter={setEditingFilter}
                getOperatorsByField={getOperatorsByField}
                updateRuleInBlock={updateRuleInBlock}
                saveFilter={saveFilter}
                handleExportExcel={handleExportExcel}
              />
            )}

            {view === 'dashboard' && (
              <DashboardView
                records={records}
                allFields={allFields}
                dashWidgets={dashWidgets}
                setDashWidgets={setDashWidgets}
                onOpenRecord={handleOpenDetail}
              />
            )}

            {view === 'detail' && selectedRecord && (
              <DetailView
                selectedRecord={selectedRecord} setSelectedRecord={setSelectedRecord}
                records={records} setRecords={setRecords}
                metadata={metadata}
                activeDetailTab={activeDetailTab} setActiveDetailTab={setActiveDetailTab}
                setView={setView}
                currentDetailTabLayout={currentDetailTabLayout}
                dragActiveFieldId={dragActiveFieldId}
                handleDrag={handleDrag} handleDrop={handleDrop}
                handleFileSelection={handleFileSelection} removeFile={removeFile}
              />
            )}

            {view === 'config' && (
              <ConfigView
                metadata={metadata} setMetadata={setMetadata}
                confirmModal={confirmModal} setConfirmModal={setConfirmModal}
                editingTabId={editingTabId} setEditingTabId={setEditingTabId}
                activeConfigTab={activeConfigTab} setActiveConfigTab={setActiveConfigTab}
                handleMoveTab={handleMoveTab} handleUpdateTabLabel={handleUpdateTabLabel}
                handleMoveField={handleMoveField} handleUpdateField={handleUpdateField}
                handleAddField={handleAddField}
                executeDelete={executeDelete}
                handleInputInteraction={handleInputInteraction}
              />
            )}

          </div>
        </section>

        <AppFooter />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </AuthProvider>
  );
}
