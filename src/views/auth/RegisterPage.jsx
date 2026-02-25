import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function PasswordStrength({ password }) {
    const checks = [
        { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
        { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
        { label: 'Número', ok: /\d/.test(password) },
    ];
    const score = checks.filter(c => c.ok).length;
    const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
    return (
        <div className="space-y-1.5 mt-2">
            <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-white/10'}`} />
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {checks.map(c => (
                    <span key={c.label} className={`text-[9px] font-bold flex items-center gap-1 transition-colors ${c.ok ? 'text-green-400' : 'text-slate-500'}`}>
                        <CheckCircle2 className="w-2.5 h-2.5" /> {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function RegisterPage({ onGoLogin }) {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handle = async (e) => {
        e.preventDefault();
        if (password !== confirm) { setError('As senhas não coincidem.'); return; }
        if (password.length < 8) { setError('Senha muito curta.'); return; }
        setLoading(true); setError('');
        try {
            await register(name, email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0D1340] via-[#1a2060] to-[#0a0f2e] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1E88E5]/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#F57C00]/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1E88E5] to-[#1F2A8A] rounded-2xl shadow-2xl shadow-blue-900/50 mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Criar Conta</h1>
                    <p className="text-slate-400 text-sm mt-1">Preencha os dados abaixo</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}
                    <form onSubmit={handle} className="space-y-4">
                        {/* Nome */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                placeholder="Seu nome"
                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 transition-all" />
                        </div>
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">E-mail</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 transition-all" />
                        </div>
                        {/* Senha */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Senha</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 px-4 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 transition-all" />
                                <button type="button" onClick={() => setShowPass(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {password && <PasswordStrength password={password} />}
                        </div>
                        {/* Confirmar senha */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Confirmar Senha</label>
                            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full h-12 px-4 bg-white/5 border rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all ${confirm && confirm !== password ? 'border-red-500/50' : 'border-white/10 focus:border-[#1E88E5]/60'
                                    }`} />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-[#1F2A8A] to-[#1E88E5] hover:opacity-90 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : 'Criar Conta'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <span className="text-slate-500 text-sm">Já tem conta? </span>
                        <button onClick={onGoLogin} className="text-[#1E88E5] hover:text-blue-300 text-sm font-bold transition-colors">Entrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
