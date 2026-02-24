import React, { useState, useEffect } from 'react';
import roleService from '../../services/roleService';

const RoleList = ({ onAddNew }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await roleService.getRoles();
            setRoles(data);
        } catch (err) {
            setError('Falha ao carregar os cargos.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esse cargo? Usuários atrelados poderão perder acesso.')) {
            try {
                await roleService.deleteRole(id);
                fetchRoles();
            } catch (err) {
                setError('Erro ao excluir cargo.');
            }
        }
    };

    if (loading) return <div className="text-slate-400">Carregando cargos...</div>;

    return (
        <div className="glass-panel p-6 shadow-xl border border-slate-700/50 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                    Cargos do Sistema
                </h3>
                <button
                    onClick={onAddNew}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-emerald-500/25"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Novo Cargo
                </button>
            </div>

            {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-lg">{error}</div>}

            <div className="overflow-x-auto relative z-10 bg-slate-900/40 rounded-xl border border-slate-700/50">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-xl border-b border-slate-700/50">Nome do Cargo</th>
                            <th className="px-6 py-4 border-b border-slate-700/50">Descrição</th>
                            <th className="px-6 py-4 border-b border-slate-700/50">Permissões</th>
                            <th className="px-6 py-4 text-right rounded-tr-xl border-b border-slate-700/50">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{role.name}</td>
                                <td className="px-6 py-4 text-slate-400">{role.description || '-'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {role.permissions && role.permissions.length > 0 ? (
                                            role.permissions.map(p => (
                                                <span key={p.id} className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 whitespace-nowrap">
                                                    {p.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 text-xs">Nenhuma</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(role.id)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 p-2 rounded-lg transition-colors" title="Excluir Cargo">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {roles.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Nenhum cargo configurado no sistema.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoleList;
