import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  ShoppingCart, 
  Search, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Banknote,
  Percent,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export default function SalesPOS() {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  
  // Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('CASH_ON_HAND'); // CASH_ON_HAND or CREDIT_ACCOUNT
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, TRANSFER, QR, CREDIT_ACCOUNT
  const [discount, setDiscount] = useState(0);
  const [dueDays, setDueDays] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Inline Customer Creation
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', document_number: '' });
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert(`El producto "${product.name}" no tiene stock disponible.`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity + 1 > product.stock) {
        alert(`No puedes agregar más unidades que el stock disponible (${product.stock}).`);
        return;
      }
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        product_id: product.id,
        code: product.code,
        name: product.name,
        unit_sale_price: Number(product.sale_price),
        unit_cost_price: Number(product.cost_price),
        quantity: 1,
        max_stock: product.stock
      }]);
    }
  };

  const updateQuantity = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    setCart(cart.map(item => {
      if (item.product_id === productId) {
        if (qty > item.max_stock) {
          alert(`Stock máximo disponible: ${item.max_stock}`);
          return item;
        }
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Live Math Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.unit_sale_price * item.quantity), 0);
  const totalReplacementCost = cart.reduce((acc, item) => acc + (item.unit_cost_price * item.quantity), 0);
  const totalSale = Math.max(0, subtotal - (Number(discount) || 0));

  let calculatedCommission = 0;
  if (user) {
    if (user.commission_type === 'PERCENTAGE') {
      calculatedCommission = (totalSale * Number(user.commission_value || 0)) / 100;
    } else {
      calculatedCommission = Number(user.commission_value || 0);
    }
  }

  const estimatedNetProfit = totalSale - totalReplacementCost - calculatedCommission;

  const handleCompleteSale = async () => {
    setError('');
    if (cart.length === 0) {
      setError('Debes agregar al menos un producto al carrito.');
      return;
    }

    if (paymentType === 'CREDIT_ACCOUNT' && !selectedCustomerId) {
      setError('Para ventas a Cuenta Corriente debes seleccionar obligatoriamente un cliente.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/sales', {
        customer_id: selectedCustomerId || null,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_sale_price: item.unit_sale_price
        })),
        payment_type: paymentType,
        payment_method: paymentType === 'CREDIT_ACCOUNT' ? 'CREDIT_ACCOUNT' : paymentMethod,
        discount: Number(discount) || 0,
        due_days: Number(dueDays) || 30
      });

      setLastCompletedSale(res.data.sale);
      setCart([]);
      setSelectedCustomerId('');
      setDiscount(0);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la venta.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.code.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    try {
      const res = await api.post('/customers', newCustomer);
      const createdId = res.data.id;
      await loadCustomers();
      setSelectedCustomerId(createdId);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', phone: '', email: '', document_number: '' });
    } catch (err) {
      alert('Error al crear cliente: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      
      {/* Minimal Title Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-50 to-white p-3 md:p-4 rounded-xl border border-brand-100 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 bg-brand-100 text-brand-600 rounded-lg mr-3">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-brand-950 leading-none">Punto de Venta</h1>
            <p className="text-[10px] text-brand-700 font-medium mt-1 uppercase tracking-wider">Módulo de Facturación</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-2 text-right">
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-brand-600 block leading-tight">Vendedor en Caja</span>
              <span className="text-xs font-extrabold text-brand-900">{user.name}</span>
            </div>
            <div className="bg-white border border-brand-200 px-2 py-1 rounded-lg">
              <span className="text-[9px] text-brand-500 block leading-none font-bold">COMISIÓN</span>
              <span className="text-xs text-brand-800 font-bold">{user.commission_type === 'PERCENTAGE' ? `${user.commission_value}%` : `$${user.commission_value}`}</span>
            </div>
          </div>
        )}
      </div>

      {lastCompletedSale && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">¡Venta Registrada Exitosamente! #{lastCompletedSale.sale_number}</h4>
              <p className="text-xs text-emerald-700">
                Total: <strong>${lastCompletedSale.total.toLocaleString('es-AR')}</strong> | 
                Comisión: <strong>${lastCompletedSale.seller_commission.toLocaleString('es-AR')}</strong> | 
                Costo Reposición: <strong>${lastCompletedSale.replacement_cost.toLocaleString('es-AR')}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href={`/api/sales/${lastCompletedSale.id}/pdf?token=${localStorage.getItem('amoremio_token')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
            >
              Descargar Ticket
            </a>
            <button 
              onClick={() => setLastCompletedSale(null)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* POS Main Content: Single Column Invoice Style */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        
        {/* Top Controls: Search & Select Customer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-100">
          
          {/* Customer Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center">
                <User className="w-4 h-4 mr-1 text-brand-600" />
                Cliente de la Venta
              </label>
              <button 
                type="button" 
                onClick={() => setShowCustomerModal(true)}
                className="text-[10px] text-brand-600 font-bold hover:text-brand-800 flex items-center bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200"
              >
                <Plus className="w-3 h-3 mr-0.5" /> Nuevo
              </button>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">-- Consumidor Final (Venta Anónima) --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.credit_balance > 0 ? `(Deuda Cta.Cte: $${c.credit_balance.toLocaleString('es-AR')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Product Search Add */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <Search className="w-4 h-4 mr-1 text-brand-600" />
              Buscar y Agregar Producto
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el código o nombre..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              />
              {searchProduct && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">No hay resultados</div>
                  ) : (
                    filteredProducts.map(prod => {
                      const inStock = prod.stock > 0;
                      return (
                        <div 
                          key={prod.id}
                          onClick={() => {
                            if (inStock) {
                              addToCart(prod);
                              setSearchProduct('');
                            }
                          }}
                          className={`flex items-center justify-between p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${!inStock ? 'opacity-50' : ''}`}
                        >
                          <div>
                            <div className="text-sm font-bold text-slate-800">{prod.name}</div>
                            <div className="text-xs text-slate-500">ART: {prod.code} | Stock: {prod.stock}</div>
                          </div>
                          <div className="text-brand-600 font-bold">
                            ${prod.sale_price.toLocaleString('es-AR')}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
          
          <div className="space-y-4 flex-1 pr-1">
            
            {/* Cart Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Detalle del Carrito</h4>
              {cart.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <span className="text-xs">Haz clic en un producto para agregarlo</span>
                </div>
              ) : (
                <div className="space-y-0 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 flex items-center px-4 py-2 text-xs font-bold text-slate-500 border-b border-slate-200">
                    <div className="flex-1">Producto</div>
                    <div className="w-24 text-center">Precio Unit.</div>
                    <div className="w-20 text-center">Cantidad</div>
                    <div className="w-24 text-right">Subtotal</div>
                    <div className="w-10"></div>
                  </div>
                  {cart.map((item, index) => (
                    <div key={item.product_id} className={`flex items-center px-4 py-3 text-sm ${index !== cart.length - 1 ? 'border-b border-slate-100' : ''} bg-white hover:bg-slate-50 transition`}>
                      <div className="flex-1 pr-4">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-xs text-slate-500 font-mono">ART: {item.code}</span>
                      </div>
                      <div className="w-24 text-center text-slate-600">
                        ${item.unit_sale_price.toLocaleString('es-AR')}
                      </div>
                      <div className="w-20 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.max_stock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                          className="w-16 text-center border border-slate-200 rounded-lg py-1 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      <div className="w-24 text-right font-extrabold text-brand-600">
                        ${(item.unit_sale_price * item.quantity).toLocaleString('es-AR')}
                      </div>
                      <div className="w-10 text-right">
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 transition"
                          title="Quitar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Modality & Method Picker */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('CASH_ON_HAND');
                      setPaymentMethod('CASH');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      paymentType === 'CASH_ON_HAND'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    CONTADO (Impacta Caja)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('CREDIT_ACCOUNT');
                      setPaymentMethod('CREDIT_ACCOUNT');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      paymentType === 'CREDIT_ACCOUNT'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    CUENTA CORRIENTE
                  </button>
                </div>
              </div>

              {paymentType === 'CASH_ON_HAND' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medio de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 ${
                        paymentMethod === 'CASH' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TRANSFER')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 ${
                        paymentMethod === 'TRANSFER' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Transfer.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QR')}
                      className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 ${
                        paymentMethod === 'QR' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Mercado QR</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Financial Totals & Confirm Sale */}
          <div className="pt-3 border-t border-slate-200 space-y-2 mt-2 bg-slate-50 p-3 rounded-xl">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold">${subtotal.toLocaleString('es-AR')}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Descuento ($):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-20 text-right border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 bg-white"
              />
            </div>

            {/* Financial Breakdown Preview */}
            <div className="pt-2 border-t border-slate-200/80 text-[11px] space-y-1">
              <div className="flex justify-between text-amber-700">
                <span>Costo Reposición (Futura Inversión):</span>
                <span className="font-semibold">${totalReplacementCost.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Comisión Vendedor:</span>
                <span className="font-semibold">${calculatedCommission.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Ganancia Real Neta:</span>
                <span>${estimatedNetProfit.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
              <span>Total a Cobrar:</span>
              <span className="text-brand-600 text-lg">${totalSale.toLocaleString('es-AR')}</span>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={loading || cart.length === 0}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>{loading ? 'Procesando Venta...' : 'REGISTRAR VENTA Y COBRAR'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Inline Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Nuevo Cliente</h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-brand-500 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 text-xs text-slate-600 font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs bg-brand-600 text-white font-bold rounded-xl">Crear Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
