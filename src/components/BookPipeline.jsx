import React, { useState, useEffect } from 'react';

// Stages based on requested options
const PIPELINE_STAGES = [
    { id: 'Para editar', label: 'Para Editar' },
    { id: 'Editados / Conferência', label: 'Conferência' },
    { id: 'Para enviar prova', label: 'Enviar Prova' },
    { id: 'Avaliação do autor', label: 'Avaliação Autor' },
    { id: 'Alterações', label: 'Alterações' },
    { id: 'Para publicar', label: 'Para Publicar' },
    { id: 'Publicado', label: 'Publicado' }
];

// Mock data to pre-fill the numbers
const MOCK_BOOKS = [
    ...Array(12).fill({ status: 'Para editar' }),
    ...Array(8).fill({ status: 'Editados / Conferência' }),
    ...Array(5).fill({ status: 'Para enviar prova' }),
    ...Array(3).fill({ status: 'Avaliação do autor' }),
    ...Array(7).fill({ status: 'Alterações' }),
    ...Array(8).fill({ status: 'Para publicar' }),
    ...Array(15).fill({ status: 'Publicado' })
];

const BookPipeline = ({ onFilterStatus }) => {
    const [stats, setStats] = useState({});
    const [totalBooks, setTotalBooks] = useState(0);
    const [activeHover, setActiveHover] = useState(null);

    useEffect(() => {
        // Calculate the absolute numbers for each stage from mock
        const counts = {};
        PIPELINE_STAGES.forEach(stage => counts[stage.id] = 0);

        MOCK_BOOKS.forEach(book => {
            if (counts[book.status] !== undefined) {
                counts[book.status]++;
            }
        });

        setStats(counts);
        setTotalBooks(MOCK_BOOKS.length);
    }, []);

    const handleStepClick = (statusId) => {
        console.log(`Filtro acionado para o estágio: ${statusId}`);
        if (onFilterStatus) onFilterStatus(statusId);
    };

    return (
        <div className="bg-[#1a2035] p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden mb-8">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-4 border-b border-slate-700/50">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                        Painel de Produção Editorial
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Visão atual do funil de publicações do Acervo.
                    </p>
                </div>
                <div className="mt-4 md:mt-0 bg-[#131722] border border-slate-700 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-inner">
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Total em Processo</span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                        {totalBooks}
                    </span>
                </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="relative py-8 px-4">
                {/* Connecting Line (Background) */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-[#2c344b] -translate-y-1/2 rounded-full hidden md:block"></div>

                <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-4">
                    {PIPELINE_STAGES.map((stage, index) => {
                        const count = stats[stage.id] || 0;
                        const percentage = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
                        const isHovered = activeHover === stage.id;

                        return (
                            <div
                                key={stage.id}
                                className="flex flex-col items-center group cursor-pointer relative"
                                onMouseEnter={() => setActiveHover(stage.id)}
                                onMouseLeave={() => setActiveHover(null)}
                                onClick={() => handleStepClick(stage.id)}
                            >
                                {/* The Circle */}
                                <div className={`
                                    w-[88px] h-[88px] rounded-full flex flex-col items-center justify-center 
                                    transition-all duration-300 relative border-4 z-10
                                    ${isHovered ? 'scale-110 border-orange-500 bg-[#111623]' : 'border-[#2c344b] bg-[#111623]'}
                                `}>
                                    {/* Number */}
                                    <span className="text-2xl font-black text-orange-500 tabular-nums -mt-1">
                                        {count}
                                    </span>
                                    {/* Divider */}
                                    <div className="w-6 h-px bg-slate-700/50 my-1"></div>
                                    {/* Percentage */}
                                    <span className="text-[11px] font-bold text-indigo-300">
                                        {percentage}%
                                    </span>

                                    {/* Active Indicator Dot */}
                                    {isHovered && (
                                        <div className="absolute -bottom-2 w-4 h-4 rounded-full bg-orange-500 animate-pulse"></div>
                                    )}
                                </div>

                                {/* Label */}
                                <div className={`
                                    mt-4 text-center transition-colors duration-300
                                    ${isHovered ? 'opacity-100 scale-105' : 'opacity-80'}
                                `}>
                                    <span className="text-[11px] font-bold text-indigo-300 block">
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

export default BookPipeline;
