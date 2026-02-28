import React, { useState, useEffect, useRef } from 'react';
import { generateCrossrefXml } from './crossrefXmlBuilder';
import { Download, UploadCloud, CheckCircle, AlertCircle, Loader2, Copy, Link, Eye, EyeOff, BookOpen, Plus, Trash2, BookMarked, ChevronDown, ChevronUp, Code2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const URL_BASE = 'https://livros.poisson.com.br/individuais/';

// Extract just the suffix after URL_BASE, or return the raw value if it doesn't match
const extractSuffix = (fullUrl) => {
    if (!fullUrl || typeof fullUrl !== 'string') return '';
    if (fullUrl.startsWith(URL_BASE)) return fullUrl.slice(URL_BASE.length);
    return fullUrl; // legacy: keep as-is so no data is lost
};

const parseSummary = (text) => {
    if (!text) return [];
    const chapters = [];
    const blocks = text.split(/Capítulo\s+/i);

    blocks.forEach(block => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return;

        const numMatch = trimmedBlock.match(/^(\d+):?/);
        if (!numMatch) return;

        const num = parseInt(numMatch[1], 10);
        const lines = trimmedBlock.split('\n').map(l => l.trim()).filter(l => l);

        let firstLine = lines[0].replace(/^\d+:?\s*/, '').trim();
        const pageMatch = firstLine.match(/[\s\t]+(\d+)$/);
        let title = firstLine;
        if (pageMatch) {
            title = firstLine.substring(0, firstLine.lastIndexOf(pageMatch[0])).trim();
        }

        let authors = '';
        if (lines[1] && !lines[1].toLowerCase().startsWith('doi:')) {
            authors = lines[1].replace(/;/g, ',').trim();
        }

        if (title) {
            chapters.push({ num, titulo: title, autores: authors });
        }
    });
    return chapters;
};

