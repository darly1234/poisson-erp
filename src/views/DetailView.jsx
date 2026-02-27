import React, { useState } from 'react';
import { Trash2, Upload, File, CheckCircle2, Info, BookOpen, Wallet, Folder, Globe, FileUp, Download, Link, ShoppingBag, FolderOpen, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import AuthorsField from '../components/fields/AuthorsField';
import NegotiatorField from '../components/fields/NegotiatorField';
import PaymentStatusField from '../components/fields/PaymentStatusField';
import WorkflowField from '../components/fields/WorkflowField';
import CoverField from '../components/fields/CoverField';
import BookDetailPipeline from '../components/BookDetailPipeline';
import FichyContainer from '../components/fichy/FichyContainer';
import CrossrefTab from '../components/crossref/CrossrefTab';
import WordPressTab from '../components/wordpress/WordPressTab';
import FileManagerTab from '../components/files/FileManagerTab';
import MessagingTab from '../components/MessagingTab';
import { applyMask } from '../utils/masks';
import { api } from '../services/api';

const ICON_MAP = { Info, BookOpen, Wallet, Database: Folder, User: Info };

const FieldRenderer = ({
  f, selectedRecord, setSelectedRecord, records, setRecords, dragActiveFieldId,
  handleDrag, handleDrop, handleFileSelection, removeFile
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest px-1 block">{f.label}</label>
    {f.type === 'select' ? (
      <select
        className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#1E88E5] transition-all shadow-sm"
        value={selectedRecord.data[f.id] || ""}
        onChange={e => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: e.target.value } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
      >
        <option value="">Selecione...</option>
        {f.options && (Array.isArray(f.options) ? f.options : String(f.options).split(',').map(s => s.trim()).filter(Boolean)).map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    ) : f.type === 'authors' ? (
      <AuthorsField
        value={selectedRecord.data[f.id]}
        onChange={next => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: next } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
      />
    ) : f.type === 'negotiator' ? (
      <NegotiatorField
        value={selectedRecord.data[f.id]}
        onChange={next => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: next } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
      />
    ) : f.type === 'payment_status' ? (
      <PaymentStatusField
        value={selectedRecord.data[f.id]}
        onChange={next => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: next } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
      />
    ) : f.type === 'workflow' ? (
      <WorkflowField
        recordId={selectedRecord.id}
        isNew={selectedRecord.isNew}
        value={selectedRecord.data[f.id]}
        onChange={next => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: next } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          if (!selectedRecord.isNew) api.updateRecord(selectedRecord.id, updated.data);
        }}
      />
    ) : f.type === 'cover' ? (
      <CoverField
        value={selectedRecord.data[f.id]}
        onChange={next => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: next } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
      />
    ) : f.type === 'file' ? (
      <div className="space-y-4">
        <div
          className={`relative group transition-all duration-300 ${dragActiveFieldId === f.id ? 'scale-[1.01]' : ''}`}
          onDragEnter={e => handleDrag(e, f.id)}
          onDragLeave={e => handleDrag(e, f.id)}
          onDragOver={e => handleDrag(e, f.id)}
          onDrop={e => handleDrop(e, f.id)}
        >
          <input type="file" id={`file-${f.id}`} className="hidden" multiple onChange={e => handleFileSelection(e, f.id)} />
          <label
            htmlFor={`file-${f.id}`}
            className={`w-full min-h-[120px] px-6 py-6 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all border-2 border-dashed ${dragActiveFieldId === f.id ? 'bg-[#FFF3E0] border-[#FF9800] shadow-sm' : 'bg-transparent border-slate-200 hover:border-[#FF9800] hover:bg-[#FFF8F0]'}`}
          >
            <div className="text-[#FF9800] mb-2">
              <FileUp size={32} strokeWidth={2} />
            </div>
            <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Anexar Arquivo (Tamanho Ilimitado)</span>
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">(Suporta qualquer formato)</span>
          </label>
        </div>
        {Array.isArray(selectedRecord.data[f.id]) && selectedRecord.data[f.id].length > 0 && (
          <div className="space-y-2">
            {selectedRecord.data[f.id].map((fileObj, idx) => {
              const isMock = typeof fileObj === 'string';
              const fileName = isMock ? fileObj : fileObj.name;
              const fileData = isMock ? null : fileObj.data;

              return (
                <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-xl group/genfile">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <File size={14} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] font-bold truncate max-w-[200px]" title={fileName}>{fileName}</span>
                  </div>
                  <div className="flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (fileObj.url) {
                          window.open(fileObj.url, '_blank');
                        } else if (fileData) {
                          const link = document.createElement('a');
                          link.href = fileData;
                          link.download = fileName;
                          link.click();
                        } else {
                          alert('Este arquivo não possui link válido para download.');
                        }
                      }}
                      className="p-1.5 text-orange-500 bg-orange-50 hover:bg-orange-100 hover:text-orange-600 rounded transition-colors"
                      title="Visualizar/Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => removeFile(f.id, isMock ? fileName : fileObj)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-100 md:opacity-0 group-hover/genfile:opacity-100 transition-opacity"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ) : f.type === 'long_text' ? (
      <textarea
        className="w-full min-h-[120px] p-4 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#1E88E5] transition-all shadow-sm resize-y"
        value={selectedRecord.data[f.id] || ""}
        onChange={e => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: e.target.value } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
        onKeyDown={e => e.stopPropagation()}
      />
    ) : (
      <input
        type={f.type === 'date' ? 'date' : 'text'}
        className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#1E88E5] transition-all shadow-sm"
        value={selectedRecord.data[f.id] || ""}
        onChange={e => {
          const masked = applyMask(e.target.value, f.type);
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, [f.id]: masked } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
        onKeyDown={e => e.stopPropagation()}
      />
    )}
  </div>
);

const DetailView = ({
  selectedRecord, setSelectedRecord, records, setRecords,
  metadata, activeDetailTab, setActiveDetailTab, setView,
  currentDetailTabLayout,
  dragActiveFieldId, handleDrag, handleDrop, handleFileSelection, removeFile
}) => {
  const tabs = [
    ...(metadata?.tabs || []),
    { id: 'fichy', label: 'Ficha Catalográfica', icon: BookOpen },
    { id: 'crossref', label: 'Crossy', icon: Link },
    { id: 'wordpress', label: 'WordPress', icon: ShoppingBag },
    { id: 'messaging', label: 'Comunicação', icon: Mail },
    { id: 'files', label: 'Arquivos', icon: FolderOpen },
  ];
  const fieldBank = metadata?.fieldBank;

  // Capa frontal: procura em campos do tipo 'cover' ou no campo capa_frontal
  const coverData = (() => {
    const d = selectedRecord.data;
    // Procura em todos os campos por um array de imagens (cover field)
    for (const key of Object.keys(d)) {
      const val = d[key];
      if (val && typeof val === 'object' && val.front) {
        // file_compound com {front, back}
        const f = val.front;
        if (f && typeof f === 'string' && f.startsWith('data:')) return { base64: f, mime: f.split(';')[0].split(':')[1], filename: 'capa.jpg' };
        if (f && f.data) return { base64: f.data, mime: f.data.split(';')[0].split(':')[1], filename: f.name || 'capa.jpg' };
      }
      if (Array.isArray(val) && val.length > 0) {
        const first = val[0];
        if (first && first.data && first.data.startsWith('data:image')) {
          return { base64: first.data, mime: first.data.split(';')[0].split(':')[1], filename: first.name || 'capa.jpg' };
        }
      }
    }
    return null;
  })();

  // Canonical data: merge all DB field aliases into unified keys used by Fichy and Crossy
  const d = selectedRecord.data;
  const canonicalData = {
    titulo: d.titulo || d.f_title || d.title || d.f6 || '',
    isbn: d.isbn || d.f7 || '',
    ano: d.ano || d.f11 || '',
    editora: d.editora || d.f10 || 'Editora Poisson',
    doi: (typeof d.doi === 'string' ? d.doi : '') || (typeof d.f_doi === 'string' ? d.f_doi : '') || (typeof d.f18 === 'string' ? d.f18 : '') || '',
    url: (typeof d.url === 'string' ? d.url : '') || (typeof d.f_url === 'string' ? d.f_url : '') || (typeof d.f20 === 'string' ? d.f20 : '') || 'https://livros.poisson.com.br/individuais/',
    nomes: d.nomes || (d.f1 || d.author ? [d.f1 || d.author].filter(Boolean) : []),
    wp_description: d.wp_description || '',
    wp_abstract: d.wp_abstract || '',
    wp_area: d.wp_area || '',
    wp_ler_online: d.wp_ler_online || '',
    wp_data: d.wp_data || '',
    wp_product_id: d.wp_product_id || null,
    wp_product_url: d.wp_product_url || '',
    wp_product_status: d.wp_product_status || 'publish',
  };

  const [saveToast, setSaveToast] = useState(false);

  const handleConfirm = async () => {
    // 1. Validação de Título Obrigatório
    if (!canonicalData.titulo || canonicalData.titulo.trim() === '') {
      alert("⚠️ Erro: O Título da Obra é obrigatório para salvar!");
      return;
    }

    try {
      if (selectedRecord.isNew) {
        // 2. Gerar ID real baseado no maior ID existente
        const nextIdNum = records.length > 0 ? Math.max(...records.map(r => parseInt(r.id.split('-')[1]) || 0)) + 1 : 1;
        const newId = `I-${String(nextIdNum).padStart(3, '0')}`;

        const finalRecord = { ...selectedRecord, id: newId };
        delete finalRecord.isNew;

        await api.createRecord({ id: finalRecord.id, data: finalRecord.data });

        setRecords(prev => [finalRecord, ...prev]);
        setSelectedRecord(finalRecord);
        setSaveToast(true);
      } else {
        // 3. Atualizar registro existente
        await api.updateRecord(selectedRecord.id, selectedRecord.data);
        setSaveToast(true);
      }
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar os dados no servidor.');
    }
  };

  const handleWordPressUpdate = (updates) => {
    const updated = { ...selectedRecord, data: { ...selectedRecord.data, ...updates } };
    setSelectedRecord(updated);
    setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
    api.updateRecord(selectedRecord.id, updated.data);
  };
  // Caminho do DOI no gerenciador de arquivos (ex: /individuais/978-65-5866-635-6)
  const doiFilesPath = canonicalData.doi
    ? `/individuais/${canonicalData.doi.replace(/^.*\//, '')}`
    : '/individuais';

  const getTabHasContent = (tab) => {
    if (tab.id === 'fichy' || tab.id === 'crossref' || tab.id === 'wordpress' || tab.id === 'files' || tab.id === 'messaging') return true;
    if (fieldBank && tab.rows) return tab.rows.some(r => (r || []).length > 0);
    return (tab.fields || []).length > 0;
  };
  return (
    <div className="w-full animate-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter flex flex-wrap items-center gap-2 md:gap-4 leading-tight">
            <span className="text-blue-700 bg-blue-50 px-3 md:px-4 py-1 rounded-xl md:rounded-2xl border border-blue-200 text-sm md:xl font-mono shrink-0">{selectedRecord.id}</span>
            <span className="truncate max-w-[300px] md:max-w-none">{canonicalData.titulo || 'Obra Sem Título'}</span>
          </h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-[0.15em] text-[9px] md:text-[10px]">Gestão Individual Poisson</p>
        </div>
        <Button variant="danger" size="xs" icon={Trash2} onClick={() => api.deleteRecord(selectedRecord.id).then(() => { setRecords(records.filter(r => r.id !== selectedRecord.id)); setView('list'); })}>
          Eliminar
        </Button>
      </div>

      <BookDetailPipeline
        bookStatus={selectedRecord.data.status || selectedRecord.data.f3 || 'Para editar'}
        recordData={selectedRecord.data}
        onUpdate={(newPipelineDates) => {
          const updated = { ...selectedRecord, data: { ...selectedRecord.data, pipeline_dates: newPipelineDates } };
          setSelectedRecord(updated);
          setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
          api.updateRecord(selectedRecord.id, updated.data);
        }}
      />

      <Card className="border-none shadow-2xl overflow-visible">
        <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto no-scrollbar whitespace-nowrap">
          {tabs.filter(t => getTabHasContent(t)).map(tab => {
            const isActive = activeDetailTab === tab.id;
            const Icon = typeof tab.icon === 'function' ? tab.icon : ICON_MAP[tab.icon] || Info;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`flex items-center gap-2 py-3 md:py-4 px-4 md:px-5 rounded-t-lg border transition-all -mb-px font-bold text-[10px] md:text-[11px] ${isActive
                  ? 'bg-white border-slate-200 border-b-white text-slate-800 shadow-sm relative z-10'
                  : 'bg-slate-100/80 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
              >
                <Icon size={12} className="opacity-80" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 md:p-10 min-h-[350px] bg-white border border-slate-200 border-t-0 rounded-b-xl">
          {activeDetailTab === 'fichy' ? (
            <FichyContainer
              initialData={canonicalData}
              onDataSync={(fichyData) => {
                const updated = {
                  ...selectedRecord,
                  data: { ...selectedRecord.data, ...fichyData }
                };
                setSelectedRecord(updated);
                setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
                api.updateRecord(selectedRecord.id, updated.data);
              }}
            />
          ) : activeDetailTab === 'crossref' ? (
            <CrossrefTab
              initialData={canonicalData}
              onDataSync={(crossyData) => {
                const updated = {
                  ...selectedRecord,
                  data: { ...selectedRecord.data, ...crossyData }
                };
                setSelectedRecord(updated);
                setRecords(records.map(r => r.id === selectedRecord.id ? updated : r));
                api.updateRecord(selectedRecord.id, updated.data);
              }}
            />
          ) : activeDetailTab === 'wordpress' ? (
            <WordPressTab
              initialData={canonicalData}
              coverImageBase64={coverData?.base64 || null}
              coverMime={coverData?.mime || 'image/jpeg'}
              coverFilename={coverData?.filename || 'capa.jpg'}
              onUpdate={handleWordPressUpdate}
            />
          ) : activeDetailTab === 'files' ? (
            <FileManagerTab
              initialPath={doiFilesPath}
              fallbackPath="/individuais"
            />
          ) : activeDetailTab === 'messaging' ? (
            <MessagingTab
              recordId={selectedRecord.id}
              canonicalData={canonicalData}
            />
          ) : (
            <div className="w-full bg-[#FAFAFA] md:bg-[#E6E6E6] p-4 lg:p-8 rounded-xl md:rounded-2xl shadow-sm md:shadow-md md:border-t-[8px] border-[#1E88E5]">

              {(() => {
                const activeTabObj = tabs.find(t => t.id === activeDetailTab);
                const ActiveIcon = typeof activeTabObj?.icon === 'function' ? activeTabObj.icon : ICON_MAP[activeTabObj?.icon] || Info;
                return activeTabObj ? (
                  <header className="border-b border-slate-200 md:border-slate-300 pb-3 md:pb-4 mb-4 md:mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-2 md:gap-4">
                    <div>
                      <div className="text-[9px] font-bold text-[#1F2A8A] tracking-widest mb-1 uppercase opacity-60">Gestão da Obra</div>
                      <h1 className="text-lg md:text-2xl font-black text-[#1F2A8A] flex items-center gap-2 uppercase tracking-tighter leading-none">
                        <ActiveIcon className="w-5 h-5 md:w-7 md:h-7 text-[#F57C00]" />
                        {activeTabObj.label}
                      </h1>
                    </div>
                  </header>
                ) : null;
              })()}

              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-top-1 duration-200">
                {(currentDetailTabLayout || []).map((row, ri) => (
                  <div key={ri} className="flex flex-col md:grid md:grid-cols-12 gap-4 xl:gap-6">
                    {row.map(({ field: f, colSpan }, ci) =>
                      f ? (
                        <div key={`${f.id}-${ci}`} className={`w-full`} style={{ gridColumn: window.innerWidth > 768 ? `span ${colSpan || 12}` : 'span 12' }}>
                          <FieldRenderer
                            f={f}
                            selectedRecord={selectedRecord}
                            setSelectedRecord={setSelectedRecord}
                            records={records}
                            setRecords={setRecords}
                            dragActiveFieldId={dragActiveFieldId}
                            handleDrag={handleDrag}
                            handleDrop={handleDrop}
                            handleFileSelection={handleFileSelection}
                            removeFile={removeFile}
                          />
                        </div>
                      ) : null
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
          <div className={`transition-all duration-500 flex items-center gap-2 text-green-600 text-xs font-black ${saveToast ? 'opacity-100' : 'opacity-0'}`}>
            <CheckCircle2 size={16} />
            Salvo com sucesso!
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => setView('list')} className="flex-1 sm:flex-none">Fechar</Button>
            <Button variant="primary" size="md" icon={CheckCircle2} onClick={handleConfirm} className="flex-1 sm:flex-none">Salvar Dados</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DetailView;
