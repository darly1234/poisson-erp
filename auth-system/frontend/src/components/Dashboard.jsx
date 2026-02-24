import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Dashboard = ({ user, setAuth }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        setAuth(null);
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Poisson ERP</h1>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">User: {user?.user?.name || 'Guest'}</span>
                            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex flex-col items-center justify-center bg-white p-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Seja Bem-vindo à Área Protegida do Acervo</h2>
                        <p className="text-gray-600">Este conteúdo só é visível porque você está com um JSON Web Token (JWT) válido.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
