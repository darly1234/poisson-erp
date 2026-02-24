import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

const DeleteConfirmModal = ({ confirmModal, setConfirmModal, executeDelete }) => (
  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle size={32} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Confirmar Exclusão?</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Está prestes a eliminar{' '}
          <span className="font-bold text-red-600">"{confirmModal.label}"</span>.
          Esta ação é irreversível e removerá todos os dados associados.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => setConfirmModal({ show: false, type: null, id: null, parentId: null, label: '' })}
        >
          Cancelar
        </Button>
        <Button variant="danger" size="md" onClick={executeDelete}>
          Sim, Eliminar
        </Button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmModal;
