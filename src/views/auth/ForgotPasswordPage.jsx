import React, { useState } from 'react';
import { BookOpen, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export function ForgotPasswordPage({ onGoLogin }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handle = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const r = await fetch(`${API}/auth/forgot-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message);
            setSent(true);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0D1340] via-[#1a2060] to-[#0a0f2e] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1E88E5]/10 rounded-full blur-3xl" />
            </div>
            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-[#F57C00] rounded-2xl shadow-2xl shadow-orange-900/50 mb-4 transform -rotate-3">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Esqueceu a Senha?</h1>
                    <p className="text-slate-400 text-sm mt-1">Enviaremos um link de redefinição</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-center space-y-4">
                            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
                            <h3 className="text-white font-black text-xl">E-mail enviado!</h3>
                            <p className="text-slate-400 text-sm">Verifique sua caixa de entrada e spam. O link expira em 1 hora.</p>
                            <button onClick={onGoLogin}
                                className="mt-4 text-[#1E88E5] hover:text-blue-300 text-sm font-bold flex items-center gap-1 mx-auto transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Voltar ao login
                            </button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}
                            <form onSubmit={handle} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">E-mail cadastrado</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 transition-all" />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-[#1F2A8A] to-[#1E88E5] hover:opacity-90 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : 'Enviar Link'}
                                </button>
                            </form>
                            <div className="mt-5 text-center">
                                <button onClick={onGoLogin} className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1 mx-auto transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Voltar ao login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ResetPasswordPage({ token, onGoLogin }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handle = async (e) => {
        e.preventDefault();
        if (password !== confirm) { setError('As senhas não coincidem.'); return; }
        setLoading(true); setError('');
        try {
            const r = await fetch(`${API}/auth/reset-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message);
            setDone(true);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0D1340] via-[#1a2060] to-[#0a0f2e] flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-[#F57C00] rounded-2xl shadow-2xl shadow-orange-900/50 mb-4 transform -rotate-3">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Nova Senha</h1>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {done ? (
                        <div className="text-center space-y-4">
                            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
                            <h3 className="text-white font-black text-xl">Senha redefinida!</h3>
                            <button onClick={onGoLogin}
                                className="mt-2 w-full h-12 bg-gradient-to-r from-[#1F2A8A] to-[#1E88E5] text-white font-black rounded-xl">
                                Fazer Login
                            </button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}
                            <form onSubmit={handle} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nova Senha</label>
                                    <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Confirmar Senha</label>
                                    <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 transition-all" />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-[#1F2A8A] to-[#1E88E5] text-white font-black rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar Nova Senha'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
