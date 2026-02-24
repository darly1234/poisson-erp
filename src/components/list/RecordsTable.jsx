import React from 'react';
import { ChevronRight, ChevronLeft, ArrowUp, ArrowDown } from 'lucide-react';
import Card from '../ui/Card';

const RecordsTable = ({
  effectiveColumns, paginated, allFields, handleOpenDetail,
  sortConfig, requestSort,
  rowsPerPage, setRowsPerPage,
  currentPage, setCurrentPage,
  totalPages, filteredRecords
}) => (
  <Card>
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead className="bg-slate-50/50 sticky top-0 z-10">
          <tr>
            {effectiveColumns.map(c => (
              <th
                key={c}
                onClick={() => requestSort(c)}
                className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {allFields.find(f => f.id === c)?.label || 'ID'}
                  {sortConfig.key === c && (
                    sortConfig.direction === 'asc'
                      ? <ArrowUp size={12} className="text-blue-600" />
                      : <ArrowDown size={12} className="text-blue-600" />
                  )}
                </div>
              </th>
            ))}
            <th className="px-5 py-4 border-b border-slate-200"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {paginated.map(r => (
            <tr
              key={r.id}
              onClick={() => handleOpenDetail(r)}
              className="hover:bg-blue-50/40 cursor-pointer group transition-all duration-200"
            >
              {effectiveColumns.map(c => (
                <td key={c} className="px-5 py-4 text-slate-600 text-xs font-medium border-b border-slate-100">
                  {c === 'id'
                    ? <span className="font-mono text-blue-700 bg-blue-100/50 px-2 py-1 rounded-md text-[10px] font-black border border-blue-200/50">{r.id}</span>
                    : (() => {
                      const val = r.data[c];
                      const field = allFields.find(f => f.id === c);
                      if (field?.type === 'authors' && val) {
                        const pessoas = Array.isArray(val?.pessoas) ? val.pessoas : (Array.isArray(val) ? val : []);
                        const papel = val?.papel || pessoas[0]?.role || 'Autor';
                        if (pessoas.length === 0) return '-';
                        const first = pessoas[0];
                        const count = pessoas.length;
                        const nome = first?.nome;
                        return nome
                          ? `${nome}${count > 1 ? ` +${count - 1}` : ''} (${papel})`
                          : `${count} ${papel}${count > 1 ? 's' : ''}`;
                      }
                      if (field?.type === 'negotiator' && val) {
                        const pessoas = Array.isArray(val) ? val : [];
                        if (pessoas.length === 0) return '-';
                        const first = pessoas[0];
                        const count = pessoas.length;
                        const nome = first?.nome;
                        return nome
                          ? `${nome}${count > 1 ? ` +${count - 1}` : ''}`
                          : `${count} negociador${count > 1 ? 'es' : ''}`;
                      }
                      if (field?.type === 'payment_status' && val && typeof val === 'object') {
                        if (val.status === 'Parcelado' && Array.isArray(val.parcelas)) {
                          return `Parcelado (${val.parcelas.length}x)`;
                        }
                        return val.status || '';
                      }
                      if (field?.type === 'workflow' && Array.isArray(val)) {
                        const completed = val.filter(s => s.completed).length;
                        return `${completed}/${val.length} concluídas`;
                      }
                      if (Array.isArray(val)) return `${val.length} ficheiros`;
                      if (field?.type === 'long_text' && typeof val === 'string' && val.length > 50) {
                        return val.substring(0, 50) + '...';
                      }
                      return val || '-';
                    })()
                  }
                </td>
              ))}
              <td className="px-5 py-4 text-right border-b border-slate-100">
                <ChevronRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exibir</span>
          <select
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 outline-none hover:bg-blue-100 transition-colors"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} livros</option>)}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Total: <span className="text-slate-800 font-black">{filteredRecords.length} livros</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
          className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
          Página <span className="text-blue-700 font-black">{currentPage}</span> de <span className="text-slate-800 font-black">{totalPages}</span>
        </div>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
          className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </Card>
);

export default RecordsTable;
