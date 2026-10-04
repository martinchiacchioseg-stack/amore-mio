import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Award,
  Calendar
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando métricas y estadísticas de Amore Mío...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-brand-600" />
            Tablero de Reportes & Estadísticas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Resumen de rendimiento comercial, ranking de productos más vendidos y comparativa mensual.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Ventas de Hoy</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 block">
              ${data.salesToday.total.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {data.salesToday.count} operaciones registradas hoy
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Deuda Cta. Corriente</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-rose-600 block">
              ${data.totalCreditBalance.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Pendiente por cobrar a clientes
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Clientes Registrados</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 block">
              {data.customersCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Base de datos activa
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Alertas de Stock</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-amber-600 block">
              {data.lowStockCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Productos cerca del mínimo
            </span>
          </div>
        </div>
      )}

      {/* Grid: Top Products & Top Customers */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Selling Products */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Award className="w-4 h-4 mr-1.5 text-brand-600" />
              Top 5 Productos Más Vendidos
            </h3>

            <div className="space-y-3">
              {data.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-slate-400 text-[10px]">CÓD: {p.code}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-brand-600 block">{p.total_qty} unidades</span>
                    <span className="text-slate-500 text-[10px]">${p.total_amount.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Purchasing Customers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-emerald-600" />
              Clientes Destacados con Más Compras
            </h3>

            <div className="space-y-3">
              {data.topCustomers.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-slate-400 text-[10px]">{c.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-700 block">${c.total_spent.toLocaleString('es-AR')}</span>
                    <span className="text-slate-500 text-[10px]">{c.purchases_count} compras efectuadas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Monthly Comparison */}
      {data && data.monthlySales && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-brand-600" />
            Evolución Mensual de Ventas (Últimos Meses)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {data.monthlySales.map((m, idx) => (
              <div key={idx} className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 text-center">
                <span className="text-xs font-bold text-brand-800 block mb-1">{m.month}</span>
                <span className="text-base font-extrabold text-brand-600 block">${m.total.toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500 block mt-1">{m.count} ventas</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
