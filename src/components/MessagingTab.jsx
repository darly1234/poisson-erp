import React, { useState, useEffect } from 'react';
import { Send, History, CheckCircle2, XCircle, Clock, Eye, Info } from 'lucide-react';
import Button from './ui/Button';
import { api } from '../services/api';

const MessagingTab = ({ recordId, canonicalData }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [viewingMessage, setViewingMessage] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const settings = await api.getSettings();
                setTemplates(settings.message_templates || []);
                const hist = await api.getMessageHistory(recordId);
                setHistory(hist);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [recordId]);

    const handleTemplateChange = (e) => {
        const temp = templates.find(t => t.name === e.target.value);
        setSelectedTemplate(temp);
        if (temp) {
            let content = temp.content;
            // Substituição dinâmica para prévia
            const replacements = {
                title: canonicalData.titulo,
                isbn: canonicalData.isbn,
                doi: canonicalData.doi,
                pub_date: canonicalData.ano,
                doi_link: canonicalData.url
            };
            Object.entries(replacements).forEach(([key, val]) => {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), val || `[${key} não preenchido]`);
            });
            setMessage(content);
        } else {
            setMessage('');
        }
    };

    const handleSend = async () => {
        if (!message) return;
        setSending(true);
        try {
            const res = await api.sendMessage({
                recordId,
                message,
                templateName: selectedTemplate?.name || 'Personalizada'
            });

            // Recarrega histórico
            const hist = await api.getMessageHistory(recordId);
            setHistory(hist);
            alert('Mensagem enviada com sucesso!');
        } catch (err) {
            alert('Erro ao enviar: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400 font-medium">Carregando comunicação...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-300">
            {/* Seção de Envio */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#F57C00]" />
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Disparar Mensagem (n8n)</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Escolher Modelo</label>
                            <select
                                onChange={handleTemplateChange}
                                className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
                            >
                                <option value="">Mensagem Personalizada...</option>
                                {templates.map((t, idx) => (
                                    <option key={idx} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conteúdo da Mensagem</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={8}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                                placeholder="Digite sua mensagem aqui... variáveis dinâmicas já foram processadas na prévia."
                            />
                            <p className="text-[9px] text-slate-400 italic flex items-center gap-1">
                                <Info size={10} /> Esta mensagem será enviada exatamente como está para o n8n.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            size="md"
                            icon={Send}
                            onClick={handleSend}
                            disabled={sending || !message}
                        >
                            {sending ? 'Disparando...' : 'Enviar para n8n'}
                        </Button>
                    </div>

                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 space-y-4">
                        <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                            <Eye size={14} /> Dica de Variáveis
                        </h4>
                        <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
                            Ao escolher um modelo, o sistema substitui automaticamente:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { k: '{{title}}', v: canonicalData.titulo },
                                { k: '{{doi}}', v: canonicalData.doi },
                                { k: '{{doi_link}}', v: canonicalData.url }
                            ].map(item => (
                                <div key={item.k} className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-amber-200/50 shadow-sm">
                                    <code className="font-bold text-amber-700">{item.k}</code>
                                    <span className="text-slate-400 truncate max-w-[150px]">{item.v || 'Vazio'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção de Histórico */}
            <div className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Histórico de Envios</h3>
                </div>

                <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Modelo</th>
                                <th className="px-6 py-4">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                    onClick={() => setViewingMessage(log)}
                                >
                                    <td className="px-6 py-4">
                                        {log.status === 'Sucesso' ? (
                                            <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                                                <CheckCircle2 size={14} /> Sucesso
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-red-500 text-xs font-bold">
                                                <XCircle size={14} /> Falha
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                                            <Clock size={12} />
                                            {new Date(log.sent_at).toLocaleString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                                        {log.template_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 underline underline-offset-4">
                                            Ver Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-300 text-xs font-medium">
                                        Nenhuma mensagem enviada ainda para este livro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes */}
            {viewingMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Detalhes do Envio</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(viewingMessage.sent_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <button onClick={() => setViewingMessage(null)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Modelo Utilizado</label>
                                <div className="text-sm font-bold text-blue-700">{viewingMessage.template_name}</div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conteúdo Enviado</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                                    {viewingMessage.message_content}
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button variant="ghost" size="sm" onClick={() => setViewingMessage(null)}>Fechar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagingTab;
