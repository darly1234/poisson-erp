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
  pipelineStats, totalPipelineBooks,
  filteredRecords,
  records, setRecords,
  editingFilter, setEditingFilter,
  getOperatorsByField, updateRuleInBlock, saveFilter,
  handleExportExcel
}) => (
  <div className="animate-slide">
    <div className="flex gap-4 md:gap-8 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
      <button
        onClick={() => setSubView('livros')}
        className={`pb-4 px-1 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all whitespace-nowrap ${subView === 'livros' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
      >
        Visualização
      </button>
      <button
        onClick={() => setSubView('filtros')}
        className={`pb-4 px-1 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all whitespace-nowrap ${subView === 'filtros' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
      >
        Motores de Busca
      </button>
    </div>

    {subView === 'livros' && (
      <div className="space-y-4">
        {/* New Book Pipeline Graphical Tracker */}
        <BookPipeline stats={pipelineStats} totalBooks={totalPipelineBooks} />

        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={activeFilterId}
                onChange={(e) => { setActiveFilterId(e.target.value); setCurrentPage(1); }}
                className="w-full sm:w-auto pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 transition-all cursor-pointer"
              >
                <option value="all">TODOS OS LIVROS</option>
                {savedFilters.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
              </select>
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" size={14} />
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
            <div className="relative flex-1">
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
          <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0">
            <Button variant="outline" size="sm" icon={Columns} onClick={() => setShowColumnManager(!showColumnManager)} className="flex-1 sm:flex-none">Colunas</Button>
            <Button variant="excel" size="sm" icon={Download} onClick={handleExportExcel} className="flex-1 sm:flex-none">Excel</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => {
              const draftRecord = { id: 'NOVO-LIVRO', data: {}, isNew: true };
              handleOpenDetail(draftRecord);
            }} className="w-full sm:w-auto">Novo Livro</Button>
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
