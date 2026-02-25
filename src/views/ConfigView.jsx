import React, { useState } from 'react';
import { Database, User, Layout, Trash2, Eye, EyeOff, Cloud, Save, Globe, Server } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import BackupPanel from './BackupPanel';
import FormLayoutBuilder from '../components/layout/FormLayoutBuilder';
import { normalizeMetadata } from '../utils/metadataMigration';

const WP_CREDS_KEY = 'poisson_wp_credentials';
const SSH_CREDS_KEY = 'poisson_ssh_credentials';

// ── Seção Meu Perfil ─────────────────────────────────────────────────────────
const ProfileSection = ({ handleInputInteraction }) => {
  const [creds, setCreds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(WP_CREDS_KEY) || '{}'); } catch { return {}; }
  });
  const [sshCreds, setSshCreds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SSH_CREDS_KEY) || '{}'); } catch { return {}; }
  });
  const [showPass, setShowPass] = useState(false);
  const [showSshPass, setShowSshPass] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem(WP_CREDS_KEY, JSON.stringify(creds));
    localStorage.setItem(SSH_CREDS_KEY, JSON.stringify(sshCreds));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Avatar */}
      <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
        <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-amber-200">DA</div>
        <div>
          <h3 className="text-xl font-black text-slate-800">Darly</h3>
          <p className="text-xs text-slate-400 font-medium italic">Sênior Admin • ID: Poisson-000</p>
        </div>
      </div>

      {/* Nome exibição */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome de Exibição</label>
        <input className="w-full max-w-xs h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" defaultValue="Darly" onKeyDown={handleInputInteraction} />
      </div>

      {/* Credenciais WordPress */}
      <div className="border border-slate-100 rounded-2xl p-6 space-y-5 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-[#F57C00]" />
          <h4 className="text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest">Credenciais WordPress</h4>
        </div>
        <p className="text-[10px] text-slate-400">Usadas na aba WordPress de cada livro. Salvas localmente no seu navegador.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">URL do WordPress</label>
            <input
              type="url"
              value={creds.wpUrl || 'https://poisson.com.br'}
              onChange={e => setCreds(c => ({ ...c, wpUrl: e.target.value }))}
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-all"
              onKeyDown={handleInputInteraction}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Usuário WP</label>
            <input
              type="text"
              value={creds.wpUser || ''}
              onChange={e => setCreds(c => ({ ...c, wpUser: e.target.value }))}
              placeholder="admin"
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-all"
              onKeyDown={handleInputInteraction}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Application Password</label>
          <div className="relative max-w-sm">
            <input
              type={showPass ? 'text' : 'password'}
              value={creds.wpAppPassword || ''}
              onChange={e => setCreds(c => ({ ...c, wpAppPassword: e.target.value }))}
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              className="w-full h-11 px-3 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 transition-all"
              onKeyDown={handleInputInteraction}
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[9px] text-slate-400 italic">WP Admin → Usuários → Perfil → Application Passwords → Adicionar nova</p>
        </div>
      </div>

      {/* Credenciais SSH - Gerenciador de Arquivos */}
      <div className="border border-slate-100 rounded-2xl p-6 space-y-5 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-[#F57C00]" />
          <h4 className="text-[11px] font-black text-[#1F2A8A] uppercase tracking-widest">Credenciais SSH (VPS)</h4>
        </div>
        <p className="text-[10px] text-slate-400">Usadas no Gerenciador de Arquivos. Salvas localmente no seu navegador.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Host / IP</label>
            <input type="text" value={sshCreds.sshHost || ''}
              onChange={e => setSshCreds(c => ({ ...c, sshHost: e.target.value }))}
              placeholder="72.60.254.10"
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-all"
              onKeyDown={handleInputInteraction} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Usuário SSH</label>
            <input type="text" value={sshCreds.sshUser || ''}
              onChange={e => setSshCreds(c => ({ ...c, sshUser: e.target.value }))}
              placeholder="root"
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-all"
              onKeyDown={handleInputInteraction} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Senha SSH</label>
          <div className="relative max-w-sm">
            <input
              type={showSshPass ? 'text' : 'password'}
              value={sshCreds.sshPassword || ''}
              onChange={e => setSshCreds(c => ({ ...c, sshPassword: e.target.value }))}
              placeholder="••••••••••"
              className="w-full h-11 px-3 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 transition-all"
              onKeyDown={handleInputInteraction} />
            <button type="button" onClick={() => setShowSshPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
              {showSshPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <Button size="md" variant="primary" icon={Save} onClick={save}>
        {saved ? 'Salvo! ✓' : 'Atualizar Perfil'}
      </Button>
    </div>
  );
};

const ConfigView = ({
  metadata, setMetadata,
  confirmModal, setConfirmModal,
  editingTabId, setEditingTabId,
  activeConfigTab, setActiveConfigTab,
  handleMoveTab, handleUpdateTabLabel,
  handleMoveField, handleUpdateField, handleAddField,
  executeDelete,
  handleInputInteraction
}) => (
  <div className="animate-slide space-y-6 w-full min-w-0">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Arquitetura Poisson</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Configuração de Metadados e BI</p>
      </div>
    </div>

    <Card className="flex flex-col md:flex-row min-h-[600px] border-none shadow-2xl relative">
      {confirmModal.show && (
        <DeleteConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} executeDelete={executeDelete} />
      )}

      <div className="w-full md:w-64 bg-slate-50/50 border-r border-slate-100 p-6 space-y-2">
        {[
          { id: 'profile', label: 'Meu Perfil', icon: User },
          { id: 'metadata', label: 'Metadados', icon: Database },
          { id: 'system', label: 'Sistema', icon: Layout },
          { id: 'backup', label: 'Backup', icon: Cloud }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveConfigTab(item.id); setEditingTabId(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeConfigTab === item.id ? 'bg-white shadow-sm text-blue-700 border border-slate-100' : 'text-slate-400 hover:bg-slate-100/50'}`}
          >
            <item.icon size={16} />{item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-10 animate-in fade-in duration-300">

        {activeConfigTab === 'metadata' && (
          <FormLayoutBuilder
            metadata={normalizeMetadata(metadata)}
            setMetadata={setMetadata}
            confirmModal={confirmModal}
            setConfirmModal={setConfirmModal}
            activeConfigTab={activeConfigTab}
            setActiveConfigTab={setActiveConfigTab}
            handleInputInteraction={handleInputInteraction}
          />
        )}

        {activeConfigTab === 'profile' && (
          <ProfileSection handleInputInteraction={handleInputInteraction} />
        )}

        {activeConfigTab === 'backup' && (
          <BackupPanel />
        )}

      </div>
    </Card>
  </div>
);

export default ConfigView;