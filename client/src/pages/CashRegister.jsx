import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Wallet, 
  Banknote, 
  CreditCard, 
  QrCode, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  FileText, 
  Plus, 
  UserCheck, 
  DollarSign 
} from 'lucide-react';

export default function CashRegister() {
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSeller, setSelectedSeller] = useState('');
  
  // Date filters (defaults to today)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Manual Movement Modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveType, setMoveType] = useState('EXPENSE');
  const [moveAmount, setMoveAmount] = useState('');
  const [moveMethod, setMoveMethod] = useState('CASH');
  const [moveDesc, setMoveDesc] = useState('');

  useEffect(() => {
    loadSummary();
    loadMovements();
    loadSellers();
  }, [startDate, endDate]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cash/summary', {
        params: { startDate, endDate }
      });
      setSummary(res.data);
    } catch (err) {
      console.error('Error al cargar resumen de caja:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const res = await api.get('/cash/movements', {
        params: { startDate, endDate }
      });
      setMovements(res.data);
    } catch (err) {
      console.error('Error al cargar movimientos de caja:', err);
    }
  };

  const loadSellers = async () => {
    try {
      const res = await api.get('/auth/users');
      setSellers(res.data.filter(u => u.role === 'SELLER' || u.role === 'ADMIN'));
    } catch (err) {
      console.error('Error al cargar vendedores:', err);
    }
  };

  const handleCreateManualMove = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash/movements', {
        type: moveType,
        amount: Number(moveAmount),
        payment_method: moveMethod,
        category: 'MANUAL',
        description: moveDesc
      });
      setShowMoveModal(false);
      setMoveAmount('');
      setMoveDesc('');
      loadSummary();
      loadMovements();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar movimiento.');
    }
  };

  const handleDownloadSellerSettlementPDF = () => {
    if (!selectedSeller) {
      alert('Por favor selecciona un vendedor para generar el informe de rendición.');
      return;
    }
    window.open(`/api/cash/settlement/seller/${selectedSeller}/pdf?startDate=${startDate}&endDate=${endDate}&token=${localStorage.getItem('amoremio_token')}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Wallet className="w-6 h-6 mr-2 text-brand-600" />
            Caja Diaria y Rendición por Vendedor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Desglose automático por medio de pago (Efectivo/Transferencia/QR), costo reposición de mercadería, comisiones y ganancia real.
          </p>
        </div>

        <button
          onClick={() => setShowMoveModal(true)}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-brand-600/30 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Ingreso / Egreso Manual
        </button>
      </div>

      {/* Date Filter & Settlement Trigger Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs w-full md:w-auto">
          <span className="font-bold text-slate-700">Período:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-bold"
          />
          <span className="text-slate-400">hasta</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-bold"
          />
        </div>

        {/* Seller Settlement PDF Box */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 font-bold text-slate-800 outline-none"
          >
            <option value="">-- Seleccionar Vendedor --</option>
            {sellers.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
            ))}
          </select>

          <button
            onClick={handleDownloadSellerSettlementPDF}
            className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold rounded-xl text-xs transition flex items-center whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-1 text-brand-600" />
            Descargar Rendición PDF
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Income by Payment Method Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Banknote className="w-4 h-4 mr-1.5 text-emerald-600" />
              Ingresos por Medio de Pago
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="font-semibold text-emerald-900 flex items-center">
                  <Banknote className="w-3.5 h-3.5 mr-1" /> Efectivo
                </span>
                <span className="font-extrabold text-emerald-700">${summary.incomeByMethod.CASH.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-xl border border-blue-100">
                <span className="font-semibold text-blue-900 flex items-center">
                  <CreditCard className="w-3.5 h-3.5 mr-1" /> Transferencia
                </span>
                <span className="font-extrabold text-blue-700">${summary.incomeByMethod.TRANSFER.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center p-2 bg-purple-50 rounded-xl border border-purple-100">
                <span className="font-semibold text-purple-900 flex items-center">
                  <QrCode className="w-3.5 h-3.5 mr-1" /> Mercado QR
                </span>
                <span className="font-extrabold text-purple-700">${summary.incomeByMethod.QR.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total Ingresado:</span>
              <span className="text-emerald-600">${summary.totalIncome.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Sales Financial Breakdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-brand-600" />
              Desglose Financiero de Ventas
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded-xl border border-amber-100">
                <span className="font-semibold text-amber-900">Costo Reposición Mercadería</span>
                <span className="font-extrabold text-amber-700">${summary.salesBreakdown.totalReplacementCost.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center p-2 bg-purple-50 rounded-xl border border-purple-100">
                <span className="font-semibold text-purple-900">Comisiones Vendedores</span>
                <span className="font-extrabold text-purple-700">${summary.salesBreakdown.totalCommissions.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="font-semibold text-emerald-900">Ganancia Real Neta</span>
                <span className="font-extrabold text-emerald-700">${summary.salesBreakdown.totalNetProfit.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Ventas Totales:</span>
              <span className="text-brand-600">${summary.salesBreakdown.totalSales.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Net Cash Balance */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block mb-1">
                Balance Neto de Caja
              </span>
              <span className="text-3xl font-extrabold text-white">
                ${(summary.totalIncome - summary.totalExpenses).toLocaleString('es-AR')}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Ingresos Brutos:</span>
                <span className="text-emerald-400 font-bold">+${summary.totalIncome.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Egresos Manuales:</span>
                <span className="text-rose-400 font-bold">-${summary.totalExpenses.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Cash Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Últimos Movimientos de Caja</h3>
          <span className="text-xs text-slate-400">{movements.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Fecha / Hora</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Medio de Pago</th>
                <th className="p-3.5">Descripción</th>
                <th className="p-3.5">Usuario</th>
                <th className="p-3.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => {
                const isIncome = m.type === 'INCOME';
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(m.created_at).toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isIncome ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {isIncome ? 'INGRESO' : 'EGRESO'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{m.payment_method}</td>
                    <td className="p-3.5 text-slate-800">{m.description}</td>
                    <td className="p-3.5 text-slate-500">{m.seller_name || 'Sistema'}</td>
                    <td className={`p-3.5 text-right font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isIncome ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Movement Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Registrar Movimiento Manual de Caja</h3>
            <form onSubmit={handleCreateManualMove} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveType('INCOME')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      moveType === 'INCOME' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    INGRESO (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveType('EXPENSE')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      moveType === 'EXPENSE' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    EGRESO (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(e.target.value)}
                  placeholder="Ej: 2500"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medio de Pago</label>
                <select
                  value={moveMethod}
                  onChange={(e) => setMoveMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 outline-none"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="QR">Mercado QR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Motivo *</label>
                <input
                  type="text"
                  value={moveDesc}
                  onChange={(e) => setMoveDesc(e.target.value)}
                  placeholder="Ej: Gastos menores de limpieza"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
