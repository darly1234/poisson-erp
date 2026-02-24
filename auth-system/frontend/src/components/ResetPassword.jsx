import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            await authService.resetPassword(token, password);
            setMessage('Senha atualizada com sucesso. Você já pode fazer login.');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao redefinir a senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

            <div className="w-full max-w-md glass-panel p-8 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 mb-4 shadow-lg shadow-cyan-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Nova Senha</h2>
                    <p className="text-slate-400">Defina sua nova credencial de acesso</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center text-sm">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg flex items-center text-sm">
                        {message}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Nova Senha</label>
                        <input id="password" type="password" required className="gl-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="confirm">Confirme a Senha</label>
                        <input id="confirm" type="password" required className="gl-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>

                    <button type="submit" disabled={loading} className="gl-btn overflow-hidden relative group mt-8">
                        <span className="relative z-10 flex items-center gap-2">
                            {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
                        </span>
                    </button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-slate-700/50">
                    <Link to="/login" className="gl-link flex items-center justify-center text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar para o Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
