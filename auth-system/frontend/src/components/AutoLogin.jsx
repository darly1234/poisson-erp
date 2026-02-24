import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const AutoLogin = ({ setAuth }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verificando acesso...');

    useEffect(() => {
        const performAutoLogin = async () => {
            try {
                // Request backend to create/get the master user and return a token
                const response = await axios.post('http://localhost:5000/api/auth/auto-login-master');

                // Set token in local storage
                localStorage.setItem('user', JSON.stringify(response.data));
                setAuth(response.data);

                setStatus('Login realizado com sucesso! Redirecionando...');

                // Small delay to show success message, then navigate to dashboard
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);

            } catch (err) {
                setStatus('Erro no auto-login. Verifique o console do backend.');
                console.error("Auto Login Error:", err);
            }
        };

        performAutoLogin();
    }, [navigate, setAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-8 text-center max-w-sm w-full">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4 shadow-lg shadow-indigo-500/30">
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white mb-2">Entrando Facilmente</h2>
                <p className="text-indigo-300 font-medium">{status}</p>
            </div>
        </div>
    );
};

export default AutoLogin;
