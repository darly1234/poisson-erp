import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage({ onGoRegister, onGoForgot }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handle = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0D1340] via-[#1a2060] to-[#0a0f2e] flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1E88E5]/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#F57C00]/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1E88E5] to-[#1F2A8A] rounded-2xl shadow-2xl shadow-blue-900/50 mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Poisson ERP</h1>
                    <p className="text-slate-400 text-sm mt-1">Faça login para continuar</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handle} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">E-mail</label>
                            <input
                                type="email" required autoComplete="email"
                                value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 focus:bg-white/8 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Senha</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 px-4 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm outline-none focus:border-[#1E88E5]/60 transition-all"
                                />
                                <button type="button" onClick={() => setShowPass(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={onGoForgot}
                                className="text-[11px] text-[#1E88E5] hover:text-blue-300 transition-colors font-medium">
                                Esqueceu a senha?
                            </button>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-[#1F2A8A] to-[#1E88E5] hover:opacity-90 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <span className="text-slate-500 text-sm">Não tem conta? </span>
                        <button onClick={onGoRegister} className="text-[#1E88E5] hover:text-blue-300 text-sm font-bold transition-colors">
                            Criar conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
