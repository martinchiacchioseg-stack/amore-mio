import React, { useState } from 'react';
import SuperAdminModal from './SuperAdminModal';
import { Heart, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);

  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* Brand info */}
          <div className="flex items-center space-x-3">
            <img 
              src="/assets/logo.jpg" 
              alt="Amore Mío" 
              className="h-8 w-8 rounded-full border border-brand-500/50"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <span className="text-white text-sm font-bold block">Amore Mío — Ropa Interior</span>
              <span className="text-slate-400 text-xs block">Para Él y Para Ella • Todos los derechos reservados © {new Date().getFullYear()}</span>
            </div>
          </div>

          {/* RolΦ Studio Producer Attribution & Discreet Superadmin link */}
          <div className="flex items-center space-x-4 text-xs">
            <span className="inline-flex items-center text-slate-400">
              Desarrollado con <Heart className="w-3.5 h-3.5 mx-1 text-brand-500 fill-brand-500" /> por 
              <button
                onClick={() => setShowSuperAdminModal(true)}
                className="text-brand-300 hover:text-brand-400 font-extrabold ml-1 tracking-wider text-sm cursor-pointer transition-colors focus:outline-none"
                title="Supervisión Técnica RolΦ"
              >
                RolΦ Studio
              </button>
            </span>
          </div>
        </div>
      </div>

      {showSuperAdminModal && (
        <SuperAdminModal onClose={() => setShowSuperAdminModal(false)} />
      )}
    </footer>
  );
}
