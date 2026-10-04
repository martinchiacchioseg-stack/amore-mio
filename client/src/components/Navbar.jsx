import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  Package, 
  Truck, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut, 
  Store,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Punto de Venta', path: '/app/sales', icon: ShoppingCart, roles: ['ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN'] },
    { label: 'Productos', path: '/app/products', icon: Package, roles: ['ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN'] },
    { label: 'Clientes & Cta Cte', path: '/app/customers', icon: Users, roles: ['ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN'] },
    { label: 'Caja & Rendición', path: '/app/cash', icon: Wallet, roles: ['ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN'] },
    { label: 'Proveedores', path: '/app/suppliers', icon: Truck, roles: ['ADMIN', 'MANAGER', 'SUPERADMIN'] },
    { label: 'Estadísticas', path: '/app/dashboard', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'SUPERADMIN'] },
    { label: 'Usuarios / Config', path: '/app/users', icon: Settings, roles: ['ADMIN', 'SUPERADMIN'] },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-950 border-b border-brand-900/50 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-0.5 rounded-full group-hover:scale-105 transition-transform">
                <img 
                  src="/assets/logo_final.jpg" 
                  alt="Amore Mío Logo" 
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white block leading-tight group-hover:text-brand-300 transition-colors">
                  AMORE MÍO
                </span>
                <span className="text-[10px] sm:text-xs uppercase font-medium tracking-widest text-brand-500 block">
                  Ropa Interior
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex space-x-1 lg:space-x-2">
              {navItems
                .filter(item => item.roles.includes(user.role))
                .map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        isActive
                          ? 'bg-brand-900/40 text-brand-300 font-bold border border-brand-800'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-1.5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
          )}

          {/* User badge & Actions */}
          <div className="flex items-center space-x-3">
            <Link 
              to="/catalogo" 
              target="_blank" 
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition hidden sm:inline-flex"
              title="Ver Catálogo Online Público"
            >
              <Store className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Catálogo
            </Link>
            
            <a 
              href="/assets/Manual_Amore_Mio.pdf" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-brand-300 bg-brand-900/30 hover:bg-brand-900/60 border border-brand-700/50 rounded-lg transition"
              title="Manual de Usuario PDF"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:mr-1 text-brand-400" />
              <span className="hidden sm:inline">Manual</span>
            </a>

            {user ? (
              <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-white block leading-tight">{user.name}</span>
                  <span className="text-[10px] text-brand-400 uppercase font-semibold block">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition"
              >
                Ingreso Personal
              </Link>
            )}

            {/* Mobile menu toggle */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 ml-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <div className="mb-4 pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800 block">{user.name}</span>
              <span className="text-[10px] text-brand-600 uppercase font-semibold block">{user.role}</span>
            </div>
            
            {navItems
              .filter(item => item.roles.includes(user.role))
              .map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 text-sm font-semibold rounded-xl transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-bold border-l-4 border-brand-600'
                        : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 text-brand-600" />
                    {item.label}
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </header>
  );
}
