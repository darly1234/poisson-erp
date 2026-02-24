import React from 'react';
import { Filter, Search, ChevronDown, Columns, Download, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import ColumnManager from '../components/list/ColumnManager';
import RecordsTable from '../components/list/RecordsTable';
import FilterView from './FilterView';
import BookPipeline from '../components/BookPipeline';
import { api } from '../services/api';

const ListView = ({
  subView, setSubView,
  activeFilterId, setActiveFilterId,
  savedFilters, setSavedFilters,
  searchTerm, setSearchTerm,
  setCurrentPage,
  showColumnManager, setShowColumnManager,
  visibleColumns, setVisibleColumns,
  allFields, effectiveColumns,
  paginated, handleOpenDetail,
  sortConfig, requestSort,
  rowsPerPage, setRowsPerPage,
  currentPage, totalPages,
  filteredRecords,
  records, setRecords,
  editingFilter, setEditingFilter,
  getOperatorsByField, updateRuleInBlock, saveFilter,
  handleExportExcel
}) => (
  <div className="animate-slide">
    <div className="flex gap-8 border-b border-slate-200 mb-6">
      <button
        onClick={() => setSubView('livros')}
        className={`pb-4 px-1 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${subView === 'livros' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
      >
        Visualização de Dados
      </button>
      <button
        onClick={() => setSubView('filtros')}
        className={`pb-4 px-1 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${subView === 'filtros' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
      >
        Motores de Busca
      </button>
    </div>

    {subView === 'livros' && (
      <div className="space-y-4">
        {/* New Book Pipeline Graphical Tracker */}
        <BookPipeline />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <select
                value={activeFilterId}
                onChange={(e) => { setActiveFilterId(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 transition-all cursor-pointer"
              >
                <option value="all">TODOS OS LIVROS</option>
                {savedFilters.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
              </select>
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" size={14} />
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Procura global..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-all shadow-inner"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                onKeyDown={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={Columns} onClick={() => setShowColumnManager(!showColumnManager)}>Colunas</Button>
            <Button variant="excel" size="sm" icon={Download} onClick={handleExportExcel}>Excel</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => {
              const nextIdNum = records.length > 0 ? Math.max(...records.map(r => parseInt(r.id.split('-')[1]) || 0)) + 1 : 1;

              const newRec = { id: `I-${String(nextIdNum).padStart(3, '0')}`, data: {} };
              api.createRecord({ id: newRec.id, data: {} }).then(() => {
                setRecords(prev => [newRec, ...prev]);
                handleOpenDetail(newRec);
              });




            }}>Novo Livro</Button>
          </div>
        </div>

        {showColumnManager && (
          <ColumnManager
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            allFields={allFields}
            onClose={() => setShowColumnManager(false)}
          />
        )}

        <RecordsTable
          effectiveColumns={effectiveColumns}
          paginated={paginated}
          allFields={allFields}
          handleOpenDetail={handleOpenDetail}
          sortConfig={sortConfig}
          requestSort={requestSort}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          filteredRecords={filteredRecords}
        />
      </div>
    )}

    {subView === 'filtros' && (
      <FilterView
        savedFilters={savedFilters} setSavedFilters={setSavedFilters}
        editingFilter={editingFilter} setEditingFilter={setEditingFilter}
        allFields={allFields}
        setActiveFilterId={setActiveFilterId}
        getOperatorsByField={getOperatorsByField}
        updateRuleInBlock={updateRuleInBlock}
        saveFilter={saveFilter}
      />
    )}
  </div>
);

export default ListView;
