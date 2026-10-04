import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Plus, 
  Search, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  MessageCircle, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  X 
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [debtorOnly, setDebtorOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected Customer Detail Modal
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [movements, setMovements] = useState([]);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: '50000',
    notes: ''
  });

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadCustomers();
    loadOverdueAlerts();
  }, [search, debtorOnly]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search, debtorOnly: debtorOnly ? 'true' : 'false' }
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueAlerts = async () => {
    try {
      const res = await api.get('/customers/alerts/overdue');
      setAlerts(res.data);
    } catch (err) {
      console.error('Error cargando alertas de cta cte:', err);
    }
  };

  const handleOpenDetail = async (cust) => {
    try {
      const res = await api.get(`/customers/${cust.id}`);
      setSelectedCustomerDetail(res.data.customer);
      setMovements(res.data.movements);
    } catch (err) {
      alert('Error cargando detalle del cliente.');
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', newCustomer);
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', credit_limit: '50000', notes: '' });
      loadCustomers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar cliente.');
    }
  };

  const handleOpenPayment = (cust) => {
    setPaymentCustomer(cust);
    setPaymentAmount(cust.credit_balance.toString());
    setPaymentNotes('Abono a cuenta corriente');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentCustomer || !paymentAmount) return;

    try {
      await api.post(`/customers/${paymentCustomer.id}/payment`, {
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes
      });
      setShowPaymentModal(false);
      loadCustomers();
      if (selectedCustomerDetail && selectedCustomerDetail.id === paymentCustomer.id) {
        handleOpenDetail(paymentCustomer);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar cobro.');
    }
  };

  const handleDownloadPDF = (cust) => {
    window.open(`/api/customers/${cust.id}/pdf`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-brand-600" />
            Clientes y Cuentas Corrientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro de clientes, control automático de saldos deudores, alertas de vencimiento y reportes en PDF.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-brand-600/30 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Overdue Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
          <h3 className="text-xs font-bold text-rose-900 flex items-center mb-2">
            <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600" />
            Alertas de Cuentas Corrientes Próximas a Vencer o Vencidas ({alerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((alt) => (
              <div key={alt.id} className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{alt.customer_name}</span>
                  <span className="text-slate-500 block text-[11px]">Vence: {new Date(alt.due_date).toLocaleDateString('es-AR')}</span>
                  <span className="font-extrabold text-rose-600">${alt.amount.toLocaleString('es-AR')}</span>
                </div>
                {alt.customer_phone && (
                  <a
                    href={`https://wa.me/${alt.customer_phone.replace(/\D/g,'')}?text=Hola%20${encodeURIComponent(alt.customer_name)},%20te%20contactamos%20de%20Amore%20M%C3%ADo%20para%20recordarte%20el%20saldo%20pendiente.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, WhatsApp o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50"
          />
        </div>

        <button
          onClick={() => setDebtorOnly(!debtorOnly)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            debtorOnly ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {debtorOnly ? 'Mostrando sólo clientes con Deuda' : 'Filtrar Clientes con Deuda'}
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">WhatsApp / Teléfono</th>
                <th className="p-4">Dirección</th>
                <th className="p-4">Saldo Deudor</th>
                <th className="p-4">Límite Crédito</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">Cargando nómina de clientes...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">No se encontraron clientes registrados.</td>
                </tr>
              ) : (
                customers.map((cust) => {
                  const hasDebt = cust.credit_balance > 0;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block text-sm">{cust.name}</span>
                        {cust.email && <span className="text-slate-400 text-[11px] block">{cust.email}</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-700">{cust.phone}</span>
                          <a
                            href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{cust.address || '-'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          hasDebt ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          ${cust.credit_balance.toLocaleString('es-AR')}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        ${cust.credit_limit.toLocaleString('es-AR')}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {hasDebt && (
                          <button
                            onClick={() => handleOpenPayment(cust)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-sm"
                          >
                            Registrar Cobro
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetail(cust)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition"
                        >
                          Ver Historial
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(cust)}
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="Descargar PDF Cuenta Corriente"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail & Movement History Modal */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedCustomerDetail.name}</h3>
                <p className="text-xs text-slate-500">Historial completo de Cuenta Corriente</p>
              </div>
              <button onClick={() => setSelectedCustomerDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-brand-50/40 rounded-2xl border border-brand-100 mb-4 text-xs">
              <div>
                <span className="text-slate-500 block">Saldo Deudor Actual:</span>
                <span className="text-lg font-extrabold text-brand-600">${selectedCustomerDetail.credit_balance.toLocaleString('es-AR')}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Límite Autorizado:</span>
                <span className="text-sm font-bold text-slate-800">${selectedCustomerDetail.credit_limit.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Movimientos</h4>
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Detalle</th>
                    <th className="p-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => {
                    const isDebit = m.type === 'DEBIT';
                    return (
                      <tr key={m.id}>
                        <td className="p-3 text-slate-500">{new Date(m.created_at).toLocaleDateString('es-AR')}</td>
                        <td className="p-3 font-bold">
                          <span className={isDebit ? 'text-rose-600' : 'text-emerald-600'}>
                            {isDebit ? 'CARGO (+)' : 'PAGO (-)'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{m.notes}</td>
                        <td className={`p-3 text-right font-bold ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isDebit ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => handleDownloadPDF(selectedCustomerDetail)}
                className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <FileText className="w-4 h-4 mr-1.5" /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Alta de Nuevo Cliente</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Ej: Lucía Giménez"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+54 9 341 1234567"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="lucia@gmail.com"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Límite Crédito Cta. Cte. ($)</label>
                <input
                  type="number"
                  value={newCustomer.credit_limit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs"
                >
                  Registrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showPaymentModal && paymentCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Registrar Cobro Cta. Corriente</h3>
            <p className="text-xs text-slate-500 mb-4">Cliente: <strong>{paymentCustomer.name}</strong></p>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto a Cobrar ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className="w-full border border-brand-400 rounded-xl px-3 py-2 text-sm font-extrabold text-brand-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medio de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia Bancaria</option>
                  <option value="QR">Mercado Pago QR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas del Pago</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
