import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Settings, UserPlus, Shield, Percent, DollarSign, Edit3, Key, CheckCircle2 } from 'lucide-react';

export default function UsersConfig() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SELLER',
    commission_type: 'PERCENTAGE',
    commission_value: '10'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({
        name: u.name,
        email: u.email,
        password: '',
        role: u.role,
        commission_type: u.commission_type || 'PERCENTAGE',
        commission_value: u.commission_value ? u.commission_value.toString() : '10'
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: 'vendedor123',
        role: 'SELLER',
        commission_type: 'PERCENTAGE',
        commission_value: '10'
      });
    }
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, {
          name: formData.name,
          role: formData.role,
          commission_type: formData.commission_type,
          commission_value: formData.commission_value
        });
      } else {
        await api.post('/auth/users', formData);
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar usuario.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-brand-600" />
            Configuración de Personal & Comisiones
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Crea cuentas individuales para vendedores y encargados, configura su tasa de comisión fija o porcentaje.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-brand-600/30 flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Nuevo Vendedor / Encargado
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Nombre</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Rol en el Sistema</th>
                <th className="p-4">Configuración Comisión</th>
                <th className="p-4">Estado Clave Inicial</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">Cargando personal...</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'SUPERADMIN' ? 'bg-slate-900 text-white' :
                        u.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                        'bg-brand-100 text-brand-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {u.commission_type === 'PERCENTAGE' ? `${u.commission_value}% por venta` : `$${u.commission_value} fijo por venta`}
                    </td>
                    <td className="p-4">
                      {u.must_change_password === 1 ? (
                        <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                          Pendiente cambio primer login
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                          Clave activa personalizada
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenModal(u)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingUser ? 'Editar Usuario / Comisión' : 'Crear Usuario de Personal'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Camila Vendedora"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email de Ingreso *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="vendedor@amoremio.com"
                      required
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Provisoria *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      El usuario deberá cambiar esta clave al ingresar por primera vez.
                    </span>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                >
                  <option value="SELLER">VENDEDOR</option>
                  <option value="MANAGER">ENCARGADO</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo Comisión</label>
                  <select
                    value={formData.commission_type}
                    onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-2 py-1 text-xs bg-white"
                  >
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor Comisión</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_value}
                    onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-2 py-1 text-xs bg-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
