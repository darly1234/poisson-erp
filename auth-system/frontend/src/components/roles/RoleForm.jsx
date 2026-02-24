import React, { useState, useEffect } from 'react';
import roleService from '../../services/roleService';

const RoleForm = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const perms = await roleService.getPermissions();
                setAvailablePermissions(perms);
            } catch (err) {
                setError('Erro ao carregar lista de permissões.');
            }
        };
        fetchPermissions();
    }, []);

    const togglePermission = (id) => {
        setSelectedPermissions(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await roleService.createRole({
                name,
                description,
                permissionIds: selectedPermissions
            });
            onSuccess(); // Close form and refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao criar o Cargo. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-8 shadow-2xl border border-slate-700/50 rounded-2xl relative max-w-2xl mx-auto">

            {/* Background glowing effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 mb-6">
                Criar Novo Cargo
            </h3>

            {error && <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-xl text-sm font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="name">Nome do Cargo</label>
                        <input
                            id="name"
                            type="text"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-500"
                            placeholder="Ex: Gerente Financeiro"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="description">Descrição</label>
                        <input
                            id="description"
                            type="text"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-500"
                            placeholder="Opcional. Ex: Acesso aos relatórios de faturamento"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <label className="block text-sm font-medium text-slate-300 mb-3">Permissões de Sistema Associadas</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availablePermissions.map(perm => (
                            <div
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                className={`
                                    cursor-pointer border rounded-xl p-3 flex flex-col transition-all
                                    ${selectedPermissions.includes(perm.id)
                                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-inner'
                                        : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600'}
                                `}
                            >
                                <div className="flex items-center mb-1">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors
                                        ${selectedPermissions.includes(perm.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 bg-slate-800'}`}>
                                        {selectedPermissions.includes(perm.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>
                                    <span className={`font-semibold text-sm ${selectedPermissions.includes(perm.id) ? 'text-emerald-400' : 'text-slate-300'}`}>{perm.name}</span>
                                </div>
                                <span className="text-xs text-slate-500 ml-6">{perm.description}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-6 mt-4 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : 'Salvar Cargo'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RoleForm;
