import React, { useState, useEffect, useRef } from 'react';
import {
    Layers, Trash2, CheckCircle, AlertCircle, Loader2, PlusCircle, Download, FileDown
} from 'lucide-react';
import { useCutter } from './useCutter';
import FichyPreview from './FichyPreview';
import { loadHtml2Canvas, handleExportPNG, handleExportWord } from './exportUtils';

export default function FichyContainer({ initialData = {}, onDataSync }) {
    const [formData, setFormData] = useState({
        titulo: initialData.f_title || initialData.titulo || initialData.title || '',
        subtitulo: initialData.subtitulo || '',
        responsabilidade: initialData.responsabilidade || 'autor',
        nomes: initialData.nomes || [''],
        local: initialData.local || 'Belo Horizonte',
        uf: initialData.uf || 'MG',
        editora: initialData.editora || 'Editora Poisson',
        ano: initialData.ano || new Date().getFullYear().toString(),
        paginas: initialData.paginas || '',
        formato: initialData.formato || 'PDF',
        isbn: initialData.isbn || '',
        doi: initialData.doi || '10.36229/',
        modoAcesso: initialData.modoAcesso || 'World Wide Web',
        incluiBibliografia: initialData.incluiBibliografia ?? true,
        cdd: initialData.cdd || '',
        cutter: initialData.cutter || '',
        palavrasChave: initialData.palavrasChave || [''],
        bibliotecaria: initialData.bibliotecaria || 'Sônia Márcia Soares de Moura',
        crb: initialData.crb || '6/1896'
    });

    const [statusMsg, setStatusMsg] = useState({ text: '', type: 'success' });
    const [libLoaded, setLibLoaded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportScale, setExportScale] = useState(6);
    const [transparentBg, setTransparentBg] = useState(true);
    const cardRef = useRef(null);

    useCutter(formData.nomes, formData.titulo, setFormData);

    useEffect(() => {
        loadHtml2Canvas(
            () => setLibLoaded(true),
            () => showMessage("Falha na rede. Não foi possível carregar o exportador PNG.", "error")
        );
    }, []);

    const showMessage = (text, type = 'success') => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg({ text: '', type: 'success' }), 5000);
    };

    const applyIsbnMask = (value) => {
        if (!value) return '';
        const digits = value.replace(/\D/g, '');
        let masked = '';
        if (digits.length > 0) masked += digits.substring(0, 3);
        if (digits.length > 3) masked += '-' + digits.substring(3, 5);
        if (digits.length > 5) masked += '-' + digits.substring(5, 9);
        if (digits.length > 9) masked += '-' + digits.substring(9, 12);
        if (digits.length > 12) masked += '-' + digits.substring(12, 13);
        return masked;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newData = { ...formData };
        if (name === 'isbn') {
            const maskedValue = applyIsbnMask(value);
            newData = { ...newData, isbn: maskedValue, doi: "10.36229/" + maskedValue };
        } else {
            newData = { ...newData, [name]: type === 'checkbox' ? checked : value };
        }
        setFormData(newData);
        if (onDataSync) onDataSync(newData);
    };

    const handleArrayChange = (index, value, field) => {
        const newArray = [...(formData[field] || [])];
        newArray[index] = value;
        const newData = { ...formData, [field]: newArray };
        setFormData(newData);
        if (onDataSync) onDataSync(newData);
    };

    const addArrayItem = (field) => {
        const newData = { ...formData, [field]: [...(formData[field] || []), ''] };
        setFormData(newData);
        if (onDataSync) onDataSync(newData);
    };

    const removeArrayItem = (index, field) => {
        const currentArray = formData[field] || [];
        if (currentArray.length <= 1) {
            showMessage("É necessário ao menos um item neste campo.", "error");
            return;
        }
        const newArray = currentArray.filter((_, i) => i !== index);
        const newData = { ...formData, [field]: newArray };
        setFormData(newData);
        if (onDataSync) onDataSync(newData);
    };

    const validateFormData = () => {
        const missing = [];
        if (!formData.titulo?.trim()) missing.push("Título da Obra");
        if (!formData.nomes?.some(n => n.trim())) missing.push("Pelo menos um Responsável");
        if (!formData.isbn?.trim()) missing.push("ISBN");
        if (!formData.cdd?.trim()) missing.push("CDD");
        if (!formData.cutter?.trim()) missing.push("Cutter");
        if (!formData.palavrasChave?.some(p => p.trim())) missing.push("Pelo menos uma Palavra-Chave");

        if (missing.length > 0) {
            alert(`⚠️ Campos obrigatórios faltando:\n\n• ${missing.join('\n• ')}\n\nPor favor, preencha-os antes de exportar.`);
            return false;
        }
        return true;
    };

    const doExportPNG = () => {
        if (!validateFormData()) return;
        if (cardRef.current) {
            handleExportPNG(cardRef.current, formData, exportScale, transparentBg, showMessage, setIsExporting);
        }
    };

    const doExportWord = () => {
        if (!validateFormData()) return;
        handleExportWord(formData, showMessage);
    };

    return (
        <div className="bg-slate-50 p-4 md:p-8 font-sans text-slate-900 rounded-xl h-full overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">

                <div className="w-full bg-[#E6E6E6] p-6 rounded-2xl shadow-md border-t-[8px] border-[#1E88E5]">
                    <header className="mb-6 border-b border-slate-300 pb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div>
                            <div className="text-[10px] font-bold text-[#1F2A8A] tracking-widest mb-1 uppercase">Gerador CIP</div>
                            <h1 className="text-2xl font-black text-[#1F2A8A] flex items-center gap-2 uppercase tracking-tighter">
                                <Layers className="w-7 h-7 text-[#F57C00]" />
                                FICHY
                            </h1>
                        </div>
                        <div className="flex gap-2 items-center xl:self-end">
                            <div className="flex flex-col items-end gap-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Resolução</label>
                                <select
                                    value={exportScale}
                                    onChange={(e) => setExportScale(Number(e.target.value))}
                                    disabled={isExporting}
                                    className="text-[10px] font-bold border border-slate-300 rounded px-1 py-0.5 bg-white text-slate-700 disabled:opacity-50 outline-none"
                                >
                                    <option value={2}>2× — Rápido</option>
                                    <option value={3}>3× — Médio</option>
                                    <option value={4}>4× — Alta (~300 DPI)</option>
                                    <option value={6}>6× — Máximo</option>
                                </select>
                            </div>
                            <div className="flex flex-col items-center gap-0.5 self-end pb-0.5">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Fundo</label>
                                <button
                                    onClick={() => setTransparentBg(prev => !prev)}
                                    disabled={isExporting}
                                    title={transparentBg ? "Clique para fundo branco" : "Clique para fundo transparente"}
                                    className={"w-8 h-8 rounded border-2 transition-all disabled:opacity-50 overflow-hidden " + (transparentBg ? 'border-[#1E88E5]' : 'border-slate-400')}
                                    style={transparentBg ? {
                                        backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%)',
                                        backgroundSize: '8px 8px'
                                    } : { backgroundColor: 'white' }}
                                />
                            </div>
                            <button
                                onClick={doExportPNG}
                                disabled={!libLoaded || isExporting}
                                title="Exportar ficha como Imagem PNG de Alta Definição"
                                className="bg-[#F57C00] hover:bg-[#E65100] text-white text-[11px] font-black px-4 py-2 rounded shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors self-end"
                            >
                                {(!libLoaded || isExporting) ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Download className="w-3 h-3" />}
                                PNG
                            </button>
                            <button
                                onClick={doExportWord}
                                title="Exportar como Documento Word (.doc)"
                                className="bg-[#1E88E5] hover:bg-[#1565C0] text-white text-[11px] font-black px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors self-end"
                            >
                                <FileDown className="w-3 h-3" />
                                WORD
                            </button>
                            <button
                                onClick={() => {
                                    const container = document.getElementById('barcode-container');
                                    const canvas = container ? container.querySelector('canvas') : null;
                                    if (canvas) {
                                        try {
                                            const cleanIsbn = formData.isbn.replace(/\D/g, '');
                                            const newCanvas = document.createElement('canvas');
                                            newCanvas.width = canvas.width + 40;
                                            newCanvas.height = canvas.height + 40;
                                            const ctx = newCanvas.getContext('2d');
                                            ctx.fillStyle = '#ffffff';
                                            ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
                                            ctx.drawImage(canvas, 20, 20);

                                            const link = document.createElement('a');
                                            link.download = `barcode-${cleanIsbn || 'isbn'}.png`;
                                            link.href = newCanvas.toDataURL('image/png');
                                            link.click();
                                        } catch (e) {
                                            showMessage("Erro ao processar as barras.", 'error');
                                            console.error(e);
                                        }
                                    } else {
                                        showMessage("Código de barras não disponível.", 'error');
                                    }
                                }}
                                title="Baixar Código de Barras Separado"
                                className="bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-black px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors self-end"
                            >
                                <Download className="w-3 h-3" />
                                BARRAS
                            </button>
                        </div>
                    </header>

                    <div className="space-y-6">
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest">Título da Obra</label>
                                <textarea
                                    name="titulo"
                                    value={formData.titulo}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-[#1E88E5] transition-all resize-none shadow-sm h-full max-h-[120px]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Responsáveis</label>
                                    <select
                                        name="responsabilidade"
                                        value={formData.responsabilidade}
                                        onChange={handleInputChange}
                                        className="p-1 text-[10px] border border-slate-300 rounded bg-white font-bold shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1E88E5]"
                                    >
                                        <option value="autor">Autor(es)</option>
                                        <option value="organizador">Organizador(es)</option>
                                    </select>
                                </div>

                                <div className="space-y-2 flex-1 overflow-y-auto pr-2 max-h-[120px] scrollbar-thin">
                                    {(formData.nomes || []).map((nome, i) => (
                                        <div key={i} className="flex gap-1 group">
                                            <input
                                                type="text"
                                                value={nome}
                                                onChange={(e) => handleArrayChange(i, e.target.value, 'nomes')}
                                                placeholder="Nome completo..."
                                                className="flex-1 p-2 text-sm border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-[#1E88E5] shadow-sm"
                                            />
                                            <button
                                                onClick={() => removeArrayItem(i, 'nomes')}
                                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                title="Remover responsável"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => addArrayItem('nomes')}
                                    className="flex items-center gap-1 text-[10px] font-bold text-[#1F2A8A] uppercase hover:text-[#1E88E5] transition-colors mt-auto pt-1"
                                >
                                    <PlusCircle className="w-3 h-3 text-[#F57C00]" /> Adicionar Responsável
                                </button>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-300 pt-5 mt-5">
                            <div className="col-span-1 md:col-span-3 text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest">Identificadores e Classificação</div>

                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">ISBN</label>
                                <input type="text" name="isbn" value={formData.isbn} onChange={handleInputChange} className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm" />
                            </div>

                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">DOI</label>
                                <input type="text" name="doi" value={formData.doi} onChange={handleInputChange} className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm" />
                            </div>

                            <div>
                                <label className="text-[9px] text-[#F57C00] font-bold uppercase block mb-1">Cutter (Auto)</label>
                                <input type="text" name="cutter" value={formData.cutter} onChange={handleInputChange} className="w-full p-2 text-sm border border-orange-300 rounded-lg font-mono bg-orange-50 focus:bg-white text-orange-900 shadow-sm outline-none focus:ring-2 focus:ring-[#F57C00]" />
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">CDD</label>
                                <select
                                    name="cdd"
                                    value={formData.cdd}
                                    onChange={handleInputChange}
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg font-mono bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm"
                                >
                                    <optgroup label="000 - Ciência da Computação e Informação">
                                        <option value="000">000 — Ciência da Computação, Informação e Obras Gerais</option>
                                        <option value="004">004 — Processamento de Dados / Ciência da Computação</option>
                                        <option value="005">005 — Programação e Sistemas de Computador</option>
                                        <option value="020">020 — Biblioteconomia e Ciência da Informação</option>
                                        <option value="070">070 — Jornalismo e Publicação</option>
                                    </optgroup>
                                    <optgroup label="100 - Filosofia e Psicologia">
                                        <option value="100">100 — Filosofia e Psicologia</option>
                                        <option value="110">110 — Metafísica</option>
                                        <option value="150">150 — Psicologia</option>
                                        <option value="170">170 — Ética (Filosofia Moral)</option>
                                    </optgroup>
                                    <optgroup label="200 - Religião">
                                        <option value="200">200 — Religião</option>
                                        <option value="220">220 — Bíblia</option>
                                        <option value="230">230 — Cristianismo e Teologia Cristã</option>
                                        <option value="290">290 — Outras Religiões e Religião Comparada</option>
                                    </optgroup>
                                    <optgroup label="300 - Ciências Sociais, Meio Ambiente e Direito">
                                        <option value="300">300 — Ciências Sociais, Sociologia e Antropologia</option>
                                        <option value="310">310 — Estatística (Geral e Demográfica)</option>
                                        <option value="320">320 — Ciência Política</option>
                                        <option value="330">330 — Economia</option>
                                        <option value="331">331 — Economia do Trabalho</option>
                                        <option value="332">332 — Economia Financeira</option>
                                        <option value="333.7">333.7 — Sustentabilidade e Economia do Meio Ambiente</option>
                                        <option value="340">340 — Direito</option>
                                        <option value="341">341 — Direito Internacional</option>
                                        <option value="342">342 — Direito Constitucional e Administrativo</option>
                                        <option value="345">345 — Direito Penal</option>
                                        <option value="346">346 — Direito Privado e Civil</option>
                                        <option value="350">350 — Administração Pública</option>
                                        <option value="360">360 — Problemas e Serviços Sociais</option>
                                        <option value="363.7">363.7 — Meio Ambiente e Gestão Ambiental</option>
                                    </optgroup>
                                    <optgroup label="370 - Educação e Pedagogia">
                                        <option value="370">370 — Educação e Pedagogia (Geral)</option>
                                        <option value="371">371 — Organização Escolar e Didática</option>
                                        <option value="372">372 — Educação Infantil e Ensino Fundamental</option>
                                        <option value="373">373 — Ensino Médio</option>
                                        <option value="378">378 — Ensino Superior / Universidade</option>
                                    </optgroup>
                                    <optgroup label="400 - Linguagem e Letras">
                                        <option value="400">400 — Linguagem e Letras (Geral)</option>
                                        <option value="410">410 — Linguística</option>
                                        <option value="420">420 — Língua Inglesa</option>
                                        <option value="460">460 — Língua Espanhola</option>
                                        <option value="469">469 — Língua Portuguesa</option>
                                    </optgroup>
                                    <optgroup label="500 - Ciências Naturais e Matemática">
                                        <option value="500">500 — Ciências Naturais e Matemática (Geral)</option>
                                        <option value="510">510 — Matemática</option>
                                        <option value="512">512 — Álgebra</option>
                                        <option value="515">515 — Análise Matemática</option>
                                        <option value="516">516 — Geometria</option>
                                        <option value="519.5">519.5 — Estatística Matemática</option>
                                        <option value="520">520 — Astronomia e Ciências Afins</option>
                                        <option value="530">530 — Física</option>
                                        <option value="540">540 — Química</option>
                                        <option value="541">541 — Química Física</option>
                                        <option value="543">543 — Química Analítica</option>
                                        <option value="547">547 — Química Orgânica</option>
                                        <option value="550">550 — Ciências da Terra e Geologia</option>
                                        <option value="570">570 — Biologia e Ciências da Vida</option>
                                        <option value="577">577 — Ecologia e Meio Ambiente</option>
                                        <option value="580">580 — Botânica</option>
                                        <option value="590">590 — Zoologia</option>
                                    </optgroup>
                                    <optgroup label="600 - Tecnologia, Saúde e Agrárias">
                                        <option value="600">600 — Tecnologia e Ciências Aplicadas (Geral)</option>
                                        <option value="610">610 — Medicina e Saúde</option>
                                        <option value="610.73">610.73 — Enfermagem</option>
                                        <option value="611">611 — Anatomia Humana, Citologia, Histologia</option>
                                        <option value="612">612 — Fisiologia Humana</option>
                                        <option value="613">613 — Saúde e Segurança Pessoal</option>
                                        <option value="614">614 — Saúde Pública e Prevenção</option>
                                        <option value="615">615 — Farmácia e Farmacologia</option>
                                        <option value="616">616 — Patologia e Doenças</option>
                                        <option value="620">620 — Engenharia e Operações Afins</option>
                                        <option value="628">628 — Engenharia Sanitária e Ambiental</option>
                                        <option value="630">630 — Agricultura e Agronomia</option>
                                        <option value="636">636 — Produção Animal e Zootecnia</option>
                                        <option value="636.089">636.089 — Medicina Veterinária</option>
                                        <option value="640">640 — Gestão Doméstica e Nutrição</option>
                                        <option value="660">660 — Engenharia Química</option>
                                        <option value="664">664 — Ciência e Tecnologia dos Alimentos</option>
                                        <option value="690">690 — Construção Civil</option>
                                    </optgroup>
                                    <optgroup label="650 - Administração, Contabilidade e Negócios">
                                        <option value="650">650 — Administração e Serviços Auxiliares</option>
                                        <option value="657">657 — Contabilidade</option>
                                        <option value="658">658 — Administração Geral e Gestão</option>
                                        <option value="658.1">658.1 — Organização e Gestão Financeira</option>
                                        <option value="658.3">658.3 — Gestão de Recursos Humanos</option>
                                        <option value="658.4">658.4 — Gestão Executiva e Estratégica</option>
                                        <option value="658.8">658.8 — Marketing</option>
                                    </optgroup>
                                    <optgroup label="700 - Artes, Arquitetura e Recreação">
                                        <option value="700">700 — Artes (Geral)</option>
                                        <option value="710">710 — Urbanismo e Paisagismo</option>
                                        <option value="720">720 — Arquitetura</option>
                                        <option value="730">730 — Artes Plásticas e Escultura</option>
                                        <option value="740">740 — Desenho e Artes Decorativas</option>
                                        <option value="750">750 — Pintura</option>
                                        <option value="770">770 — Fotografia</option>
                                        <option value="780">780 — Música</option>
                                        <option value="790">790 — Artes Cênicas, Recreação e Esportes</option>
                                    </optgroup>
                                    <optgroup label="800 - Literatura">
                                        <option value="800">800 — Literatura e Retórica (Geral)</option>
                                        <option value="810">810 — Literatura Americana (Inglês)</option>
                                        <option value="820">820 — Literatura Inglesa</option>
                                        <option value="860">860 — Literatura Espanhola</option>
                                        <option value="869">869 — Literatura Portuguesa e Brasileira (Geral)</option>
                                        <option value="869.1">869.1 — Poesia (Língua Portuguesa)</option>
                                        <option value="869.3">869.3 — Ficção / Romance (Língua Portuguesa)</option>
                                    </optgroup>
                                    <optgroup label="900 - História e Geografia">
                                        <option value="900">900 — História e Geografia (Geral)</option>
                                        <option value="910">910 — Geografia e Viagens</option>
                                        <option value="920">920 — Biografia e Genealogia</option>
                                        <option value="930">930 — História do Mundo Antigo</option>
                                        <option value="940">940 — História da Europa</option>
                                        <option value="980">980 — História da América do Sul</option>
                                        <option value="981">981 — História do Brasil (Geral)</option>
                                        <option value="981.05">981.05 — História do Brasil (República)</option>
                                    </optgroup>
                                </select>
                                <input
                                    type="text"
                                    name="cdd"
                                    value={formData.cdd}
                                    onChange={handleInputChange}
                                    placeholder="Ou digite manualmente..."
                                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono bg-white mt-2 text-slate-700 focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Formato</label>
                                <input type="text" name="formato" value={formData.formato} onChange={handleInputChange} className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm" />
                            </div>

                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Modo de Acesso</label>
                                <input
                                    type="text"
                                    name="modoAcesso"
                                    value={formData.modoAcesso}
                                    onChange={handleInputChange}
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2 md:mt-5">
                                <input
                                    type="checkbox"
                                    id="incluiBibliografia"
                                    name="incluiBibliografia"
                                    checked={formData.incluiBibliografia}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 accent-[#1E88E5] cursor-pointer"
                                />
                                <label htmlFor="incluiBibliografia" className="text-sm text-slate-700 cursor-pointer font-medium mt-[1px]">
                                    Inclui bibliografia
                                </label>
                            </div>
                        </section>



                        <section className="space-y-3">
                            <label className="text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest mt-2 border-t border-slate-300 pt-4 block">Assuntos (Palavras-Chave)</label>
                            <div className="space-y-2">
                                {(formData.palavrasChave || []).map((pc, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={pc}
                                            onChange={(e) => handleArrayChange(i, e.target.value, 'palavrasChave')}
                                            className="flex-1 p-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm"
                                        />
                                        <button
                                            onClick={() => removeArrayItem(i, 'palavrasChave')}
                                            className="p-2 text-slate-400 hover:text-red-600"
                                            title="Remover assunto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => addArrayItem('palavrasChave')}
                                className="flex items-center gap-1 text-[10px] font-bold text-[#1F2A8A] uppercase hover:text-[#1E88E5] transition-colors"
                            >
                                <PlusCircle className="w-3 h-3 text-[#F57C00]" /> Adicionar Assunto
                            </button>
                        </section>

                        <section className="space-y-3 pt-4 border-t border-slate-300">
                            <label className="text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest">Responsável pela Catalogação</label>
                            <div className="flex gap-2">
                                <input type="text" name="bibliotecaria" value={formData.bibliotecaria} onChange={handleInputChange} placeholder="Nome do Bibliotecário" className="flex-1 p-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm" />
                                <input type="text" name="crb" value={formData.crb} onChange={handleInputChange} placeholder="CRB" className="w-28 p-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1E88E5] outline-none shadow-sm" />
                            </div>
                        </section>

                        <section className="bg-white/60 p-5 rounded-xl border border-slate-300 shadow-sm relative overflow-hidden mt-6">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1E88E5]"></div>
                            <div className="text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest pl-2 mb-4">Dados de Publicação</div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-2">
                                <div className="flex flex-col col-span-2 md:col-span-1">
                                    <label className="text-[8px] font-bold text-slate-500 uppercase ml-1 block">Cidade</label>
                                    <input type="text" name="local" value={formData.local} onChange={handleInputChange} className="p-2 text-sm border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#1E88E5] outline-none w-full" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[8px] font-bold text-slate-500 uppercase ml-1 block">UF</label>
                                    <input type="text" name="uf" value={formData.uf} onChange={handleInputChange} className="p-2 text-sm border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#1E88E5] outline-none w-full" />
                                </div>
                                <div className="flex flex-col col-span-2 md:col-span-1">
                                    <label className="text-[8px] font-bold text-slate-500 uppercase ml-1 block">Editora</label>
                                    <input type="text" name="editora" value={formData.editora} onChange={handleInputChange} className="p-2 text-sm border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#1E88E5] outline-none w-full" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[8px] font-bold text-slate-500 uppercase ml-1 block">Ano</label>
                                    <input type="text" name="ano" value={formData.ano} onChange={handleInputChange} className="p-2 text-sm border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#1E88E5] outline-none w-full" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[8px] font-bold text-slate-500 uppercase ml-1 block whitespace-nowrap">Páginas <span className="normal-case text-slate-400 font-normal ml-0.5">(opt)</span></label>
                                    <input
                                        type="number"
                                        name="paginas"
                                        value={formData.paginas}
                                        onChange={handleInputChange}
                                        min="1"
                                        placeholder="ex: 214"
                                        className="p-2 text-sm border border-slate-200 rounded-lg shadow-sm font-mono focus:ring-2 focus:ring-[#1E88E5] outline-none w-full"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="w-full flex flex-col items-center justify-start py-8 bg-slate-200/50 rounded-2xl border border-slate-300 shadow-inner overflow-x-auto relative min-h-[400px]">
                    <div className="p-8 relative bg-white shadow-xl border border-slate-300 rounded-lg">
                        {statusMsg.text && (
                            <div className={"absolute top-4 right-4 " + (statusMsg.type === 'success' ? 'bg-[#1E88E5]' : 'bg-red-600') + " text-white text-[11px] px-4 py-2 rounded-full flex items-center gap-2 z-20 shadow-lg transition-all animate-bounce"}>
                                {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {statusMsg.text}
                            </div>
                        )}

                        <FichyPreview formData={formData} ref={cardRef} />
                    </div>

                    <div className="mt-10 max-w-sm px-6 py-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-300 shadow-sm text-center">
                        <p className="text-slate-600 text-[11px] leading-relaxed italic">
                            <span className="text-[#1F2A8A] font-black block mb-1 uppercase tracking-wider">Resolução Aprimorada</span>
                            Selecione 4× (~300 DPI) para impressão profissional ou 6× para resolução máxima. Use 2× para exportações rápidas.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
