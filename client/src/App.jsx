import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import PublicCatalog from './pages/PublicCatalog';
import Login from './pages/Login';
import SalesPOS from './pages/SalesPOS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import CashRegister from './pages/CashRegister';
import Suppliers from './pages/Suppliers';
import Dashboard from './pages/Dashboard';
import UsersConfig from './pages/UsersConfig';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/sales" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const isPublicPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isPublicPage && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* 1. Ingreso Directo al Sistema de Gestión del Negocio */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* 2. Catálogo Online Público para Clientes */}
          <Route path="/catalogo" element={<PublicCatalog />} />

          {/* 3. Panel de Gestión Interno (Protegido por Rol) */}
          <Route path="/app/sales" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN']}>
              <SalesPOS />
            </ProtectedRoute>
          } />

          <Route path="/app/products" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN']}>
              <Products />
            </ProtectedRoute>
          } />

          <Route path="/app/customers" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN']}>
              <Customers />
            </ProtectedRoute>
          } />

          <Route path="/app/cash" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SUPERADMIN']}>
              <CashRegister />
            </ProtectedRoute>
          } />

          <Route path="/app/suppliers" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SUPERADMIN']}>
              <Suppliers />
            </ProtectedRoute>
          } />

          <Route path="/app/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SUPERADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/app/users" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
              <UsersConfig />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}
