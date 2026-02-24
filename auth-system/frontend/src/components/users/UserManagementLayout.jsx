import React, { useState } from 'react';
import UserList from './UserList';
import UserForm from './UserForm';

const UserManagementLayout = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'

    const handleAddSuccess = () => {
        // Pós-criação, retornamos a tabela
        setView('list');
    };

    return (
        <div className="w-full h-full">
            {view === 'list' && <UserList onAddUser={() => setView('form')} />}
            {view === 'form' && <UserForm onCancel={() => setView('list')} onSuccess={handleAddSuccess} />}
        </div>
    );
};

export default UserManagementLayout;
