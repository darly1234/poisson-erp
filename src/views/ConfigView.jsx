import React, { useEffect } from 'react';
import { Database, User, Layout, PlusSquare, ArrowUp, ArrowDown, Edit3, Trash2, ChevronLeft, Fingerprint, Eye, EyeOff, BarChart3, X, Info, Save, Cloud } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import BackupPanel from './BackupPanel';
import FormLayoutBuilder from '../components/layout/FormLayoutBuilder';
import { FIELD_TYPES } from '../constants';
import { normalizeMetadata } from '../utils/metadataMigration';

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
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
              <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-amber-200">DA</div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Darly</h3>
                <p className="text-xs text-slate-400 font-medium italic">Sênior Admin • ID: Poisson-000</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">Nome de Exibição</label>
                <input className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" defaultValue="Darly" onKeyDown={handleInputInteraction} />
              </div>
            </div>
            <Button size="md" variant="primary" icon={Save}>Atualizar Perfil</Button>
          </div>
        )}

        {activeConfigTab === 'backup' && (
          <BackupPanel />
        )}

      </div>
    </Card>
  </div>
);

export default ConfigView;