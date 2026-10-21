import React, { useState } from 'react';
import api from '../services/api';
import { 
  Shield, 
  Server, 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Download,
  MessageCircle,
  Calendar,
  Award,
  ShieldCheck,
  Clock,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function SuperAdminModal({ onClose }) {
  const [email, setEmail] = useState('martinchiacchio.seg@gmail.com');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagLogs, setDiagLogs] = useState([]);
  const [diagSuccess, setDiagSuccess] = useState(null);
  const [tempToken, setTempToken] = useState(null);

  // License Grant State
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantDays, setGrantDays] = useState(90);
  const [grantPlanName, setGrantPlanName] = useState('Plan Trimestral (90 Días)');
  const [grantOverride, setGrantOverride] = useState(true);
  const [grantNotes, setGrantNotes] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

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

      const token = loginRes.data.token;
      setTempToken(token);
      const healthRes = await api.get('/superadmin/health', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHealthData(healthRes.data);
      setAuthenticated(true);
    } catch (err) {
      const apiError = err.response?.data?.error;
      if (apiError) {
        setError(apiError + (err.response?.data?.detail ? ` (${err.response.data.detail})` : ''));
      } else if (err.response) {
        setError(`El servidor no respondió correctamente (código ${err.response.status}). El backend no está publicado o no puede conectarse a la base de datos.`);
      } else {
        setError('No hay conexión con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPredefinedPlan = (days, name) => {
    setGrantDays(days);
    setGrantPlanName(name);
  };

  const handleGrantLicense = async (e) => {
    e.preventDefault();
    setGrantLoading(true);
    try {
      await api.post(
        '/superadmin/license/extend',
        {
          days: Number(grantDays),
          override: grantOverride,
          planName: grantPlanName,
          notes: grantNotes
        },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      const hr = await api.get('/superadmin/health', {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      setHealthData(hr.data);
      setShowGrantForm(false);
      alert(`¡Licencia otorgada exitosamente! Se generó la tarjeta verde oficial de RolΦ Studio por ${grantDays} días.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al otorgar licencia.');
    } finally {
      setGrantLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/superadmin/license/pdf?token=${tempToken}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const p = healthData?.producer;
    if (!p) return;
    const text = `🛡️ *COMPROBANTE OFICIAL DE SUSCRIPCIÓN & LICENCIA*
*RolΦ Studio - Supervisión Técnica Independiente*
-------------------------------------------
👤 *Cliente:* Amore Mío Lencería
📋 *Plan Otorgado:* ${p.planName || 'Plan Comercial RolΦ Studio'}
⏳ *Días Otorgados:* ${p.daysGranted || 30} días
📅 *Fecha de Emisión:* ${p.grantedAt || 'Hoy'}
🗓️ *Fecha de Vencimiento:* ${p.expirationDate || 'Vigente'}
⏱️ *Días Restantes:* ${p.daysRemaining || 0} días
🔑 *Certificado Nº:* ${p.licenseCode || 'ROLPHI-LIC-2026'}
-------------------------------------------
✅ Tu sistema está activo y funcionando normalmente.
📄 Podés ver tu tarjeta verde oficial y descargar tu comprobante desde la Configuración de Administrador en el programa.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRunDiagnostics = async () => {
    setDiagRunning(true);
    setDiagLogs([]);
    setDiagSuccess(null);
    try {
      const res = await api.post('/superadmin/diagnostics/run', {}, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      setDiagLogs(res.data.logs);
      setDiagSuccess(true);
    } catch (err) {
      if (err.response?.data?.logs) {
        setDiagLogs(err.response.data.logs);
      } else {
        setDiagLogs(['ERROR CRITICO: Error de conexión.']);
      }
      setDiagSuccess(false);
    } finally {
      setDiagRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <img src="/assets/rolphi.jpg" alt="RolΦ Studio" className="h-12 w-auto object-contain rounded-xl border border-slate-700" />
          <div>
            <h3 className="text-base font-bold text-white flex items-center">
              Supervisión Técnica <span className="text-brand-400 ml-1">RolΦ Studio</span>
            </h3>
            <p className="text-xs text-slate-400">Portal de diagnóstico, soporte y asignación de licencias</p>
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
              {loading ? 'Verificando...' : 'Acceder a Supervisión RolΦ'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-emerald-950/40 border border-emerald-700/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Base de Datos LibSQL: ONLINE</span>
              </span>
              <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                v{healthData?.producer?.version}
              </span>
            </div>

            {/* TARJETA VERDE OFICIAL ROLPHI */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 border-2 border-emerald-500/50 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50 mb-3">
                <div className="flex items-center space-x-2.5">
                  <img src="/assets/rolphi.jpg" alt="RolΦ Studio" className="h-9 w-auto rounded-lg border border-emerald-400/40" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                      Tarjeta Oficial de Suscripción
                    </h4>
                    <span className="text-[10px] text-emerald-300">RolΦ Studio • Supervisión Técnica</span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                  ACTIVA
                </span>
              </div>

              {/* Contador y Plan */}
              <div className="grid grid-cols-2 gap-2 mb-3 bg-black/20 p-2.5 rounded-xl border border-emerald-500/20 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-300 block">Plan Asignado:</span>
                  <span className="font-bold text-white text-[11px] truncate block">{healthData?.producer?.planName || 'Plan Comercial'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-300 block">Contador de Días:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{healthData?.producer?.daysRemaining || 0} días restantes</span>
                </div>
                <div className="mt-1">
                  <span className="text-[10px] text-slate-400 block">Vencimiento:</span>
                  <span className="font-semibold text-slate-200 text-[11px]">{healthData?.producer?.expirationDate || 'Indefinida'}</span>
                </div>
                <div className="mt-1 text-right">
                  <span className="text-[10px] text-slate-400 block">Certificado Serial:</span>
                  <span className="font-mono text-[10px] text-emerald-300">{healthData?.producer?.licenseCode || 'ROLPHI-LIC'}</span>
                </div>
              </div>

              {/* Botones de acción: Descargar y Enviar WhatsApp */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
                  title="Descargar Tarjeta en PDF"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Descargar Tarjeta PDF
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-emerald-100 rounded-xl text-xs font-bold transition border border-emerald-600/50 shadow"
                  title="Enviar comprobante por WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Enviar por WhatsApp
                </button>
              </div>
            </div>

            {/* SECCIÓN ASIGNACIÓN / RENOVACIÓN DE PLAN */}
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                    Otorgar Nueva Licencia / Cambiar Plan
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Completá los días según el plan para emitir la nueva tarjeta verde al administrador.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGrantForm(!showGrantForm)}
                  className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition"
                >
                  {showGrantForm ? 'Ocultar Formulario' : '+ Otorgar Días'}
                </button>
              </div>

              {showGrantForm && (
                <form onSubmit={handleGrantLicense} className="space-y-3 pt-3 border-t border-slate-700/60">
                  {/* Botones de planes predefinidos */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      Seleccionar Plan Predefinido:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectPredefinedPlan(30, 'Plan Mensual (30 Días)')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          grantDays === 30 ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        30 Días
                        <span className="block text-[9px] font-normal opacity-80">Mensual</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPredefinedPlan(90, 'Plan Trimestral (90 Días)')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          grantDays === 90 ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        90 Días
                        <span className="block text-[9px] font-normal opacity-80">Trimestral</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPredefinedPlan(180, 'Plan Semestral (180 Días)')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          grantDays === 180 ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        180 Días
                        <span className="block text-[9px] font-normal opacity-80">Semestral</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPredefinedPlan(365, 'Plan Anual (365 Días)')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          grantDays === 365 ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        365 Días
                        <span className="block text-[9px] font-normal opacity-80">Anual</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Días a Otorgar *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={grantDays}
                        onChange={(e) => setGrantDays(Number(e.target.value))}
                        required
                        className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nombre del Plan *
                      </label>
                      <input
                        type="text"
                        value={grantPlanName}
                        onChange={(e) => setGrantPlanName(e.target.value)}
                        required
                        placeholder="Ej: Plan Trimestral (90 Días)"
                        className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Modo de Aplicación:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className={`flex items-center p-2 rounded-xl border cursor-pointer ${grantOverride ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        <input
                          type="radio"
                          name="grantOverride"
                          checked={grantOverride}
                          onChange={() => setGrantOverride(true)}
                          className="mr-2"
                        />
                        <span>Fijar desde hoy (Reemplazar contador)</span>
                      </label>

                      <label className={`flex items-center p-2 rounded-xl border cursor-pointer ${!grantOverride ? 'bg-brand-950/40 border-brand-600 text-brand-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        <input
                          type="radio"
                          name="grantOverride"
                          checked={!grantOverride}
                          onChange={() => setGrantOverride(false)}
                          className="mr-2"
                        />
                        <span>Sumar a fecha actual (+ Días)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Observaciones / Notas (Opcional)
                    </label>
                    <input
                      type="text"
                      value={grantNotes}
                      onChange={(e) => setGrantNotes(e.target.value)}
                      placeholder="Ej: Renovación acordada vía WhatsApp - Transferencia"
                      className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGrantForm(false)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={grantLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {grantLoading ? 'Otorgando...' : 'Otorgar Licencia & Emitir Tarjeta'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Registros del sistema */}
            <div className="bg-slate-850 rounded-2xl p-3.5 border border-slate-700/60">
              <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Métricas del Sistema</h4>
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

            {/* Diagnóstico Integral */}
            <div className="pt-1">
              <button
                onClick={handleRunDiagnostics}
                disabled={diagRunning}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition disabled:opacity-50 border border-slate-700"
              >
                {diagRunning ? 'Ejecutando Diagnóstico E2E...' : 'Correr Diagnóstico Integral E2E'}
              </button>

              {diagLogs.length > 0 && (
                <div className={`mt-3 p-3 rounded-xl border font-mono text-[10px] h-28 overflow-y-auto ${diagSuccess ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300' : 'bg-red-950/20 border-red-800 text-red-300'}`}>
                  {diagLogs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 text-center mt-2">
              Supervisión técnica independiente por RolΦ Studio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
