import React, { useState } from 'react';
import RoleList from './RoleList';
import RoleForm from './RoleForm';

const RoleManagementLayout = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'

    const handleAddNew = () => setView('form');
    const handleCancel = () => setView('list');
    const handleSuccess = () => setView('list');

    return (
        <div className="max-w-6xl mx-auto w-full">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-white m-0">
                    Cargos e Permissões
                </h2>
                <p className="mt-2 text-slate-400 max-w-2xl text-lg">
                    Crie perfis e gerencie o nível de acesso da equipe.
                </p>
            </div>

            {view === 'list' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RoleList onAddNew={handleAddNew} />
                </div>
            )}

            {view === 'form' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <RoleForm onCancel={handleCancel} onSuccess={handleSuccess} />
                </div>
            )}
        </div>
    );
};

export default RoleManagementLayout;
