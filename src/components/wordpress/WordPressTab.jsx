import React, { useState } from 'react';
import { Globe, Upload, ExternalLink, CheckCircle2, AlertCircle, BookOpen, Settings, Power, FileText } from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Bold,
    Italic,
    Underline,
    Essentials,
    Paragraph,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    Heading,
    Link,
    List,
    Table,
    TableToolbar,
    Undo,
    Alignment,
    Autoformat,
    BlockQuote,
    Indent,
    IndentBlock,
    PasteFromOffice,
    Strikethrough
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import { api } from '../../services/api';

const EDITOR_STLYES = `
  .ck-editor__editable_contained {
    min-height: 250px !important;
    max-height: 500px !important;
  }
  .ck.ck-editor {
    width: 100% !important;
  }
`;

const WP_CREDS_KEY = 'poisson_wp_credentials';

const AREAS_CONHECIMENTO = [
    '', 'Ciências Agrárias', 'Ciências Biológicas', 'Ciências da Saúde',
    'Ciências Exatas e da Terra', 'Ciências Humanas', 'Ciências Sociais Aplicadas',
    'Engenharias', 'Linguística, Letras e Artes', 'Multidisciplinar',
];

// Só redimensiona se a imagem for muito grande (> 1MB em base64 ≈ 750KB real)
const resizeIfNeeded = (base64, maxWidth = 1600) =>
    new Promise((resolve) => {
        if (!base64) return resolve(null);
        if (base64.length < 1_000_000) return resolve(base64); // ≤ ~750KB: envia original
        const img = new Image();
        img.onload = () => {
            if (img.width <= maxWidth) return resolve(base64);
            const scale = maxWidth / img.width;
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
    });

const Field = ({ label, children, hint }) => (
    <div className="space-y-1">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">{label}</label>
        {children}
        {hint && <p className="text-[8px] text-slate-400 italic">{hint}</p>}
    </div>
);

const WordPressTab = ({ initialData, coverImageBase64, coverMime, coverFilename, onUpdate }) => {
    const profileCreds = (() => {
        try { return JSON.parse(localStorage.getItem(WP_CREDS_KEY) || '{}'); } catch { return {}; }
    })();
    const hasProfileCreds = !!(profileCreds.wpUser && profileCreds.wpAppPassword);
    const [editorReady, setEditorReady] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    // Campos persistidos no registro
    const [description, setDescription] = useState(initialData.wp_description || '');
    const [abstract, setAbstract] = useState(initialData.wp_abstract || '');
    const [area, setArea] = useState(initialData.wp_area || '');
    const [dataPublicacao, setDataPublicacao] = useState(initialData.wp_data || today);
    const [alreadyPublished, setAlreadyPublished] = useState(!!(initialData.wp_product_id));
    const [currentProductId, setCurrentProductId] = useState(initialData.wp_product_id || null);
    const [currentProductUrl, setCurrentProductUrl] = useState(initialData.wp_product_url || '');
    const [productStatus, setProductStatus] = useState(initialData.wp_product_status || 'publish');
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    const [isPublishing, setIsPublishing] = useState(false);
    const [result, setResult] = useState(null);
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

    // Salvar campos no registro ao sair do campo
    const save = (updates) => onUpdate?.(updates);

    // Auto-preencher campos derivados
    const autores = Array.isArray(initialData.nomes) ? initialData.nomes.join('; ') : (initialData.nomes || '');
    const anoAtual = initialData.ano || new Date().getFullYear().toString();
    const citationPdfUrl = initialData.doi
        ? `https://doi.org/${initialData.doi}`
        : initialData.url || '';

    // ler-online = pasta do pdf (url sem o nome do arquivo)
    const lerOnlineAuto = (() => {
        const u = initialData.url || '';
        if (typeof u !== 'string') return '';
        if (u.endsWith('/')) return u;
        const lastSlash = u.lastIndexOf('/');
        const segment = u.substring(lastSlash + 1);
        return segment.includes('.') ? u.substring(0, lastSlash + 1) : (u + '/');
    })();

    const handleToggleStatus = async () => {
        if (!alreadyPublished || isTogglingStatus) return;

        const token = sessionStorage.getItem('access_token');
        if (!token) {
            alert('Erro: Sessão expirada. Por favor, faça Logout e Login novamente.');
            return;
        }

        const newStatus = productStatus === 'publish' ? 'draft' : 'publish';
        setIsTogglingStatus(true);
        try {
            const data = await api.setWordPressStatus({
                wpUrl: profileCreds.wpUrl || 'https://poisson.com.br',
                wpUser: profileCreds.wpUser,
                wpAppPassword: profileCreds.wpAppPassword,
                productId: currentProductId,
                status: newStatus,
            });
            setProductStatus(newStatus);
            onUpdate?.({ wp_product_status: newStatus });
        } catch (e) {
            alert(`Erro ao alterar status: ${e.message}`);
        } finally {
            setIsTogglingStatus(false);
        }
    };

    const updateBookDescriptionFromCrossref = () => {
        const chapters = initialData.chapters || [];
        if (chapters.length === 0 || !chapters[0].titulo) {
            alert('⚠️ Importe os capítulos na aba Crossy primeiro!');
            return;
        }

        const orgNames = Array.isArray(initialData.nomes) ? initialData.nomes.filter(n => n.trim()) : [];
        const orgsText = orgNames.join(', ');
        const isbnWithDashes = initialData.isbn || '';
        const isAutor = initialData.responsabilidade === 'autor';

        // Label logic
        let label = '';
        if (isAutor) {
            label = orgNames.length > 1 ? 'Autores(as)' : 'Autor(a)';
        } else {
            label = orgNames.length > 1 ? 'Organizadores(as)' : 'Organizador(a)';
        }

        let html = `<div style="font-size: 0.9em;">`;
        html += `<p><strong><span style="color:#b7d947;">${label}</span></strong></p>`;
        html += `<p>${orgsText}</p>`;

        html += `<p>&nbsp;</p><p>&nbsp;</p>`;

        chapters.forEach((ch, index) => {
            const doi = `10.36229/${isbnWithDashes}.CAP.${String(ch.num).padStart(2, '0')}`;
            html += `<p style="margin-top: 1.5em;"><strong><span style="color:#b7d947;">Capítulo ${ch.num}:</span> ${ch.titulo}</strong></p>`;
            if (ch.autores) {
                html += `<p style="color: #666; margin-bottom: 0.2em;">${ch.autores}</p>`;
            }
            html += `<p><strong>DOI:</strong> <a href="https://doi.org/${doi}" target="_blank" style="color: #1E88E5; text-decoration: none;">${doi}</a></p>`;

            if (index < chapters.length - 1) {
                html += `<p>&nbsp;</p>`;
            }
        });

        html += `</div>`;

        setDescription(html);
        save({ wp_description: html });
        setStatusMsg({ text: 'Descrição preenchida com dados do Crossref!', type: 'success' });
        setTimeout(() => setStatusMsg({ text: '', type: '' }), 3000);
    };

    const handlePublish = async () => {
        if (!hasProfileCreds) {
            setStatusMsg({ text: 'Configure as credenciais em Configurações → Meu Perfil.', type: 'error' });
            return;
        }
        if (!initialData.titulo) {
            setStatusMsg({ text: 'O livro não possui título.', type: 'error' });
            return;
        }

        const token = sessionStorage.getItem('access_token');
        if (!token) {
            setStatusMsg({ text: 'Erro: Sessão expirada. Por favor, faça Logout e Login novamente.', type: 'error' });
            return;
        }

        setIsPublishing(true);
        setResult(null);
        setStatusMsg({ text: 'Preparando imagem...', type: 'info' });

        const coverToSend = await resizeIfNeeded(coverImageBase64 || null);

        setStatusMsg({ text: 'Publicando no WordPress...', type: 'info' });

        try {
            const data = await api.publishWordPress({
                wpUrl: profileCreds.wpUrl || 'https://poisson.com.br',
                wpUser: profileCreds.wpUser,
                wpAppPassword: profileCreds.wpAppPassword,
                title: initialData.titulo,
                isbn: initialData.isbn,
                doi: initialData.doi,
                description,
                abstract,
                area,
                lerOnline: lerOnlineAuto,
                dataPublicacao,
                autores,
                anoAtual,
                citationPdfUrl,
                productId: currentProductId || null,
                coverBase64: coverToSend,
                coverMime: coverToSend ? 'image/jpeg' : (coverMime || 'image/jpeg'),
                coverFilename: 'capa.jpg',
            });

            setResult({ ok: true, productUrl: data.productUrl, adminUrl: data.adminUrl, coverWarning: data.coverWarning });
            setStatusMsg({ text: '', type: '' });
            // Atualizar estado local e persistir no registro
            setCurrentProductId(data.productId);
            setCurrentProductUrl(data.productUrl);
            setAlreadyPublished(true);
            onUpdate?.({
                wp_product_id: data.productId,
                wp_product_url: data.productUrl,
            });
        } catch (err) {
            setResult({ error: err.message });
            setStatusMsg({ text: err.message, type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    const inputCls = "w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-all";
    const textareaCls = "w-full p-4 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1E88E5] bg-slate-50 resize-y leading-relaxed font-medium text-slate-700";

    return (
        <div className="bg-slate-50 p-4 md:p-6 font-sans text-slate-900 rounded-xl w-full">
            <div className="max-w-5xl mx-auto flex flex-col gap-5">

                {/* Header */}
                <div className="w-full bg-[#E6E6E6] p-5 rounded-2xl shadow-md border-t-[8px] border-[#1E88E5]">
                    <header className="border-b border-slate-300 pb-3 flex flex-col xl:flex-row xl:items-center justify-between gap-2 mb-4">
                        <div>
                            <div className="text-[10px] font-bold text-[#1F2A8A] tracking-widest uppercase">Publicação Online</div>
                            <h1 className="text-xl font-black text-[#1F2A8A] flex items-center gap-2 uppercase tracking-tighter">
                                <Globe className="w-6 h-6 text-[#F57C00]" /> WORDPRESS
                            </h1>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium text-right">Cria produto WooCommerce com todos os campos personalizados.</p>
                    </header>
                    <div className="grid grid-cols-3 gap-3 text-[11px]">
                        {[
                            { label: 'Título', value: initialData.titulo || '—' },
                            { label: 'ISBN', value: initialData.isbn || '—' },
                            { label: 'DOI', value: initialData.doi || '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white rounded-xl p-3 border border-slate-200">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#1F2A8A] mb-1">{label}</p>
                                <p className="font-bold text-slate-700 truncate" title={value}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Aviso: já publicado + Toggle status */}
                {alreadyPublished && !result?.ok && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl">
                        <div className="flex items-center gap-2 text-[11px]">
                            <ExternalLink className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-blue-700 font-bold">
                                Publicado · ID {currentProductId} ·{' '}
                                <a href={currentProductUrl} target="_blank" rel="noopener noreferrer"
                                    className="underline hover:text-blue-900">ver loja</a>
                            </span>
                        </div>
                        {/* Toggle Publicado/Pausado */}
                        <button
                            onClick={handleToggleStatus}
                            disabled={isTogglingStatus}
                            title={productStatus === 'publish' ? 'Pausar publicação' : 'Reativar publicação'}
                            className={`relative flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl text-[11px] font-black transition-all duration-300 shadow-md ${productStatus === 'publish'
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-slate-400 hover:bg-slate-500 text-white'
                                } disabled:opacity-60`}>
                            <Power className="w-3.5 h-3.5" />
                            <span className={`w-7 h-4 rounded-full transition-all duration-300 flex items-center px-0.5 ${productStatus === 'publish' ? 'bg-green-300 justify-end' : 'bg-slate-300 justify-start'
                                }`}>
                                <span className="w-3 h-3 bg-white rounded-full shadow-sm block" />
                            </span>
                            {isTogglingStatus ? '...' : (productStatus === 'publish' ? 'Publicado' : 'Pausado')}
                        </button>
                    </div>
                )}
                {hasProfileCreds ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-2xl text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="font-bold text-green-700">Credenciais carregadas: {profileCreds.wpUser} · {profileCreds.wpUrl || 'https://poisson.com.br'}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px]">
                        <Settings className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-700">Configure em <strong>Configurações → Meu Perfil → Credenciais WordPress</strong></span>
                    </div>
                )}

                {/* Campos preenchidos automaticamente (somente leitura) */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-[11px] font-black uppercase text-[#1F2A8A] tracking-widest mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#F57C00]" /> Campos Automáticos (citation_*)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { k: 'citation_journal_title', v: initialData.editora || '' },
                            { k: 'citation_title', v: initialData.titulo || '—' },
                            { k: 'citation_author', v: autores || '—' },
                            { k: 'citation_isbn', v: initialData.isbn || '—' },
                            { k: 'citation_doi', v: initialData.doi || '—' },
                            { k: 'citation_date', v: initialData.ano || '' },
                            { k: 'citation_pdf_url', v: citationPdfUrl || '—' },
                        ].map(({ k, v }) => (
                            <div key={k} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{k}</p>
                                <p className="text-[11px] font-bold text-slate-700 truncate" title={v}>{v}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <style>{EDITOR_STLYES}</style>

                {/* Abstract e Descrição (Empilhados, largura total) */}
                <div className="flex flex-col gap-6">
                    {/* 1. Abstract Primeiro */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-[11px] font-black uppercase text-[#1F2A8A] tracking-widest mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#F57C00]" /> Abstract
                        </h3>
                        <textarea value={abstract} rows={6}
                            onChange={e => setAbstract(e.target.value)}
                            onBlur={() => save({ wp_abstract: abstract })}
                            placeholder="Resumo acadêmico (citation_abstract)..."
                            className={textareaCls} />
                        <p className="text-[8px] text-slate-400 mt-1">Meta <code>citation_abstract</code>.</p>
                    </div>

                    {/* 2. Descrição Segundo */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[11px] font-black uppercase text-[#1F2A8A] tracking-widest flex items-center gap-2">
                                <Upload className="w-4 h-4 text-[#F57C00]" /> Descrição do Livro
                            </h3>
                            <button
                                onClick={updateBookDescriptionFromCrossref}
                                className="bg-[#b7d947] hover:bg-[#a6c73d] text-[#1F2A8A] text-[9px] font-black px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 border border-[#1f2a8a1a]"
                            >
                                <FileText className="w-3 h-3" />
                                PREENCHER COM DADOS CROSSREF
                            </button>
                        </div>
                        <div className="mb-0 overflow-hidden rounded-xl border border-slate-200" style={{ minHeight: '250px' }}>
                            <CKEditor
                                editor={ClassicEditor}
                                data={description}
                                onReady={() => setEditorReady(true)}
                                onBlur={(event, editor) => {
                                    const data = editor.getData();
                                    setDescription(data);
                                    save({ wp_description: data });
                                }}
                                onChange={(event, editor) => {
                                    const data = editor.getData();
                                    setDescription(data);
                                }}
                                config={{
                                    licenseKey: 'GPL',
                                    plugins: [
                                        Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
                                        FontColor, FontBackgroundColor, FontFamily, FontSize,
                                        Heading, Link, List, Undo, Alignment, Autoformat, BlockQuote,
                                        Indent, IndentBlock, PasteFromOffice
                                    ],
                                    toolbar: [
                                        'undo', 'redo', '|',
                                        'heading', '|',
                                        'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', '|',
                                        'bold', 'italic', 'underline', 'strikethrough', '|',
                                        'alignment', '|',
                                        'link', 'bulletedList', 'numberedList', 'blockquote', '|',
                                        'outdent', 'indent'
                                    ],
                                    fontColor: {
                                        colorPicker: {
                                            format: 'hex'
                                        }
                                    },
                                    fontBackgroundColor: {
                                        colorPicker: {
                                            format: 'hex'
                                        }
                                    }
                                }}
                            />
                            {!editorReady && <div className="p-4 text-slate-400 text-[10px] animate-pulse">Carregando editor...</div>}
                        </div>
                        <p className="text-[8px] text-slate-400 mt-1">Campo <code>description</code> do WooCommerce.</p>
                    </div>
                </div>

                {/* Campos extras */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-[11px] font-black uppercase text-[#1F2A8A] tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#F57C00]" /> Campos Complementares
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Área do Conhecimento" hint="Meta: area-do-conhecimento">
                            <select value={area} onChange={e => setArea(e.target.value)}
                                onBlur={() => save({ wp_area: area })}
                                className={inputCls}>
                                {AREAS_CONHECIMENTO.map(a => <option key={a} value={a}>{a || 'Selecionar...'}</option>)}
                            </select>
                        </Field>
                        <Field label="Ler Online" hint={`Meta: ler-online (automático: ${lerOnlineAuto || '—'})`}>
                            <input type="url" value={lerOnlineAuto} readOnly
                                className={`${inputCls} bg-slate-100 text-slate-400 cursor-not-allowed`} />
                        </Field>
                        <Field label="Data de Publicação" hint="Meta: data">
                            <input type="date" value={dataPublicacao}
                                onChange={e => setDataPublicacao(e.target.value)}
                                onBlur={() => save({ wp_data: dataPublicacao })}
                                className={inputCls} />
                        </Field>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-3">A capa frontal do registro será usada como imagem destacada do produto.</p>
                </div>

                {/* Status e Botão */}
                <div className="flex flex-col items-end gap-3">
                    {statusMsg.text && (
                        <div className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold ${statusMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {statusMsg.text}
                        </div>
                    )}
                    {result?.ok && (
                        <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-green-700 font-black text-sm">
                                <CheckCircle2 className="w-5 h-5" /> Livro publicado com sucesso!
                            </div>
                            {result.coverWarning && (
                                <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    ⚠️ {result.coverWarning}
                                </div>
                            )}
                            <div className="flex gap-3 mt-1">
                                <a href={result.productUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E88E5] hover:underline">
                                    <ExternalLink className="w-3.5 h-3.5" /> Ver produto na loja
                                </a>
                                <a href={result.adminUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:underline">
                                    <ExternalLink className="w-3.5 h-3.5" /> Editar no WP Admin
                                </a>
                            </div>
                        </div>
                    )}
                    {result?.error && (
                        <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-[11px] text-red-600 font-mono break-all">
                            {result.error}
                        </div>
                    )}
                    <button onClick={handlePublish} disabled={isPublishing || !hasProfileCreds}
                        className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#1F2A8A] to-[#1E88E5] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        <Globe className="w-4 h-4" />
                        {isPublishing
                            ? (alreadyPublished ? 'Atualizando...' : 'Publicando...')
                            : (alreadyPublished ? 'Atualizar WordPress' : 'Publicar no WordPress')
                        }
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WordPressTab;
