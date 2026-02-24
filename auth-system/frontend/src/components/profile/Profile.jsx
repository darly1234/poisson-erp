import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

const Profile = ({ user, setAuth }) => {
    const [profile, setProfile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await userService.getProfile();
                setProfile(data);
                if (data.avatar_url) setAvatarPreview(data.avatar_url);
            } catch (err) {
                setError('Erro ao carregar os dados do perfil.');
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('A imagem deve ter no máximo 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword && !currentPassword) {
            setError('Por favor, informe a senha atual para alterar a senha.');
            return;
        }

        setSaving(true);
        try {
            const payload = {};
            if (avatarPreview && avatarPreview !== profile.avatar_url) {
                payload.avatar_url = avatarPreview;
            }
            if (currentPassword && newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            if (Object.keys(payload).length === 0) {
                setMessage('Nenhuma alteração foi feita.');
                setSaving(false);
                return;
            }

            const response = await userService.updateProfile(payload);
            setMessage(response.message);
            setCurrentPassword('');
            setNewPassword('');
            setProfile(response.user);

            // Update global context name if changed
            const updatedUserParams = { ...user };
            updatedUserParams.user.name = response.user.name;
            setAuth(updatedUserParams);
            localStorage.setItem('user', JSON.stringify(updatedUserParams));

        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao atualizar o perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Carregando perfil...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-8">Meu Perfil</h2>

            {error && <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {message && <div className="mb-6 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg text-sm">{message}</div>}

            <div className="glass-panel p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Photo Upload Section */}
                <div className="col-span-1 flex flex-col items-center space-y-4">
                    <div className="relative group w-40 h-40 rounded-full overflow-hidden border-4 border-slate-700 bg-slate-800 flex items-center justify-center">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Profile Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl text-slate-500 font-bold">{profile?.name.charAt(0).toUpperCase()}</span>
                        )}

                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="text-xs text-white font-medium">Alterar Foto</span>
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                    <p className="text-xs text-slate-500 text-center">Recomendado: 256x256px<br />Max 5MB (JPG, PNG)</p>
                </div>

                {/* Data & Password Section */}
                <div className="col-span-1 md:col-span-2">
                    <form onSubmit={handleUpdate} className="space-y-6">

                        <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800/50 space-y-4">
                            <h3 className="text-lg font-medium text-indigo-300">Informações Pessoais</h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                                <input type="text" className="gl-input opacity-70 cursor-not-allowed" value={profile?.name || ''} readOnly disabled />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1 flex justify-between">
                                    E-mail Cadastrado
                                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Verificado / Não pode ser alterado</span>
                                </label>
                                <input type="email" className="gl-input opacity-70 cursor-not-allowed text-slate-400" value={profile?.email || ''} readOnly disabled />
                            </div>
                        </div>

                        <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800/50 space-y-4">
                            <h3 className="text-lg font-medium text-indigo-300">Segurança</h3>
                            <p className="text-sm text-slate-400 mb-4">Deixe em branco se não desejar alterar a senha atual.</p>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Senha Atual</label>
                                    <input type="password" placeholder="••••••••" className="gl-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nova Senha</label>
                                    <input type="password" placeholder="••••••••" className="gl-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={saving} className="gl-btn w-auto min-w-[150px]">
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
