import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import authService from '../services/authService';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const recaptchaRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const recaptchaValue = recaptchaRef.current.getValue();
        if (!recaptchaValue) {
            setError('Por favor, confirme que você não é um robô.');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.forgotPassword(email);
            setMessage(response.message || 'Verifique seu e-mail para as instruções');
            recaptchaRef.current.reset();
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao solicitar código');
            recaptchaRef.current.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

            <div className="w-full max-w-md glass-panel p-8 sm:p-10 transform transition-all duration-500 ease-in-out">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 mb-4 shadow-lg shadow-rose-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Recuperar Senha</h2>
                    <p className="text-slate-400">Insira seu e-mail para receber o link</p>
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
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">E-mail Cadastrado</label>
                        <input id="email" type="email" required className="gl-input" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="flex justify-center rounded-lg bg-slate-900/50 p-2">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                            theme="dark"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="gl-btn overflow-hidden relative group">
                        <span className="relative z-10 flex items-center gap-2">
                            {loading ? 'Enviando Link...' : 'Enviar Link de Reset'}
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

export default ForgotPassword;
