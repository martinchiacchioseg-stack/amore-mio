import React, { useState } from 'react';
import api from '../services/api';
import { Shield, Server, Database, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SuperAdminModal({ onClose }) {
  const [email, setEmail] = useState('martinchiacchio@gmail.com');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuperLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginRes = await api.post('/auth/login', { email, password });
      if (loginRes.data.user.role !== 'SUPERADMIN') {
        setError('Acceso denegado. Este portal es exclusivo para el equipo técnico de RolΦ Studio.');
        setLoading(false);
        return;
      }

      const tempToken = loginRes.data.token;
      const healthRes = await api.get('/superadmin/health', {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      setHealthData(healthRes.data);
      setAuthenticated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales de SuperAdministrador inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 bg-brand-600/20 text-brand-400 rounded-xl border border-brand-500/30 font-extrabold text-xl font-mono">
            RolΦ
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center">
              Supervisión Técnica <span className="text-brand-400 ml-1">RolΦ Studio</span>
            </h3>
            <p className="text-xs text-slate-400">Portal de diagnóstico y soporte independiente</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!authenticated ? (
          <form onSubmit={handleSuperLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email RolΦ SuperAdmin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña Máster</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acceder a Diagnóstico Técnico'}
            </button>
          </form>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="p-3 bg-emerald-950/40 border border-emerald-700/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Base de Datos: ONLINE</span>
              </span>
              <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                v{healthData?.producer?.version}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 block mb-1 flex items-center">
                  <Server className="w-3.5 h-3.5 mr-1 text-brand-400" /> Entorno Node
                </span>
                <span className="font-mono font-bold text-white text-xs block">{healthData?.system?.nodeVersion}</span>
                <span className="text-[10px] text-slate-400">Uptime: {Math.floor(healthData?.system?.uptimeSeconds / 60)} min</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 block mb-1 flex items-center">
                  <Database className="w-3.5 h-3.5 mr-1 text-brand-400" /> Productora
                </span>
                <span className="font-semibold text-brand-300 text-xs block">{healthData?.producer?.studio}</span>
                <span className="text-[10px] text-slate-400">{healthData?.producer?.contact}</span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
              <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Registros del Sistema</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between border-b border-slate-700/50 pb-1">
                  <span className="text-slate-400">Usuarios Totales:</span>
                  <span className="font-bold text-white">{healthData?.database?.tables?.users}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/50 pb-1">
                  <span className="text-slate-400">Productos Registrados:</span>
                  <span className="font-bold text-white">{healthData?.database?.tables?.products}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/50 pb-1">
                  <span className="text-slate-400">Ventas Procesadas:</span>
                  <span className="font-bold text-white">{healthData?.database?.tables?.sales}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/50 pb-1">
                  <span className="text-slate-400">Clientes Frecuentes:</span>
                  <span className="font-bold text-white">{healthData?.database?.tables?.customers}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Supervisión técnica aislada por RolΦ Studio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
