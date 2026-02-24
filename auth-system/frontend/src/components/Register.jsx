import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import authService from '../services/authService';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const recaptchaRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        const recaptchaValue = recaptchaRef.current.getValue();
        if (!recaptchaValue) {
            setError('Por favor, confirme que você não é um robô.');
            return;
        }

        setLoading(true);
        try {
            await authService.register(name, email, password);
            setSuccess('Conta criada com sucesso! Verifique seu e-mail.');
            setName(''); setEmail(''); setPassword('');
            recaptchaRef.current.reset();
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao registrar');
            recaptchaRef.current.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

            <div className="w-full max-w-md glass-panel p-8 sm:p-10 transform transition-all duration-500 ease-in-out">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white pl-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Crie sua conta</h2>
                    <p className="text-slate-400">Junte-se a nós em poucos segundos</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center text-sm animate-pulse">
                        <svg className="w-5 h-5 mr-no-shrink mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg flex items-center text-sm">
                        <svg className="w-5 h-5 mr-no-shrink mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        {success}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="name">Nome Completo</label>
                        <input id="name" type="text" required className="gl-input" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">E-mail</label>
                        <input id="email" type="email" required className="gl-input" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Senha</label>
                        <input id="password" type="password" required className="gl-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="confirmPassword">Confirmar Senha</label>
                        <input id="confirmPassword" type="password" required className="gl-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>

                    <div className="flex justify-center pt-2 pb-2 rounded-lg bg-slate-900/50 p-2">
                        {/* Note: In a real app, replace sitekey with process.env.VITE_RECAPTCHA_SITE_KEY */}
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                            theme="dark"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="gl-btn mt-6 overflow-hidden relative group">
                        <span className="relative z-10 flex items-center gap-2">
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Registrando...
                                </>
                            ) : 'Criar Conta'}
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-slate-400">
                        Já possui uma conta? <Link to="/login" className="gl-link ml-1">Fazer login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
