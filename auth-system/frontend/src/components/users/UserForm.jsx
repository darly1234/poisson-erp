import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import roleService from '../../services/roleService';

const UserForm = ({ onCancel, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role_id: '' });
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await roleService.getRoles();
                setRoles(data);
            } catch (err) {
                console.error('Failed to fetch roles', err);
            }
        };
        fetchRoles();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await userService.createUser(formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao adicionar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
            <div className="mb-6 flex items-center gap-4">
                <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Adicionar Usuário</h2>
                    <p className="text-sm text-slate-400">Crie uma nova conta com acesso direto.</p>
                </div>
            </div>

            <div className="glass-panel p-6 sm:p-8">
                {error && <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                            <input type="text" name="name" required className="gl-input" value={formData.name} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
                            <input type="email" name="email" required className="gl-input" value={formData.email} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="max-w-sm">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Senha Temporária</label>
                            <input type="password" name="password" required className="gl-input" value={formData.password} onChange={handleChange} />
                            <p className="mt-1 text-xs text-slate-500">O usuário poderá alterá-la depois no próprio perfil.</p>
                        </div>

                        <div className="max-w-sm">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Cargo no Sistema</label>
                            <select
                                name="role_id"
                                className="gl-input bg-slate-900/50 appearance-none"
                                value={formData.role_id}
                                onChange={handleChange}
                            >
                                <option value="">Sem Cargo (Acesso Básico)</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500">Isso definirá as permissões dele nesta plataforma.</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50 mt-8">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">Cancelar</button>
                        <button type="submit" disabled={loading} className="gl-btn w-auto min-w-[140px] px-6 py-2">
                            {loading ? 'Salvando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