export default function CrossrefTab({ initialData, onDataSync }) {
    const [xmlContent, setXmlContent] = useState('');
    const [credentials, setCredentials] = useState({ login_id: 'pois', login_passwd: 'po_4719_arv' });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
    const [urlFolder, setUrlFolder] = useState(() => {
        const suffix = extractSuffix(initialData.url);
        const clean = suffix.toLowerCase().endsWith('.pdf') ? suffix.slice(0, -4) : suffix;
        const lastSlash = clean.lastIndexOf('/');
        return lastSlash !== -1 ? clean.substring(0, lastSlash) : '';
    });
    const [urlFile, setUrlFile] = useState(() => {
        const suffix = extractSuffix(initialData.url);
        const clean = suffix.toLowerCase().endsWith('.pdf') ? suffix.slice(0, -4) : suffix;
        const lastSlash = clean.lastIndexOf('/');
        return lastSlash !== -1 ? clean.substring(lastSlash + 1) : clean;
    });

    // Editable state for missing/existing crossref fields
    const [formData, setFormData] = useState({
        titulo: initialData.titulo || '',
        isbn: initialData.isbn || '',
        ano: initialData.ano || new Date().getFullYear().toString(),
        editora: initialData.editora || '',
        nomes: initialData.nomes || [],
        doi: initialData.doi || '',
        responsabilidade: initialData.responsabilidade || 'organizador',
    });

    // Chapter mode
    const [withChapters, setWithChapters] = useState(initialData.withChapters === true);
    const [summaryText, setSummaryText] = useState('');
    const [previewChapters, setPreviewChapters] = useState([]);
    const [chapters, setChapters] = useState(initialData.chapters && initialData.chapters.length > 0 ? initialData.chapters : [{ num: 1, titulo: '', autores: '' }]);

    // XML panel toggle
    const [showXml, setShowXml] = useState(true);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const newChapters = [];
            let numCounter = 1;

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                let num = row[0];
                let titulo = row[1] || '';
                let autores = row[2] || '';

                if (!num && !titulo && !autores) continue;

                let parsedNum = parseInt(num, 10);
                if (isNaN(parsedNum)) {
                    if (i === 0) continue; // Pular provável cabeçalho
                    parsedNum = numCounter; // Fallback se não for número validamente
                }

                if (titulo) {
                    newChapters.push({
                        num: parsedNum,
                        titulo: String(titulo).trim(),
                        autores: String(autores).trim()
                    });
                    numCounter = parsedNum + 1;
                }
            }

            if (newChapters.length > 0) {
                setChapters(newChapters);
                showMessage(`${newChapters.length} capítulos importados!`, 'success');
            } else {
                showMessage('O arquivo parece vazio ou fora do formato (nº, título, autores).', 'error');
            }
        } catch (err) {
            console.error('Erro xlsx:', err);
            showMessage('Erro ao processar o arquivo Excel.', 'error');
        }

        // Reset the input so the same file migh be loaded again
        e.target.value = null;
    };

    const handleSummaryChange = (text) => {
        setSummaryText(text);
        const parsed = parseSummary(text);
        setPreviewChapters(parsed);
    };

    const importPreview = () => {
        if (previewChapters.length > 0) {
            setChapters(previewChapters);
            onDataSync?.({ chapters: previewChapters });
            setSummaryText('');
            setPreviewChapters([]);
            showMessage(`${previewChapters.length} capítulos importados do sumário!`, 'success');
        }
    };


    const addChapter = () => setChapters(prev => [...prev, { num: prev.length + 1, titulo: '', autores: '' }]);
    const removeChapter = (i) => setChapters(prev => prev.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, num: idx + 1 })));
    const updateChapter = (i, field, value) => setChapters(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

    // Computed full URL — valid only when both folder and file are filled
    const fullUrl = (urlFolder.trim() && urlFile.trim())
        ? `${URL_BASE}${urlFolder.trim()}/${urlFile.trim()}.pdf`
        : '';

    const missingFields = [];
    if (!formData.titulo) missingFields.push('Título');
    if (!formData.isbn) missingFields.push('ISBN');
    if (!formData.ano) missingFields.push('Ano');
    if (!formData.editora) missingFields.push('Editora');
    if (!formData.nomes || formData.nomes.length === 0) missingFields.push('Autor / Organizador');
    if (!fullUrl) missingFields.push('URL (Link da Publicação)');

    // Sync formData whenever the parent provides updated initialData (e.g. after Fichy edit)
    // But ONLY if the content actually changed or name values are missing to avoid cursor reset issues
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            titulo: initialData.titulo || prev.titulo || '',
            isbn: initialData.isbn || prev.isbn || '',
            ano: initialData.ano || prev.ano || '',
            editora: initialData.editora || prev.editora || '',
            nomes: initialData.nomes || prev.nomes || [],
            doi: initialData.doi || prev.doi || '',
        }));

        if (initialData.withChapters !== undefined) {
            setWithChapters(initialData.withChapters === true);
        }

        // Only set URL parts if we don't have them yet and initialData has a URL
        if (!urlFolder && !urlFile && initialData.url && typeof initialData.url === 'string') {
            const raw = extractSuffix(initialData.url);
            const clean = raw.toLowerCase().endsWith('.pdf') ? raw.slice(0, -4) : raw;
            const lastSlash = clean.lastIndexOf('/');
            if (lastSlash !== -1) {
                setUrlFolder(clean.substring(0, lastSlash));
                setUrlFile(clean.substring(lastSlash + 1));
            } else if (clean) {
                setUrlFile(clean);
                setUrlFolder('');
            }
        }
    }, [initialData]);

    useEffect(() => {
        if (missingFields.length === 0) {
            const xml = generateCrossrefXml(
                { ...formData, url: fullUrl, chapters: withChapters ? chapters : [] },
                'Poisson ERP',
                'contato@poisson.com.br'
            );
            setXmlContent(xml);
        } else {
            setXmlContent('');
        }
    }, [formData, urlFolder, urlFile, withChapters, chapters]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        onDataSync?.({ [name]: value });
    };

    const handleUrlChange = (updates) => {
        // Compute the new full URL to sync it
        const newFolder = updates.urlFolder !== undefined ? updates.urlFolder : urlFolder;
        const newFile = updates.urlFile !== undefined ? updates.urlFile : urlFile;
        const newFullUrl = (newFolder.trim() && newFile.trim())
            ? `https://livros.poisson.com.br/individuais/${newFolder.trim()}/${newFile.trim()}.pdf`
            : '';
        onDataSync?.({ url: newFullUrl });
    };

    const showMessage = (text, type = 'success') => {
        setStatusMsg({ text, type });
        if (type === 'success') {
            setTimeout(() => setStatusMsg({ text: '', type: '' }), 6000);
        }
    };

    const handleCopyXml = () => {
        navigator.clipboard.writeText(xmlContent);
        showMessage('XML copiado para a área de transferência', 'success');
    };

    const handleDownloadXml = () => {
        const cleanIsbn = initialData.isbn?.replace(/\D/g, '') || 'draft';
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `crossref-${cleanIsbn}.xml`;
        link.click();
    };

    const handleSubmitCrossref = async () => {
        if (!credentials.login_id || !credentials.login_passwd) {
            showMessage('Preencha as credenciais da Crossref.', 'error');
            return;
        }

        setIsSubmitting(true);
        setStatusMsg({ text: 'Enviando para Crossref...', type: 'info' });

        try {
            // Note: Update URL below depending on env variable once in prod
            const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');
            const response = await fetch(`${apiUrl}/crossref/deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    xmlContent,
                    login_id: credentials.login_id,
                    login_passwd: credentials.login_passwd
                })
            });

            const data = await response.json();

            if (response.ok) {
                const submissionId = data.submission_id || `CR-${Date.now()}`;
                showMessage(`Depósito Recebido! (ID: ${submissionId}) - Pode levar alguns minutos para o DOI resolver.`, 'success');
                // Persist submission info
                onDataSync?.({
                    submission_id: submissionId,
                    last_submission_date: new Date().toISOString()
                });
            } else {
                showMessage(`Erro no depósito: ${data.message || 'Falha na comunicação com Crossref'}`, 'error');
            }

        } catch (error) {
            console.error('Erro na submissão:', error);
            showMessage('Erro na conexão com o servidor interno.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 p-4 md:p-8 font-sans text-slate-900 rounded-xl h-full overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">

                {/* Header */}
                <div className="w-full bg-[#E6E6E6] p-6 rounded-2xl shadow-md border-t-[8px] border-[#1E88E5]">
                    <header className="border-b border-slate-300 pb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div>
                            <div className="text-[10px] font-bold text-[#1F2A8A] tracking-widest mb-1 uppercase">Gerador DOI / Crossref</div>
                            <h1 className="text-2xl font-black text-[#1F2A8A] flex items-center gap-2 uppercase tracking-tighter">
                                <Link className="w-7 h-7 text-[#F57C00]" />
                                CROSSY
                            </h1>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium max-w-xl text-right">
                            Este módulo converte os metadados do livro para o rigoroso formato XML exigido pela Crossref e permite envio direto e seguro através da API de Depósito.
                        </p>
                    </header>
                </div>

                {missingFields.length > 0 ? (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-start gap-4 shadow-sm">
                        <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                        <div className="w-full">
                            <h3 className="text-red-800 font-bold mb-1">Dados Obrigatórios Ausentes</h3>
                            <p className="text-sm text-red-700 mb-4">Para gerar o XML Crossref, você precisa preencher os seguintes campos:</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                                {/* Editable missing fields mapping */}
                                <div className="col-span-1 md:col-span-3">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">URL da Publicação</label>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className="bg-slate-100 text-slate-400 text-[10px] font-mono px-2 py-2 rounded border border-slate-200 whitespace-nowrap select-none">
                                            livros.poisson.com.br/individuais/
                                        </span>
                                        <input
                                            type="text"
                                            value={urlFolder}
                                            onChange={e => {
                                                const val = e.target.value.trim();
                                                if (val.startsWith('http')) {
                                                    const suffix = extractSuffix(val);
                                                    const clean = suffix.toLowerCase().endsWith('.pdf') ? suffix.slice(0, -4) : suffix;
                                                    const parts = clean.split('/');
                                                    if (parts.length >= 2) {
                                                        const folder = parts[0];
                                                        const file = parts.slice(1).join('/');
                                                        setUrlFolder(folder);
                                                        setUrlFile(file);
                                                        handleUrlChange({ urlFolder: folder, urlFile: file });
                                                        return;
                                                    }
                                                }
                                                setUrlFolder(val);
                                                handleUrlChange({ urlFolder: val });
                                            }}
                                            placeholder="pasta ou cole a URL"
                                            className="flex-1 p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5] bg-white"
                                        />
                                        <span className="text-slate-400 font-mono text-sm select-none">/</span>
                                        <input
                                            type="text"
                                            value={urlFile}
                                            onChange={e => { setUrlFile(e.target.value); handleUrlChange({ urlFile: e.target.value }); }}
                                            placeholder="nome-do-arquivo"
                                            className="flex-1 min-w-[120px] p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5] bg-white"
                                        />
                                        <span className="bg-slate-100 text-slate-500 text-[11px] font-mono px-2 py-2 rounded border border-slate-200 select-none">.pdf</span>
                                    </div>
                                    {fullUrl && (
                                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-600 mt-1.5 font-mono truncate hover:underline block">{fullUrl}</a>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Ano de Publicação</label>
                                    <input type="text" name="ano" value={formData.ano} onChange={handleInputChange} placeholder={`Ex: ${new Date().getFullYear()}`} className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5]" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Editora</label>
                                    <input type="text" name="editora" value={formData.editora} onChange={handleInputChange} className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5]" />
                                </div>
                            </div>

                            <ul className="list-disc pl-5 italic text-xs text-red-500 mt-4">
                                {missingFields.map(f => <li key={f}>{f} não preenchido</li>)}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">

                        {/* ── Metadados (2/3) + Credenciais (1/3) ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Col 1-2: Metadados de Apoio (2/3 da largura) */}
                            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-[12px] font-black uppercase text-[#1F2A8A] tracking-widest mb-4 border-b border-slate-100 pb-2">Metadados de Apoio</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">URL — Pasta / Arquivo</label>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="bg-slate-100 text-slate-400 text-[8px] font-mono px-1.5 py-1.5 rounded border border-slate-200 whitespace-nowrap select-none leading-tight">
                                                …/individuais/
                                            </span>
                                            <input
                                                type="text"
                                                value={urlFolder}
                                                onChange={e => { setUrlFolder(e.target.value); handleUrlChange({ urlFolder: e.target.value }); }}
                                                placeholder="pasta"
                                                className="flex-1 min-w-[80px] p-1.5 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-[#1E88E5] bg-slate-50"
                                            />
                                            <span className="text-slate-400 font-mono text-xs select-none">/</span>
                                            <input
                                                type="text"
                                                value={urlFile}
                                                onChange={e => { setUrlFile(e.target.value); handleUrlChange({ urlFile: e.target.value }); }}
                                                placeholder="nome-do-pdf"
                                                className="flex-1 min-w-[80px] p-1.5 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-[#1E88E5] bg-slate-50"
                                            />
                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-1.5 py-1.5 rounded border border-slate-200 select-none">.pdf</span>
                                        </div>
                                        {fullUrl && (
                                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-600 mt-1 font-mono truncate hover:underline block">{fullUrl}</a>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">Ano</label>
                                            <input type="text" name="ano" value={formData.ano} onChange={handleInputChange} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-[#1E88E5] shadow-sm bg-slate-50" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">Editora</label>
                                            <input type="text" name="editora" value={formData.editora} onChange={handleInputChange} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-[#1E88E5] shadow-sm bg-slate-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Col 2: Credenciais + Ações */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-[12px] font-black uppercase text-[#1F2A8A] tracking-widest mb-4 border-b pb-2">Credenciais Crossref</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">DOI Prefix</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value="10.36229"
                                            className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono cursor-default select-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Usuário (Role)</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5]"
                                            value={credentials.login_id}
                                            onChange={e => setCredentials({ ...credentials, login_id: e.target.value })}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Senha</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full p-2 pr-9 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5]"
                                                value={credentials.login_passwd}
                                                onChange={e => setCredentials({ ...credentials, login_passwd: e.target.value })}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(p => !p)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDownloadXml}
                                        disabled={isSubmitting || missingFields.length > 0}
                                        title={missingFields.length > 0 ? "Preencha todos os campos obrigatórios" : "Baixar o arquivo XML gerado"}
                                        className="w-full bg-[#F57C00] hover:bg-[#E65100] text-white font-black text-sm p-3 rounded-lg shadow flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        BAIXAR ARQUIVO XML
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">OU</span>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const hasDoi = formData.doi && formData.doi.trim().length > 0;
                                            if (hasDoi) {
                                                if (window.confirm("Esta obra já possui um DOI registrado. Tem certeza que deseja enviar uma atualização para a Crossref? Isso substituirá os metadados anteriores.")) {
                                                    handleSubmitCrossref();
                                                }
                                            } else {
                                                handleSubmitCrossref();
                                            }
                                        }}
                                        disabled={isSubmitting || !credentials.login_id || !credentials.login_passwd}
                                        className={`w-full font-black text-sm p-3 rounded-lg shadow flex justify-center items-center gap-2 transition-all disabled:opacity-50 ${
                                            formData.doi ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#1E88E5] hover:bg-[#1565C0]'
                                        } text-white`}
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                        {isSubmitting ? 'ENVIANDO...' : (formData.doi ? 'ALTERAR DOI (RE-ENVIAR)' : 'ENVIAR VIA API')}
                                    </button>
                                    
                                    {initialData.submission_id && (
                                        <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded text-[9px] text-slate-400 flex flex-col gap-0.5">
                                            <span className="font-bold uppercase opacity-60">Status do Depósito</span>
                                            <span>ID: {initialData.submission_id}</span>
                                            {initialData.last_submission_date && (
                                                <span>📅 {new Date(initialData.last_submission_date).toLocaleString('pt-BR')}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* ── Capítulos — largura total abaixo das duas colunas ── */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[12px] font-black uppercase text-[#1F2A8A] tracking-widest flex items-center gap-2">
                                    <BookMarked className="w-4 h-4 text-[#F57C00]" />
                                    Capítulos
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] text-slate-400">
                                        {withChapters ? 'Modo livro com capítulos — cada um recebe DOI próprio' : 'Ative para registrar capítulos com DOIs individuais'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newState = !withChapters;
                                            setWithChapters(newState);
                                            onDataSync?.({ withChapters: newState });
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${withChapters ? 'bg-[#1E88E5]' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${withChapters ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {withChapters && (
                                <div className="space-y-3">
                                    {/* Cabeçalho das colunas */}
                                    <div className="grid grid-cols-[50px_1fr_1fr_32px] gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                        <span>Nº</span>
                                        <span>Título do Capítulo</span>
                                        <span>Autores (separados por vírgula)</span>
                                        <span />
                                    </div>
                                    <div className="space-y-2">
                                        {chapters.map((ch, i) => (
                                            <div key={i} className="grid grid-cols-[50px_1fr_1fr_32px] gap-3 items-center">
                                                <div className="bg-[#1F2A8A] text-white text-[10px] font-black rounded-lg text-center py-2 select-none">
                                                    {String(ch.num).padStart(2, '0')}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={ch.titulo}
                                                    onChange={e => updateChapter(i, 'titulo', e.target.value)}
                                                    placeholder="Título do capítulo"
                                                    className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5] bg-slate-50 w-full"
                                                />
                                                <input
                                                    type="text"
                                                    value={ch.autores}
                                                    onChange={e => updateChapter(i, 'autores', e.target.value)}
                                                    placeholder="Nome 1, Nome 2, Nome 3"
                                                    className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1E88E5] bg-slate-50 w-full"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeChapter(i)}
                                                    disabled={chapters.length === 1}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 justify-self-center"
                                                    title="Remover capítulo"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={addChapter}
                                                className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E88E5] hover:text-[#1565C0] transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Adicionar Capítulo
                                            </button>
                                            <div className="h-4 w-px bg-slate-200"></div>
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls, .csv"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                                                title="Formato: Col 1: Nº, Col 2: Título, Col 3: Autores (separados por vírgula)"
                                            >
                                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                                Importar Excel
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-400 italic">
                                            DOIs gerados: <span className="font-mono">10.36229/{(formData.isbn || '').replace(/\D/g, '')}.CAP01, .CAP02…</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {withChapters && (
                                <div className="mt-8 border-t border-slate-100 pt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-emerald-100 p-2 rounded-lg">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black uppercase text-slate-700 tracking-tight">Importação Rápida via Sumário</h4>
                                            <p className="text-[9px] text-slate-400">Cole o texto do sumário para gerar a lista automaticamente.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Texto do Sumário (Cole aqui)</label>
                                            <textarea
                                                value={summaryText}
                                                onChange={e => handleSummaryChange(e.target.value)}
                                                rows={12}
                                                placeholder="Cole o sumário aqui... Ex: Capítulo 1: Título 11"
                                                className="w-full p-4 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 shadow-inner resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Planilha Resultante (Preview)</label>
                                                {previewChapters.length > 0 && (
                                                    <button
                                                        onClick={importPreview}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        CONFIRMAR IMPORTAÇÃO
                                                    </button>
                                                )}
                                            </div>
                                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm h-[264px] overflow-y-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                                                        <tr>
                                                            <th className="px-3 py-2 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200 w-[60px]">Cap.</th>
                                                            <th className="px-3 py-2 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200">Título</th>
                                                            <th className="px-3 py-2 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200">Autores</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {previewChapters.length > 0 ? (
                                                            previewChapters.map((ch, idx) => (
                                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-3 py-2 text-[10px] font-mono text-[#1F2A8A] border-r border-slate-100 bg-slate-50/50">{ch.num}</td>
                                                                    <td className="px-3 py-2 text-[10px] font-medium text-slate-700">{ch.titulo}</td>
                                                                    <td className="px-3 py-2 text-[10px] text-slate-500 italic">{ch.autores}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={3} className="px-3 py-10 text-center text-[11px] text-slate-400 italic">
                                                                    Nenhum dado processado. Cole o texto ao lado.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status message */}
                        {statusMsg.text && (
                            <div className={'p-4 rounded-xl border text-sm flex gap-3 items-start ' + (statusMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : statusMsg.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800')}>
                                {statusMsg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> : statusMsg.type === 'info' ? <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                                <span className="font-medium leading-relaxed">{statusMsg.text}</span>
                            </div>
                        )}

                        {/* ── XML Preview — recolhível ao final ── */}
                        <div className="rounded-2xl overflow-hidden border border-[#2d2d2d] shadow-lg">
                            {/* Barra de título com toggle */}
                            <button
                                type="button"
                                onClick={() => setShowXml(p => !p)}
                                className="w-full bg-[#1E1E1E] px-4 py-3 flex justify-between items-center hover:bg-[#252525] transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[11px] font-mono text-gray-400">crossref-deposit.xml</span>
                                    {xmlContent && (
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-950 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            {xmlContent.split('\n').length} linhas
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); handleCopyXml(); }}
                                        title="Copiar XML"
                                        className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); handleDownloadXml(); }}
                                        title="Baixar XML"
                                        className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-gray-500 ml-1">
                                        {showXml ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </span>
                                </div>
                            </button>

                            {/* Corpo do XML — recolhível */}
                            {showXml && (
                                <div className="bg-[#1E1E1E] p-4 h-[240px] overflow-y-auto shadow-inner">
                                    <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap select-all leading-5">
                                        {xmlContent || <span className="text-slate-600 italic">Preencha os campos acima para gerar o XML.</span>}
                                    </pre>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
