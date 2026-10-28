import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  CheckCircle,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  Search,
} from 'lucide-react';
import { storage } from '../../../services/storage';
import { Personal } from '../../../types';

interface PersonalSubmodulesProps {
  moduleId: string;
  onRefresh?: () => void;
}

export const PersonalSubmodules: React.FC<PersonalSubmodulesProps> = ({ moduleId, onRefresh }) => {
  const [, setTick] = useState(0);
  const forceUpdate = () => {
    setTick((t) => t + 1);
    if (onRefresh) onRefresh();
  };

  const personalList = storage.getPersonal();
  const formatMoney = (n: number) => `S/ ${(+n || 0).toFixed(2)}`;

  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [cargo, setCargo] = useState('Mozo');
  const [sueldo, setSueldo] = useState<number>(1400);
  const [telefono, setTelefono] = useState('');
  const [ingreso, setIngreso] = useState(new Date().toISOString().slice(0, 10));

  const handleGuardarPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !dni.trim()) {
      alert('Ingresa el nombre y DNI del colaborador.');
      return;
    }

    const nuevo: Personal = {
      id: editId || `per-${Date.now()}`,
      nombre: nombre.trim(),
      dni: dni.trim(),
      cargo,
      sueldo,
      telefono: telefono.trim() || '984000000',
      ingreso,
    };

    storage.savePersonal(nuevo);
    setEditId(null);
    setNombre('');
    setDni('');
    setTelefono('');
    forceUpdate();
    alert(`✔ Colaborador "${nuevo.nombre}" guardado con éxito.`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700">
        <div>
          <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> Administración de Personal & Roles Operativos
          </h2>
          <p className="text-xs text-sky-300">
            Padrón de mozos de salón, cocineros, cajeros y administradores con control salarial y turnos
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleGuardarPersonal}
        className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3"
      >
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Nombre Completo</label>
          <input
            type="text"
            required
            placeholder="Ej. Yosuki Tacuri Quispe"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">DNI (8 dígitos)</label>
          <input
            type="text"
            required
            maxLength={8}
            placeholder="72819201"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Cargo / Rol</label>
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="Mozo">Mozo de Salón</option>
            <option value="Cocinero">Cocinero / Chef</option>
            <option value="Cajero">Cajero de Turno</option>
            <option value="Bartender">Bartender</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Sueldo Base (S/)</label>
          <input
            type="number"
            step="50"
            value={sueldo}
            onChange={(e) => setSueldo(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Teléfono / WhatsApp</label>
          <input
            type="tel"
            placeholder="984..."
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
        </div>

        <div className="sm:col-span-2 md:col-span-6 flex justify-end gap-2 mt-1">
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setNombre('');
                setDni('');
                setTelefono('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{editId ? 'Actualizar Colaborador' : 'Registrar Colaborador'}</span>
          </button>
        </div>
      </form>

      {/* Roster de Personal */}
      <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <th className="p-3">Colaborador</th>
              <th className="p-3">DNI</th>
              <th className="p-3">Cargo / Rol</th>
              <th className="p-3 text-right">Sueldo Base</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Fecha Ingreso</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {personalList.map((p) => {
              const isMozo = p.cargo?.toLowerCase().includes('mozo');
              const isCocina = p.cargo?.toLowerCase().includes('cocin') || p.cargo?.toLowerCase().includes('chef');
              const isCaja = p.cargo?.toLowerCase().includes('caj');

              let badgeColor = 'bg-sky-950 text-sky-400 border-sky-500/40';
              if (isMozo) badgeColor = 'bg-amber-950 text-amber-400 border-amber-500/40';
              if (isCocina) badgeColor = 'bg-rose-950 text-rose-400 border-rose-500/40';
              if (isCaja) badgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-500/40';

              return (
                <tr key={p.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-400">
                      {p.nombre.slice(0, 1)}
                    </span>
                    <span>{p.nombre}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-300">{p.dni}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badgeColor}`}>
                      {p.cargo}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-amber-300">{formatMoney(p.sueldo)}</td>
                  <td className="p-3 text-slate-300 font-mono">{p.telefono || 'Sin teléfono'}</td>
                  <td className="p-3 text-slate-400 font-mono">{p.ingreso}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      Activo
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditId(p.id);
                          setNombre(p.nombre);
                          setDni(p.dni);
                          setCargo(p.cargo);
                          setSueldo(p.sueldo);
                          setTelefono(p.telefono || '');
                        }}
                        className="p-1 rounded bg-slate-800 text-sky-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al colaborador "${p.nombre}"?`)) {
                            storage.deletePersonal(p.id);
                            forceUpdate();
                          }
                        }}
                        className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
