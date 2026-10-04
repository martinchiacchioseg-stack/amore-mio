import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PasswordChangeModal from '../components/PasswordChangeModal';
import SuperAdminModal from '../components/SuperAdminModal';
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

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
      if (result.user.must_change_password === 1) {
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
            <div className="inline-flex p-3 bg-brand-50 rounded-2xl border border-brand-100 mb-4 shadow-sm">
              <img 
                src="/assets/logo_final.jpg" 
                alt="Amore Mío Logo" 
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-contain bg-white"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AMORE MÍO
            </h2>
            <p className="text-xs uppercase font-semibold text-brand-600 tracking-widest mt-1">
              Sistema de Gestión Integral
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center flex flex-col items-center">
            <span className="text-[11px] text-slate-400 block mb-3 font-semibold tracking-wider">
              DESARROLLADO POR
            </span>
            <button
              type="button"
              onClick={() => setShowSuperAdminModal(true)}
              className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
              title="Acceso SuperAdministrador"
            >
              <img 
                src="/assets/rolphi.jpg" 
                alt="RolΦ Studio" 
                className="h-10 w-auto object-contain rounded opacity-90 hover:opacity-100 transition-opacity cursor-pointer" 
              />
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
