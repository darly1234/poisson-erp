import React, { useState } from 'react';
import { Database, User, Layout, Trash2, Eye, EyeOff, Cloud, Save, Globe, Server, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import BackupPanel from './BackupPanel';
import FormLayoutBuilder from '../components/layout/FormLayoutBuilder';
import { normalizeMetadata } from '../utils/metadataMigration';
import { api } from '../services/api';

const WP_CREDS_KEY = 'poisson_wp_credentials';
const SSH_CREDS_KEY = 'poisson_ssh_credentials';

// ── Seção Webhook e Templates ───────────────────────────────────────────────
// ── Sub-componente para cada Template para lidar com Refs próprios ──────────
const TemplateItem = ({ temp, index, updateTemplate, removeTemplate }) => {
  const textareaRef = React.useRef(null);

  const insertVariable = (field) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const text = `{{${field}}}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = temp.content || '';
    const nextContent = currentContent.substring(0, start) + text + currentContent.substring(end);

    updateTemplate(index, 'content', nextContent);

    // Restaura foco e cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 10);
  };

  return (
    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 relative group shadow-sm hover:shadow-md transition-all">
      <button
        onClick={() => {
          setConfirmModal({
            show: true,
            type: 'template',
            id: index,
            label: temp.name,
            extraData: { removeTemplate }
          })
        }}
        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-all"
        title="Excluir modelo"
      >
        <Trash2 size={16} />
      </button>
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Modelo</label>
        <input
          type="text"
          value={temp.name}
          onChange={e => updateTemplate(index, 'name', e.target.value)}
          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Conteúdo da Mensagem</label>
        <textarea
          ref={textareaRef}
          rows={4}
          value={temp.content}
          onChange={e => updateTemplate(index, 'content', e.target.value)}
          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 transition-all resize-none shadow-sm min-h-[100px]"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {['isbn', 'doi', 'title', 'pub_date', 'doi_link'].map(field => (
            <button
              key={field}
              onClick={() => insertVariable(field)}
              className="text-[9px] font-mono bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
              title="Clique para inserir no cursor"
            >
              {'{{'}{field}{'}}'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const TemplateSection = ({ handleInputInteraction, setConfirmModal }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [templates, setTemplates] = useState([]);
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '587',
    user: '',
    pass: '',
    from_name: 'Poisson ERP',
    from_email: ''
  });
  const [systemTemplates, setSystemTemplates] = useState({
    password_reset: {
      subject: 'Redefinição de senha — Poisson ERP',
      content: 'Olá, clique no link para redefinir sua senha: {{reset_url}}'
    },
    login_code: {
      subject: 'Seu código de acesso — Poisson ERP',
      content: 'Seu código de acesso é: {{code}}'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const settings = await api.getSettings();
        setWebhookUrl(settings.n8n_webhook_url?.url || '');
        setTemplates(settings.message_templates || []);
        if (settings.smtp_config) setSmtpConfig(settings.smtp_config);
        if (settings.system_templates) setSystemTemplates(settings.system_templates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const save = async () => {
    try {
      await api.saveSettings('n8n_webhook_url', { url: webhookUrl });
      await api.saveSettings('message_templates', templates);
      await api.saveSettings('smtp_config', smtpConfig);
      await api.saveSettings('system_templates', systemTemplates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const addTemplate = () => {
    setTemplates([...templates, { name: 'Novo Modelo', content: 'Olá, confira os dados: {{title}}' }]);
  };

  const removeTemplate = (index) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };

  const updateTemplate = (index, field, value) => {
    const newTemplates = [...templates];
    newTemplates[index] = { ...newTemplates[index], [field]: value };
    setTemplates(newTemplates);
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando configurações...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <Server className="w-5 h-5 text-[#F57C00]" />
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">n8n e Mensagens</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">URL do Webhook (n8n)</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://sua-instancia.n8n.cloud/webhook/..."
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all font-mono"
            onKeyDown={handleInputInteraction}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelos de Mensagem</label>
          <Button size="xs" variant="outline" onClick={addTemplate}>+ Novo Modelo</Button>
        </div>

        <div className="grid gap-4">
          {templates.map((temp, i) => (
            <TemplateItem
              key={i}
              temp={temp}
              index={i}
              updateTemplate={updateTemplate}
              removeTemplate={removeTemplate}
              setConfirmModal={setConfirmModal}
            />
          ))}
          {templates.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 text-xs font-medium">
              Nenhum modelo cadastrado.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-10 pb-4 border-b border-slate-100">
        <Mail className="w-5 h-5 text-[#F57C00]" />
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">E-mail de Sistema (SMTP)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Servidor SMTP (Host)</label>
          <input
            type="text"
            value={smtpConfig.host}
            onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
            placeholder="smtp.gmail.com"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all font-mono"
            onKeyDown={handleInputInteraction}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Porta</label>
          <input
            type="text"
            value={smtpConfig.port}
            onChange={e => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
            placeholder="587"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all font-mono"
            onKeyDown={handleInputInteraction}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Usuário SMTP</label>
          <input
            type="text"
            value={smtpConfig.user}
            onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
            placeholder="contato@exemplo.com"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all font-mono"
            onKeyDown={handleInputInteraction}
          />
        </div>
        <div className="space-y-1 relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Senha SMTP</label>
          <input
            type={showSmtpPass ? "text" : "password"}
            value={smtpConfig.pass}
            onChange={e => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
            placeholder="••••••••••••"
            className="w-full h-11 px-3 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 transition-all"
            onKeyDown={handleInputInteraction}
          />
          <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 top-[34px] text-slate-300 hover:text-slate-600">
            {showSmtpPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">E-mail Remetente</label>
          <input
            type="email"
            value={smtpConfig.from_email}
            onChange={e => setSmtpConfig({ ...smtpConfig, from_email: e.target.value })}
            placeholder="no-reply@poisson.com.br"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all font-mono"
            onKeyDown={handleInputInteraction}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome Remetente</label>
          <input
            type="text"
            value={smtpConfig.from_name}
            onChange={e => setSmtpConfig({ ...smtpConfig, from_name: e.target.value })}
            placeholder="Poisson ERP"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
            onKeyDown={handleInputInteraction}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-10 pb-4 border-b border-slate-100">
        <Layout className="w-5 h-5 text-[#F57C00]" />
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Modelos do Sistema</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 bg-blue-50/30 border border-blue-100/50 rounded-3xl space-y-4">
          <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Recuperação de Senha</h4>
          <div className="space-y-2">
            <input
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              value={systemTemplates.password_reset.subject}
              onChange={e => setSystemTemplates({ ...systemTemplates, password_reset: { ...systemTemplates.password_reset, subject: e.target.value } })}
              placeholder="Assunto"
            />
            <textarea
              rows={4}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:border-blue-500 resize-none"
              value={systemTemplates.password_reset.content}
              onChange={e => setSystemTemplates({ ...systemTemplates, password_reset: { ...systemTemplates.password_reset, content: e.target.value } })}
            />
            <p className="text-[9px] text-slate-400 italic">Variável disponível: <code className="font-bold text-blue-600">{"{{reset_url}}"}</code></p>
          </div>
        </div>

        <div className="p-6 bg-amber-50/30 border border-amber-100/50 rounded-3xl space-y-4">
          <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Código de Login</h4>
          <div className="space-y-2">
            <input
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              value={systemTemplates.login_code.subject}
              onChange={e => setSystemTemplates({ ...systemTemplates, login_code: { ...systemTemplates.login_code, subject: e.target.value } })}
              placeholder="Assunto"
            />
            <textarea
              rows={4}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-medium outline-none focus:border-blue-500 resize-none"
              value={systemTemplates.login_code.content}
              onChange={e => setSystemTemplates({ ...systemTemplates, login_code: { ...systemTemplates.login_code, content: e.target.value } })}
            />
            <p className="text-[9px] text-slate-400 italic">Variável disponível: <code className="font-bold text-amber-600">{"{{code}}"}</code></p>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button size="md" variant="primary" icon={Save} onClick={save}>
          {saved ? 'Tudo Salvo! ✓' : 'Salvar Todas as Configurações'}
        </Button>
      </div>
    </div>
  );
};

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

    <Card className="flex flex-col md:flex-row min-h-[600px] border-none shadow-2xl relative overflow-hidden">

      <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar whitespace-nowrap md:whitespace-normal">
        {[
          { id: 'profile', label: 'Cadastro', icon: User },
          { id: 'metadata', label: 'Metadados', icon: Database },
          { id: 'messages', label: 'Mensagens', icon: Mail },
          { id: 'system', label: 'Sistema', icon: Layout },
          { id: 'backup', label: 'Backup', icon: Cloud }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveConfigTab(item.id);
              setEditingTabId(null);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all border shrink-0 ${activeConfigTab === item.id ? 'bg-white shadow-sm text-blue-700 border-slate-200' : 'text-slate-400 border-transparent hover:bg-slate-100/50'}`}
          >
            <item.icon size={14} className="shrink-0" />
            <span className="md:inline">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-5 md:p-10 animate-in fade-in duration-300 overflow-y-auto">

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

        {activeConfigTab === 'messages' && (
          <TemplateSection handleInputInteraction={handleInputInteraction} setConfirmModal={setConfirmModal} />
        )}

      </div>
    </Card>
  </div>
);

export default ConfigView;