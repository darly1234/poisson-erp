import React, { useState, useEffect } from 'react';
import { Download, Upload, Cloud, Database, RotateCcw, Trash2, Clock, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const API = 'http://localhost:3001/api/backup';

export default function BackupPanel() {
  const [backups, setBackups] = useState([]);
  const [cronConfig, setCronConfig] = useState({ intervalHours: 6, maxBackups: 10 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadBackups();
    loadCronConfig();
  }, []);

  const loadBackups = async () => {
    const res = await fetch(`${API}/list`);
    const data = await res.json();
    setBackups(data);
  };

  const loadCronConfig = async () => {
    const res = await fetch(`${API}/cron-config`);
    const data = await res.json();
    setCronConfig(data);
  };

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleBackupNow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/backup-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxBackups: cronConfig.maxBackups })
      });
      const data = await res.json();
      if (data.success) {
        showMsg(`✅ Backup criado com sucesso! Total: ${data.total} backups.`);
        loadBackups();
      } else {
        showMsg(`❌ Erro: ${data.error}`, 'error');
      }
    } catch (err) {
      showMsg('❌ Erro ao criar backup.', 'error');
    }
    setLoading(false);
  };

  const handleRestore = async (filename) => {
    if (!window.confirm(`Restaurar backup "${filename}"?\n\nAtenção: os dados atuais serão substituídos!`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/restore/${filename}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showMsg('✅ Backup restaurado com sucesso! Recarregando...');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showMsg(`❌ Erro: ${data.error}`, 'error');
      }
    } catch (err) {
      showMsg('❌ Erro ao restaurar backup.', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Excluir backup "${filename}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/${filename}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showMsg('✅ Backup excluído com sucesso!');
        loadBackups();
      } else {
        showMsg(`❌ Erro: ${data.error}`, 'error');
      }
    } catch (err) {
      showMsg('❌ Erro ao excluir backup.', 'error');
    }
    setLoading(false);
  };

  const handleSaveCronConfig = async () => {
    const res = await fetch(`${API}/cron-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cronConfig)
    });
    const data = await res.json();
    if (data.success) showMsg('✅ Configurações salvas!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-slate-100">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Backup & Importação</h4>
        <p className="text-[10px] text-slate-400 font-medium mt-1">Gerencie seus dados com segurança.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-bold ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {msg.text}
        </div>
      )}

      {/* EXPORTAR */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-blue-200 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Download size={22} /></div>
          <div>
            <h5 className="text-sm font-black text-slate-800">Exportar Excel</h5>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Exporta todos os registros com todos os campos. Nome do arquivo inclui data e hora (horário de Brasília).</p>
          </div>
        </div>
        <Button variant="excel" size="md" icon={Download} onClick={() => window.open(`${API}/export`, '_blank')}>
          Baixar Excel Completo
        </Button>
      </div>

      {/* IMPORTAR */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-blue-200 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Upload size={22} /></div>
          <div>
            <h5 className="text-sm font-black text-slate-800">Importar Excel</h5>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Importa registros a partir de um Excel. Registros existentes serão atualizados.</p>
          </div>
        </div>
        <input type="file" accept=".xlsx,.xls" id="import-file" className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            setLoading(true);
            try {
              const res = await fetch(`${API}/import`, { method: 'POST', body: formData });
              const result = await res.json();
              if (result.success) {
                showMsg(`✅ ${result.imported} registros importados!`);
                setTimeout(() => window.location.reload(), 2000);
              } else {
                showMsg(`❌ Erro: ${result.error}`, 'error');
              }
            } catch (err) {
              showMsg('❌ Erro ao importar.', 'error');
            }
            setLoading(false);
          }}
        />
        <Button variant="primary" size="md" icon={Upload} onClick={() => document.getElementById('import-file').click()}>
          Selecionar Arquivo Excel
        </Button>
      </div>

      {/* BACKUP AGORA */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-blue-200 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Database size={22} /></div>
          <div>
            <h5 className="text-sm font-black text-slate-800">Backup Manual</h5>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cria um backup completo do banco agora.</p>
          </div>
        </div>
        <Button variant="primary" size="md" icon={Database} onClick={handleBackupNow} disabled={loading}>
          {loading ? 'Aguarde...' : 'Fazer Backup Agora'}
        </Button>
      </div>

      {/* CONFIGURAÇÕES CRON */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 hover:border-blue-200 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={22} /></div>
          <div>
            <h5 className="text-sm font-black text-slate-800">Backup Automático (Cron)</h5>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Configure o intervalo e quantidade de backups mantidos na VPS.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Intervalo (horas)</label>
            <input
              type="number" min="1" max="24"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
              value={cronConfig.intervalHours}
              onChange={e => setCronConfig({ ...cronConfig, intervalHours: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Máx. Backups Mantidos</label>
            <input
              type="number" min="1" max="100"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
              value={cronConfig.maxBackups}
              onChange={e => setCronConfig({ ...cronConfig, maxBackups: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Comando Cron para AlmaLinux</p>
          <code className="text-[11px] text-blue-700 font-mono bg-blue-50 p-3 rounded-lg block break-all">
            {`0 */${cronConfig.intervalHours} * * * curl -X POST http://localhost:3001/api/backup/backup-now -H "Content-Type: application/json" -d '{"maxBackups":${cronConfig.maxBackups}}'`}
          </code>
        </div>
        <Button variant="primary" size="md" icon={Save} onClick={handleSaveCronConfig}>
          Salvar Configurações
        </Button>
      </div>

      {/* LISTA DE BACKUPS / RESTAURAR */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-blue-200 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl"><RotateCcw size={22} /></div>
            <div>
              <h5 className="text-sm font-black text-slate-800">Restaurar Backup</h5>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{backups.length} backup(s) disponível(is) na VPS.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadBackups}>Atualizar</Button>
        </div>
        {backups.length === 0 ? (
          <div className="py-8 text-center text-slate-300">
            <Database size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-[11px] font-black uppercase tracking-widest">Nenhum backup encontrado</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {backups.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                <div>
                  <p className="text-[11px] font-bold text-slate-700">{b.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{new Date(b.date).toLocaleString('pt-BR')} • {b.size}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => handleRestore(b.name)}>
                    Restaurar
                  </Button>
                  <Button variant="outline" size="sm" icon={Trash2} onClick={() => handleDelete(b.name)} className="!text-red-600 hover:!bg-red-50">
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}