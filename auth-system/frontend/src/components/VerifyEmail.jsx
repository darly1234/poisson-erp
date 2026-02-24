import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import authService from '../services/authService';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const hasVerified = useRef(false);

    useEffect(() => {
        const verify = async () => {
            if (hasVerified.current) return;
            hasVerified.current = true;
            try {
                const response = await authService.verifyEmail(token);
                setStatus('success');
                setMessage(response.message);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Ocorreu um erro ao verificar seu e-mail.');
            }
        };

        if (token) {
            verify();
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

            <div className="w-full max-w-md glass-panel p-8 sm:p-10 text-center">

                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <svg className="animate-spin h-12 w-12 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h2 className="text-xl font-medium text-white">Verificando E-mail...</h2>
                        <p className="text-slate-400 mt-2">Por favor, aguarde enquanto autenticamos seu token.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 mb-6 shadow-lg shadow-emerald-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">E-mail Confirmado!</h2>
                        <p className="text-emerald-400 font-medium mb-8 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">{message}</p>

                        <Link to="/login" className="gl-btn group w-full">
                            Fazer Login Agora
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-red-500 to-rose-500 mb-6 shadow-lg shadow-red-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Erro na Verificação</h2>
                        <p className="text-red-400 font-medium mb-8 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{message}</p>

                        <Link to="/register" className="gl-btn group w-full">
                            Tentar Novamente
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyEmail;
