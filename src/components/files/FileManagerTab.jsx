import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Folder, FolderOpen, File, Upload, FolderPlus, Trash2,
    ChevronRight, Home, RefreshCw, Download, AlertCircle, Loader2, X, Copy, Link2, ExternalLink
} from 'lucide-react';

const API = (process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api')) + '/files';
const SSH_CREDS_KEY = 'poisson_ssh_credentials';

const getSshHeaders = () => {
    const headers = {};
    const token = sessionStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const fmt = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString('pt-BR') : '—';

const FileManagerTab = ({ initialPath = '/', fallbackPath = '/individuais' }) => {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [newFolderMode, setNewFolderMode] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef();

    const PUBLIC_BASE = 'https://livros.poisson.com.br';
    const publicUrl = selected?.type === 'file'
        ? `${PUBLIC_BASE}${currentPath.replace(/\/$/, '')}/${selected.name}`
        : null;

    const load = useCallback(async (p = currentPath) => {
        setLoading(true); setError(''); setSelected(null);
        try {
            const r = await fetch(`${API}/list?path=${encodeURIComponent(p)}`, { headers: getSshHeaders() });
            const d = await r.json();
            if (d.ok) {
                setItems(d.items);
                setCurrentPath(p);
            } else {
                // Se a pasta do DOI não existir, recai no fallback
                if (p !== fallbackPath && fallbackPath) {
                    return load(fallbackPath);
                }
                setError(d.message || 'Erro ao listar');
            }
        } catch (e) {
            if (p !== fallbackPath && fallbackPath) return load(fallbackPath);
            setError('Sem conexão com o servidor.');
        }
        finally { setLoading(false); }
    }, [currentPath, fallbackPath]);

    useEffect(() => { load(initialPath); }, [initialPath]);

    // Breadcrumbs
    const crumbs = currentPath.split('/').filter(Boolean);
    const getCrumbPath = (i) => '/' + crumbs.slice(0, i + 1).join('/');

    // Navegar
    const navigate = (p) => { setNewFolderMode(false); load(p); };

    // Criar pasta
    const handleMkdir = async () => {
        if (!newFolderName.trim()) return;
        const p = currentPath.replace(/\/$/, '') + '/' + newFolderName.trim();
        setLoading(true);
        try {
            const r = await fetch(`${API}/mkdir`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...getSshHeaders() },
                body: JSON.stringify({ path: p }),
            });
            const d = await r.json();
            if (d.ok) { setNewFolderMode(false); setNewFolderName(''); load(currentPath); }
            else setError(d.message);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    // Apagar
    const handleDelete = async () => {
        if (!selected) return;
        if (!window.confirm(`Apagar "${selected.name}"? ${selected.type === 'dir' ? 'Toda a pasta será removida.' : ''}`)) return;
        const p = currentPath.replace(/\/$/, '') + '/' + selected.name;
        setLoading(true);
        try {
            const r = await fetch(`${API}/delete`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json', ...getSshHeaders() },
                body: JSON.stringify({ path: p, type: selected.type }),
            });
            const d = await r.json();
            if (d.ok) { setSelected(null); load(currentPath); }
            else setError(d.message);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    // Upload
    const doUpload = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        for (const file of Array.from(files)) {
            setUploadProgress(`Enviando ${file.name}…`);
            const fd = new FormData();
            fd.append('path', currentPath); fd.append('file', file);
            try {
                const r = await fetch(`${API}/upload`, { method: 'POST', body: fd, headers: getSshHeaders() });
                const d = await r.json();
                console.log('[FileManager] Upload response:', d);
                if (!d.ok) setError(d.message);
            } catch (e) { setError(e.message); }
        }
        setUploading(false); setUploadProgress(''); load(currentPath);
    };

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        doUpload(e.dataTransfer.files);
    };

    return (
        <div className="bg-slate-50 p-4 md:p-6 font-sans rounded-xl w-full h-full flex flex-col gap-4 min-h-[500px]">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 flex-wrap">
                    <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors">
                        <Home className="w-3.5 h-3.5" />
                    </button>
                    {crumbs.map((c, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <button onClick={() => navigate(getCrumbPath(i))}
                                className="hover:text-blue-600 transition-colors font-bold text-slate-700">{c}</button>
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => load(currentPath)} title="Atualizar"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => { setNewFolderMode(true); setNewFolderName(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors">
                        <FolderPlus className="w-3.5 h-3.5" /> Nova Pasta
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E88E5] hover:opacity-90 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-60">
                        <Upload className="w-3.5 h-3.5" /> {uploading ? 'Enviando...' : 'Upload'}
                    </button>
                    <input ref={fileInputRef} type="file" multiple className="hidden"
                        onChange={e => doUpload(e.target.files)} />
                    {selected && (
                        <button onClick={handleDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11px] font-bold transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Apagar
                        </button>
                    )}
                </div>
            </div>

            {/* Nova pasta inline */}
            {newFolderMode && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl">
                    <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
                    <input autoFocus type="text" value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleMkdir(); if (e.key === 'Escape') setNewFolderMode(false); }}
                        placeholder="Nome da pasta…"
                        className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-400" />
                    <button onClick={handleMkdir} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700">Criar</button>
                    <button onClick={() => setNewFolderMode(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* URL pública do arquivo selecionado */}
            {publicUrl && (
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1F2A8A]/5 to-[#1E88E5]/5 border border-[#1E88E5]/20 rounded-2xl">
                    <Link2 className="w-4 h-4 text-[#1E88E5] shrink-0" />
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-[11px] font-mono font-bold text-[#1F2A8A] hover:text-[#1E88E5] truncate transition-colors"
                        title={publicUrl}>{publicUrl}</a>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/80 text-slate-400 hover:text-[#1E88E5] transition-colors" title="Abrir em nova aba">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(publicUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all duration-300 ${copied
                            ? 'bg-green-500 text-white scale-95'
                            : 'bg-[#1E88E5] hover:bg-[#1565C0] text-white'
                            }`}>
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copiado!' : 'Copiar URL'}
                    </button>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-600 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* Upload progress */}
            {uploadProgress && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-700 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress}
                </div>
            )}

            {/* Área de arquivos com drag-and-drop */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex-1 bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${dragOver ? 'border-blue-400 bg-blue-50 scale-[1.005]' : 'border-slate-200'
                    }`}>

                {loading && !items.length ? (
                    <div className="flex items-center justify-center h-40 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                        <Folder className="w-10 h-10 text-slate-200" />
                        <p className="text-[11px]">Pasta vazia — arraste arquivos para fazer upload</p>
                    </div>
                ) : (
                    <table className="w-full text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Nome</th>
                                <th className="text-right px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Tamanho</th>
                                <th className="text-right px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Modificado</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.name}
                                    onClick={() => setSelected(s => s?.name === item.name ? null : item)}
                                    onDoubleClick={() => item.type === 'dir' && navigate(currentPath.replace(/\/$/, '') + '/' + item.name)}
                                    className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.name === item.name ? 'bg-blue-50 border-blue-100' : ''
                                        }`}>
                                    <td className="px-4 py-2.5 flex items-center gap-2 font-medium text-slate-700">
                                        {item.type === 'dir'
                                            ? <Folder className="w-4 h-4 text-[#F57C00] shrink-0" />
                                            : <File className="w-4 h-4 text-[#1E88E5] shrink-0" />
                                        }
                                        {item.name}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-slate-400">{item.type === 'dir' ? '—' : fmt(item.size)}</td>
                                    <td className="px-4 py-2.5 text-right text-slate-400">{fmtDate(item.modTime)}</td>
                                    <td className="px-4 py-2.5">
                                        {item.type === 'file' && (
                                            <a href={`${API}/download?path=${encodeURIComponent(currentPath.replace(/\/$/, '') + '/' + item.name)}&token=${sessionStorage.getItem('access_token')}`}
                                                target="_blank" rel="noopener noreferrer" download
                                                onClick={e => e.stopPropagation()}
                                                className="text-slate-400 hover:text-blue-500 transition-colors">
                                                <Download className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {dragOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <Upload className="w-10 h-10 text-blue-400" />
                        <p className="text-blue-600 font-black text-sm">Solte para enviar</p>
                    </div>
                )}
            </div>

            <p className="text-[9px] text-slate-400 text-center">
                Duplo clique numa pasta para entrar · Clique num arquivo para selecionar · Arraste arquivos para upload
            </p>
        </div>
    );
};

export default FileManagerTab;
