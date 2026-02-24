import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const PIPELINE_STAGES = [
    { id: 'Para editar', label: 'Para Editar' },
    { id: 'Editados / Conferência', label: 'Conferência' },
    { id: 'Para enviar prova', label: 'Enviar Prova' },
    { id: 'Avaliação do autor', label: 'Avaliação Autor' },
    { id: 'Alterações', label: 'Alterações' },
    { id: 'Para publicar', label: 'Para Publicar' },
    { id: 'Publicado', label: 'Publicado' }
];

const calculateDaysBetween = (dateStr1, dateStr2) => {
    if (!dateStr1 || !dateStr2) return null;
    const [d1, m1, y1] = dateStr1.split('-');
    const [d2, m2, y2] = dateStr2.split('-');
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const parseDDMMYYYY = (ddmmyyyy) => {
    if (!ddmmyyyy) return '';
    const [d, m, y] = ddmmyyyy.split('-');
    return `${y}-${m}-${d}`;
};

const formatToDDMMYYYY = (yyyymmdd) => {
    if (!yyyymmdd) return '';
    const [y, m, d] = yyyymmdd.split('-');
    return `${d}-${m}-${y}`;
};

const todayDDMMYYYY = () => {
    const t = new Date();
    const dd = String(t.getDate()).padStart(2, '0');
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${t.getFullYear()}`;
};

const todayISO = () => new Date().toISOString().split('T')[0];

const extractWorkflowDates = (workflowTimeline) => {
    // Array de objetos do form: { title: '...', date: 'YYYY-MM-DD', ... }
    const mappedDates = {};
    if (!Array.isArray(workflowTimeline)) return mappedDates;

    PIPELINE_STAGES.forEach(stage => {
        // Find matching stage in workflow data (case insensitive)
        const wfStage = workflowTimeline.find(wf => wf.title?.toLowerCase() === stage.label.toLowerCase());
        if (wfStage && wfStage.date) {
            // wfStage.date is usually YYYY-MM-DD from input type="date"
            mappedDates[stage.id] = formatToDDMMYYYY(wfStage.date);
        }
    });

    return mappedDates;
};

const BookDetailPipeline = ({ bookStatus, recordData = {} }) => {
    // Agora as datas vêm diretamente da aba Fluxo Oficial (ReadOnly)
    const dates = extractWorkflowDates(recordData.f_workflow_timeline || []);

    const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === bookStatus);
    const totalDays = dates['Para editar'] ? calculateDaysBetween(dates['Para editar'], todayDDMMYYYY()) : null;

    return (
        <div className="bg-[#1f273f] p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden mb-8">
            {/* Header */}
            <div className="mb-8 pb-4 border-b border-slate-700/50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Evolução do Livro</h3>
                    <p className="text-[#9faef9]/70 text-xs mt-1">Histórico de etapas e progresso editorial.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-[#9faef9]/10 text-[#9faef9] px-4 py-1.5 rounded-full text-xs font-bold border border-[#9faef9]/20 uppercase tracking-widest">
                        Fase Atual
                    </div>
                    {totalDays !== null && (
                        <div className="text-[11px] font-black text-white uppercase tracking-widest">
                            {totalDays} DIAS NO TOTAL
                        </div>
                    )}
                </div>
            </div>

            {/* Pipeline */}
            <div className="relative py-4 px-2 overflow-x-auto scrollbar-thin pb-8 mt-4">
                <div className="flex flex-row justify-between relative z-10 min-w-[700px] gap-2">
                    {PIPELINE_STAGES.map((stage, index) => {
                        const isReached = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;
                        const dateReached = dates[stage.id];

                        const hasPrevDate = index > 0 && !!dates[PIPELINE_STAGES[index - 1].id];
                        const hasCurrentDate = !!dateReached;

                        // Days badge
                        let daysBadge = null;
                        if (hasPrevDate && hasCurrentDate) {
                            const prevDate = dates[PIPELINE_STAGES[index - 1].id];
                            const daysDiff = calculateDaysBetween(prevDate, dateReached);
                            if (daysDiff !== null) {
                                daysBadge = (
                                    <div className="absolute top-1/2 left-0 w-full flex justify-center -translate-y-[210%] md:-translate-y-1/2 -translate-x-[50%] -z-10 pointer-events-none">
                                        <span className="bg-[#0f172b] text-white text-[10px] font-black px-3 py-0.5 rounded-full border border-[#9faef9]/30 whitespace-nowrap z-20 shadow-sm relative md:-top-7">
                                            {daysDiff} dias
                                        </span>
                                    </div>
                                );
                            }
                        }

                        // Connector line only between two filled stages
                        const activeLine = (hasPrevDate && hasCurrentDate) ? (
                            <div className="absolute top-1/2 right-1/2 w-full h-1.5 bg-[#9faef9] -translate-y-1/2 -z-20 hidden md:block"></div>
                        ) : null;

                        const minIsoDate = index > 0 && dates[PIPELINE_STAGES[index - 1].id]
                            ? parseDDMMYYYY(dates[PIPELINE_STAGES[index - 1].id])
                            : undefined;

                        return (
                            <div key={stage.id} className="flex flex-col items-center relative flex-1">
                                {activeLine}
                                {daysBadge}

                                {/* Halo: panel-color px padding hides the line behind the border */}
                                <div className="bg-[#1f273f] rounded-[3rem] px-2 relative z-10">
                                    <div className={`
                                        w-[140px] h-[110px] rounded-[3rem] flex flex-col items-center justify-center
                                        transition-all duration-300 relative border-4
                                        ${isCurrent
                                            ? 'border-[#9faef9] bg-[#111623] scale-105 shadow-lg shadow-orange-500/20'
                                            : isReached
                                                ? 'border-[#9faef9] bg-[#111623]'
                                                : 'border-[#9faef9]/40 bg-[#111623] opacity-80'}
                                    `}>
                                        {/* Visible, fixed date display (ReadOnly) */}
                                        {dateReached ? (
                                            <span className="text-orange-400 font-extrabold text-xs text-center px-2 py-1 select-none tracking-wider">
                                                {dateReached}
                                            </span>
                                        ) : (index < currentStageIndex) ? (
                                            <span className="text-red-500 font-black text-[10px] text-center px-2 py-1 select-none tracking-wider uppercase animate-pulse border border-red-500/30 bg-red-500/10 rounded" title="A etapa foi atingida mas a data não foi preenchida">
                                                Insira a Data
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 font-medium text-[10px] text-center px-2 py-1 select-none italic">
                                                Pendente
                                            </span>
                                        )}

                                        {/* Pulse dot for active stage */}
                                        {isCurrent && (
                                            <div className="absolute -bottom-2 w-4 h-4 rounded-full bg-orange-500 animate-pulse z-30"></div>
                                        )}
                                    </div>
                                </div>

                                {/* Stage label */}
                                <div className={`mt-5 text-center w-full transition-colors duration-300 ${isCurrent ? 'opacity-100' : isReached ? 'opacity-90' : 'opacity-60'}`}>
                                    <span className="text-xs font-bold text-white block uppercase tracking-wide">
                                        {stage.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BookDetailPipeline;
