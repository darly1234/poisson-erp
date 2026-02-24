import React from 'react';
import { Upload, Trash2, Image as ImageIcon, Download } from 'lucide-react';

const CoverField = ({ value, onChange }) => {
    // Expected value structure: { front: "data:image/jpeg;base64,...", back: "data:image/png;base64,..." }
    const coverData = typeof value === 'object' && value !== null ? value : { front: null, back: null };

    const handleUpload = (e, side) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            // Salva a string base64 direto no estado/banco de dados
            onChange({ ...coverData, [side]: base64String });
        };
        reader.readAsDataURL(file);
    };

    const handleDownload = (e, side, title) => {
        e.preventDefault();
        e.stopPropagation();

        const dataStr = coverData[side];
        if (!dataStr || !dataStr.startsWith('data:')) return;

        const ext = dataStr.includes('image/png') ? 'png' : 'jpg';
        const link = document.createElement('a');
        link.href = dataStr;
        link.download = `capa-${side === 'front' ? 'frontal' : 'contracapa'}-${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRemove = (e, side) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Tem certeza que deseja remover esta capa?")) return;

        const nextData = { ...coverData };
        nextData[side] = null;
        onChange(nextData);
    };

    const renderUploadBox = (side, title) => {
        // Se a string contiver "data:image", temos um base64 válido
        const hasPreview = typeof coverData[side] === 'string' && coverData[side].startsWith('data:image');
        // Fallback pra string legada (se existir de mock anterior)
        const hasStringMock = typeof coverData[side] === 'string' && !hasPreview;

        return (
            <div className="flex flex-col gap-2 relative flex-1 items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 self-start">
                    {title}
                </span>

                <div className={`
                    relative group flex flex-col items-center justify-center 
                    w-full max-w-[280px] aspect-[1/1.414] rounded-2xl border-2 border-dashed 
                    transition-all overflow-hidden cursor-pointer
                    ${(hasPreview || hasStringMock) ? 'border-blue-200 bg-slate-50 shadow-md' : 'border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300'}
                `}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, side)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {hasPreview ? (
                        <>
                            <img src={coverData[side]} alt={`Preview ${title}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
                                <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    Trocar Capa
                                </span>
                            </div>
                        </>
                    ) : hasStringMock ? (
                        <div className="flex flex-col items-center gap-2 px-4 text-center">
                            <ImageIcon size={32} className="text-blue-400" />
                            <span className="text-xs font-bold text-slate-700 truncate w-full max-w-[150px]">{coverData[side]}</span>
                            <span className="text-[10px] text-slate-400">Arquivo Legado</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                            <Upload size={28} />
                            <span className="text-xs font-bold uppercase tracking-wide">Fazer Upload</span>
                            <span className="text-[10px] text-slate-400 px-6 text-center">Formato A4<br />PNG ou JPEG</span>
                        </div>
                    )}

                    {(hasPreview || hasStringMock) && (
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-30 transition-opacity">
                            {hasPreview && (
                                <button
                                    type="button"
                                    onClick={(e) => handleDownload(e, side, title)}
                                    className="p-1.5 bg-[#F57C00] hover:bg-[#E65100] text-white rounded-lg shadow-sm backdrop-blur-md transition-colors"
                                    title="Baixar Imagem Original"
                                >
                                    <Download size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => handleRemove(e, side)}
                                className="p-1.5 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg shadow-sm backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                                title="Remover Capa"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-center gap-6 md:gap-10 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                {renderUploadBox('front', 'Capa Frontal')}
                {renderUploadBox('back', 'Contracapa')}
            </div>
        </div>
    );
};

export default CoverField;
