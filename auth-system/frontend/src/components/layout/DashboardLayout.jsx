import React, { useState } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import Profile from '../profile/Profile';
import UserManagementLayout from '../users/UserManagementLayout';
import RoleManagementLayout from '../roles/RoleManagementLayout';
import HasPermission from '../roles/HasPermission';
import BookPipeline from '../dashboard/BookPipeline';

const Sidebar = ({ currentPath }) => {
    const navItems = [
        { path: '/dashboard', label: 'Início', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { path: '/dashboard/profile', label: 'Meu Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { path: '/dashboard/users', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', requiredPermission: 'manage_users' },
        { path: '/dashboard/roles', label: 'Cargos e Permissões', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', requiredPermission: 'manage_roles' }
    ];

    return (
        <aside className="w-64 bg-slate-900/80 border-r border-slate-800 backdrop-blur-md hidden md:flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    Poisson ERP
                </h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => {
                    const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
                    const linkMarkup = (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <svg className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );

                    if (item.requiredPermission) {
                        return (
                            <HasPermission key={item.path} requiredPermission={item.requiredPermission}>
                                {linkMarkup}
                            </HasPermission>
                        );
                    }

                    return linkMarkup;
                })}
            </nav>
        </aside>
    );
};

const Header = ({ user, setAuth }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        setAuth(null);
        navigate('/login');
    };

    return (
        <header className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex justify-between items-center px-6 py-4">
                <div className="flex items-center md:hidden">
                    {/* Mobile menu button could go here */}
                    <h1 className="text-lg font-bold text-white">Poisson ERP</h1>
                </div>
                <div className="hidden md:block"></div> {/* Spacer */}

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold overflow-hidden">
                            {user?.user?.name ? user.user.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <span className="text-sm font-medium text-slate-300 hidden sm:block">
                            {user?.user?.name || 'Guest'}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        Sair
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

const DashboardHome = () => (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <BookPipeline onFilterStatus={(status) => console.log('Filtro de busca acionado:', status)} />

        <div className="glass-panel p-10 flex flex-col items-center text-center border-dashed border-2 border-slate-700/50 mt-8 rounded-2xl bg-slate-900/30">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Autenticado com Sucesso</h3>
            <p className="text-slate-400 max-w-md">
                Você acessou a área segura central do ERP.
            </p>
        </div>
    </div>
);

const DashboardLayout = ({ user, setAuth }) => {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
            <Sidebar currentPath={location.pathname} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header user={user} setAuth={setAuth} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0f172a]">

                    {/* Background decorations inherited from global css, applying a container wrapper */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{
                        backgroundImage: `radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
                                      radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)`
                    }}></div>


                    <div className="relative z-10 w-full min-h-full p-2 sm:p-4 md:p-6 lg:p-8">
                        <Routes>
                            <Route path="/" element={<DashboardHome />} />
                            <Route path="/profile" element={<Profile user={user} setAuth={setAuth} />} />
                            <Route path="/users/*" element={<UserManagementLayout />} />
                            <Route path="/roles/*" element={<RoleManagementLayout />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
