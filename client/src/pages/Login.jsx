import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PasswordChangeModal from '../components/PasswordChangeModal';
import SuperAdminModal from '../components/SuperAdminModal';
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles, Instagram } from 'lucide-react';

export default function Login() {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('vampyfz1214@gmail.com');
  const [password, setPassword] = useState('qwerty1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForcedPasswordModal, setShowForcedPasswordModal] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user.must_change_password === 1 && result.user.role !== 'SUPERADMIN') {
        setShowForcedPasswordModal(true);
      } else {
        navigate('/app/sales');
      }
    } else {
      setError(result.error);
    }
  };

  const handlePasswordChangedSuccess = () => {
    setShowForcedPasswordModal(false);
    navigate('/app/sales');
  };

  return (
    <div className="w-full h-full flex-1 bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden py-16">
      {/* Background Glow Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex rounded-xl mb-2 shadow-sm overflow-hidden">
              <img 
                src="/assets/logo_final.jpg" 
                alt="Amore Mío Logo" 
                className="h-28 w-auto object-contain"
              />
            </div>
            <p className="text-xs uppercase font-semibold text-brand-600 tracking-widest mt-2">
              Sistema de Gestión Integral
            </p>
            <div className="mt-2.5">
              <a
                href="https://instagram.com/ammoremio"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-semibold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3 py-1 rounded-full transition shadow-sm hover:scale-105"
                title="Seguinos en Instagram"
              >
                <Instagram className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
                @ammoremio
              </a>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector Rápido de Cuenta */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setEmail('vampyfz1214@gmail.com');
                setPassword('qwerty1234');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                email === 'vampyfz1214@gmail.com' 
                  ? 'bg-white text-brand-700 font-bold shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Administrador
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('martinchiacchio.seg@gmail.com');
                setPassword('Chiacchio@1938');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${
                email === 'martinchiacchio.seg@gmail.com' 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SuperAdministrador
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@amoremio.com"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-slate-50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-slate-50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note & SuperAdmin Direct Access */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center flex flex-col items-center">
            <span className="text-[11px] text-slate-400 block mb-2 font-semibold tracking-wider">
              SUPERVISIÓN TÉCNICA INDEPENDIENTE
            </span>
            <button
              type="button"
              onClick={() => setShowSuperAdminModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow border border-slate-700 hover:scale-105 active:scale-95"
              title="Abrir Portal SuperAdministrador RolΦ Studio"
            >
              <img 
                src="/assets/rolphi.jpg" 
                alt="RolΦ Studio" 
                className="h-6 w-auto object-contain rounded" 
              />
              <span>Acceso SuperAdministrador RolΦ</span>
            </button>
          </div>

        </div>
      </div>

      {/* SuperAdmin Modal */}
      {showSuperAdminModal && (
        <SuperAdminModal onClose={() => setShowSuperAdminModal(false)} />
      )}

      {/* Forced Password Modal */}
      {showForcedPasswordModal && (
        <PasswordChangeModal 
          isForced={true} 
          onClose={handlePasswordChangedSuccess} 
        />
      )}
    </div>
  );
}
