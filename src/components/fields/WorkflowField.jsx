import React, { useState } from 'react';
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Upload, FileUp, ListOrdered, GripVertical, File, Download } from 'lucide-react';
import { api } from '../../services/api';

const DEFAULT_STAGES = [
    'Para Editar',
    'Conferência',
    'Enviar Prova',
    'Avaliação Autor',
    'Alterações',
    'Para Publicar',
    'Publicado'
];

const createEmptyStage = (title = 'Nova Etapa') => ({
    id: `stage-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    date: '',
    observations: '',
    files: [],
    termsFiles: [],
    completed: false,
    skipChanges: false
});

const WorkflowField = ({ value, onChange, recordId, isNew }) => {
    // Inicialização Lazy: preenche com estágios padrão caso seja nulo/vazio
    const stages = Array.isArray(value) && value.length > 0
        ? value
        : DEFAULT_STAGES.map(title => createEmptyStage(title));

    const [draggedIdx, setDraggedIdx] = useState(null);

    const updateStage = (idx, updates) => {
        const next = stages.map((s, i) => (i === idx ? { ...s, ...updates } : s));
        onChange(next);
    };

    const removeStage = (idx) => {
        if (!window.confirm("Atenção: Tem certeza que deseja excluir esta etapa inteira do fluxo?")) return;
        const next = stages.filter((_, i) => i !== idx);
        onChange(next);
    };

    // Drag and Drop Lógica Simplificada
    const handleDragStart = (e, idx) => {
        setDraggedIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
        // Required for Firefox
        e.dataTransfer.setData('text/html', e.target.parentNode);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetIdx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === targetIdx) return;

        const next = [...stages];
        const [draggedItem] = next.splice(draggedIdx, 1);
        next.splice(targetIdx, 0, draggedItem);

        onChange(next);
        setDraggedIdx(null);
    };

    // Pseudo-Lógica de Upload do Workflow (Simula a do ERP com Base64 para download)
    const handleFileUpload = async (e, stageIdx, fileListKey = 'files') => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const currentFiles = stages[stageIdx][fileListKey] || [];
        const uploadId = isNew ? 'DRAFT' : recordId;

        try {
            const uploadPromises = files.map(f => api.uploadFile(uploadId, f));
            const uploadedResults = await Promise.all(uploadPromises);

            const newFiles = uploadedResults.map(res => ({
                name: res.name,
                url: res.url
            }));

            updateStage(stageIdx, { [fileListKey]: [...currentFiles, ...newFiles] });
        } catch (err) {
            console.error('Workflow upload failed:', err);
            alert('Falha ao enviar arquivo para o workflow.');
        }
    };

    const removeFile = (stageIdx, fileToRemove, fileListKey = 'files') => {
        if (!window.confirm("Tem certeza que deseja apagar este arquivo anexado?")) return;

        const currentFiles = stages[stageIdx][fileListKey] || [];
        // Support both string name (legacy) and object {name, data} deletion
        updateStage(stageIdx, {
            [fileListKey]: currentFiles.filter(f => {
                if (typeof f === 'string' && typeof fileToRemove === 'string') return f !== fileToRemove;
                if (f.name && fileToRemove.name) return f.name !== fileToRemove.name;
                return f !== fileToRemove;
            })
        });
    };

    // Computando o status de skipChanges para desabilitar as etapas subsequentes
    const isSkippedDueToAuthor = stages.some(s => s.title.toLowerCase() === 'avaliação autor' && s.skipChanges);
    const stagesToSkip = ['alterações', 'para publicar'];

    // Calculando o progresso total para visualização
    const validStages = stages.filter(s => !(isSkippedDueToAuthor && stagesToSkip.includes(s.title.toLowerCase())));
    const completedCount = validStages.filter(s => s.completed).length;
    const progressPercent = validStages.length > 0 ? Math.round((completedCount / validStages.length) * 100) : 0;

    return (
        <div className="col-span-1 md:col-span-2 space-y-6 select-none bg-white p-5 md:p-8 rounded-2xl border border-slate-100 shadow-sm w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <ListOrdered className="text-blue-500" size={24} />
                        Fluxo Editorial
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                        Gere a linha do tempo e visualize o progresso do livro.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 w-full sm:w-48">
                    <div className="flex justify-between w-full text-[10px] font-black uppercase text-slate-500">
                        <span>Progresso Geral</span>
                        <span className="text-blue-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            </div>

            <div className="relative pl-6 md:pl-10 space-y-8 py-4">
                {/* Linha Vertical Conectora Oculta/Visível */}
                <div className="absolute left-10 md:left-14 top-8 bottom-8 w-[2px] bg-slate-100 z-0" />

                {stages.map((stage, idx) => {
                    let isCompleted = stage.completed;
                    let dateFilled = !!stage.date;
                    // Nó colorido.
                    let NodeIcon = isCompleted ? CheckCircle2 : Circle;
                    let nodeColor = isCompleted ? 'text-green-500 bg-white' : (dateFilled ? 'text-blue-500 bg-white' : 'text-slate-300 bg-white');

                    // Skip logic: se a etapa foi invalidada (pulada via Avaliação)
                    let isSkippedStage = isSkippedDueToAuthor && stagesToSkip.includes(stage.title.toLowerCase());
                    let opacityClass = isSkippedStage ? 'opacity-40 pointer-events-none grayscale' : '';

                    // Alerta: etapa concluída mas sem data registrada
                    const isMissingDate = stage.completed && !stage.date && !isSkippedStage;

                    return (
                        <div
                            key={stage.id}
                            className={`relative z-10 flex gap-4 md:gap-6 group ${opacityClass}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idx)}
                        >
                            {/* Timeline Node */}
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${isMissingDate ? 'border-red-400 text-red-500 bg-red-50 animate-pulse' : 'border-white ' + nodeColor}`}
                                onClick={() => updateStage(idx, { completed: !isCompleted })}
                                title={isMissingDate ? "⚠️ Etapa concluída sem data!" : "Marcar como concluído"}
                            >
                                <NodeIcon size={20} className={isMissingDate ? '' : (isCompleted ? 'fill-green-100' : '')} />
                            </div>

                            {/* Stage Card */}
                            <div className={`flex-1 bg-white border rounded-2xl p-4 md:p-5 shadow-sm transition-all ${isMissingDate ? 'border-red-300 ring-1 ring-red-200 hover:border-red-400' : 'border-slate-200 hover:shadow-md hover:border-blue-200'}`}>
                                {/* Header do Card (Título, Data e Controles) */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="cursor-grab hover:bg-slate-100 p-1 rounded-md text-slate-300 transition-colors" title="Arrastar">
                                            <GripVertical size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            className={`w-full max-w-[180px] text-sm font-black bg-transparent outline-none border-b border-dashed border-transparent focus:border-blue-400 transition-colors ${isMissingDate ? 'text-red-700' : (isCompleted ? 'text-green-700' : 'text-slate-700')}`}
                                            value={stage.title}
                                            onChange={(e) => updateStage(idx, { title: e.target.value })}
                                            placeholder="Nome da Etapa"
                                        />

                                        {/* Lógica Específica: Checkbox em "Avaliação Autor" */}
                                        {stage.title.toLowerCase() === 'avaliação autor' && (
                                            <label className="ml-2 flex items-center gap-1.5 cursor-pointer bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/50 hover:bg-blue-100/50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                                                    checked={stage.skipChanges || false}
                                                    onChange={(e) => updateStage(idx, { skipChanges: e.target.checked })}
                                                />
                                                <span className="text-[10px] font-black uppercase text-blue-700 whitespace-nowrap pt-0.5">Não existem alterações</span>
                                            </label>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className={`p-2 rounded-xl flex items-center gap-2 transition-colors ${stage.completed ? (stage.date ? 'bg-green-50/50' : 'bg-red-50/80 ring-1 ring-red-200 shadow-sm') : 'bg-slate-50'}`}>
                                            <Calendar size={13} className={isMissingDate ? 'text-red-500 shrink-0' : 'text-slate-400 shrink-0'} />
                                            <input
                                                type="date"
                                                value={stage.date || ''}
                                                onChange={(e) => updateStage(idx, { date: e.target.value })}
                                                className={`text-xs font-bold bg-transparent outline-none w-full ${isMissingDate ? 'text-red-600' : 'text-slate-600'}`}
                                                title={isMissingDate ? "Atenção: Data pendente para etapa concluída!" : "Data de Conclusão"}
                                            />
                                        </div>
                                        {isMissingDate && (
                                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 border border-red-200 px-2 py-1 rounded-md whitespace-nowrap animate-pulse">
                                                Sem Data!
                                            </span>
                                        )}
                                        <button
                                            onClick={() => removeStage(idx)}
                                            className="p-2 lg:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Excluir Etapa"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Corpo do Card: Observações e File Upload lado a lado */}
                                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
                                    <textarea
                                        placeholder="Adicione observações para essa etapa..."
                                        className="w-full min-h-[90px] p-3 text-xs bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all resize-y"
                                        value={stage.observations || ''}
                                        onChange={(e) => updateStage(idx, { observations: e.target.value })}
                                    />

                                    <div className="flex flex-col gap-3">
                                        <div className="bg-slate-50 border border-slate-100 border-dashed rounded-xl p-3 flex flex-col gap-2 relative group/upload transition-all hover:bg-blue-50/30 hover:border-blue-200">
                                            <input
                                                type="file"
                                                id={`wf-upload-${stage.id}`}
                                                multiple
                                                onChange={(e) => handleFileUpload(e, idx, 'files')}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />

                                            {(stage.files || []).length === 0 ? (
                                                <div className="flex flex-col items-center justify-center flex-1 min-h-[70px] pointer-events-none text-slate-400 group-hover/upload:text-blue-500 transition-colors">
                                                    <FileUp size={24} className="mb-1" />
                                                    <span className="text-[10px] font-black uppercase text-center">Anexar Arquivo(s)</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col h-full pointer-events-auto z-20 overflow-y-auto max-h-[90px] scrollbar-thin scrollbar-thumb-slate-200 pr-1 gap-1">
                                                    {(stage.files || []).map((file, fIdx) => {
                                                        const isMock = typeof file === 'string';
                                                        const fileName = isMock ? file : file.name;
                                                        const fileData = isMock ? null : file.data;

                                                        return (
                                                            <div key={fIdx} className="flex justify-between items-center bg-white border border-slate-200 rounded-md py-1.5 px-2">
                                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                                    <File size={12} className="text-slate-400 shrink-0" />
                                                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]" title={fileName}>{fileName}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault(); e.stopPropagation();
                                                                            if (file.url) {
                                                                                window.open(file.url, '_blank');
                                                                            } else if (fileData) {
                                                                                const link = document.createElement('a');
                                                                                link.href = fileData;
                                                                                link.download = fileName;
                                                                                link.click();
                                                                            } else {
                                                                                alert('Este arquivo não possui link válido para download.');
                                                                            }
                                                                        }}
                                                                        className="p-1 text-orange-500 bg-orange-50 hover:bg-orange-100 hover:text-orange-600 shrink-0 ml-1 rounded transition-colors"
                                                                        title="Visualizar/Download"
                                                                    >
                                                                        <Download size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(idx, file, 'files'); }}
                                                                        className="p-1 text-slate-300 hover:text-red-500 shrink-0 ml-1"
                                                                        title="Remover anexo"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Específico para Termo de Cessão na Etapa Inicial */}
                                        {idx === 0 && (
                                            <div className="bg-[#FFF8F0] border-[#FF9800] border-dashed rounded-xl p-3 flex flex-col gap-2 relative group/upload transition-all hover:bg-[#FFF3E0]">
                                                <input
                                                    type="file"
                                                    id={`wf-terms-${stage.id}`}
                                                    multiple
                                                    onChange={(e) => handleFileUpload(e, idx, 'termsFiles')}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />

                                                {(stage.termsFiles || []).length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center flex-1 min-h-[70px] pointer-events-none text-[#FF9800] transition-colors">
                                                        <FileUp size={24} className="mb-1" />
                                                        <span className="text-[10px] font-black uppercase text-center">Termo de Cessão</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col h-full pointer-events-auto z-20 overflow-y-auto max-h-[90px] scrollbar-thin scrollbar-thumb-slate-200 pr-1 gap-1">
                                                        {(stage.termsFiles || []).map((file, fIdx) => {
                                                            const isMock = typeof file === 'string';
                                                            const fileName = isMock ? file : file.name;
                                                            const fileData = isMock ? null : file.data;

                                                            return (
                                                                <div key={fIdx} className="flex justify-between items-center bg-white border border-[#FF9800]/20 rounded-md py-1.5 px-2">
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                        <File size={12} className="text-[#FF9800] shrink-0" />
                                                                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]" title={fileName}>{fileName}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault(); e.stopPropagation();
                                                                                if (file.url) {
                                                                                    window.open(file.url, '_blank');
                                                                                } else if (fileData) {
                                                                                    const link = document.createElement('a');
                                                                                    link.href = fileData;
                                                                                    link.download = fileName;
                                                                                    link.click();
                                                                                } else {
                                                                                    alert('Este arquivo não possui link válido para download.');
                                                                                }
                                                                            }}
                                                                            className="p-1 text-orange-500 bg-orange-50 hover:bg-orange-100 hover:text-orange-600 shrink-0 ml-1 rounded transition-colors"
                                                                            title="Visualizar/Download"
                                                                        >
                                                                            <Download size={12} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(idx, file, 'termsFiles'); }}
                                                                            className="p-1 text-slate-400 hover:text-red-500 shrink-0 ml-1"
                                                                            title="Remover termo"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default WorkflowField;
