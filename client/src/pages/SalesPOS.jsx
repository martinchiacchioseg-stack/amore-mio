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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2 text-brand-600" />
            Punto de Venta (POS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro ágil de ventas al contado y a cuenta corriente con desglose automático de comisión y ganancia.
          </p>
        </div>

        {user && (
          <div className="bg-brand-50 border border-brand-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-brand-700 block">Vendedor en Caja</span>
            <span className="text-sm font-bold text-slate-900">{user.name}</span>
            <span className="text-xs text-brand-600 block">Comisión: {user.commission_type === 'PERCENTAGE' ? `${user.commission_value}%` : `$${user.commission_value}`}</span>
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
          <button 
            onClick={() => setLastCompletedSale(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* POS Grid: Products (Left) + Cart & Billing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Selector (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px] lg:h-[650px]">
          
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por código (ej: ART-101) o nombre del producto..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-slate-50"
            />
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 align-content-start">
            {filteredProducts.map((prod) => {
              const inStock = prod.stock > 0;
              return (
                <div
                  key={prod.id}
                  onClick={() => inStock && addToCart(prod)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    inStock 
                      ? 'border-slate-200 hover:border-brand-400 hover:shadow-md bg-white' 
                      : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400">ART: {prod.code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        Stock: {prod.stock}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{prod.name}</h4>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-extrabold text-brand-600">
                      ${Number(prod.sale_price).toLocaleString('es-AR')}
                    </span>
                    <button
                      disabled={!inStock}
                      className="p-1.5 bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Cart, Customer & Checkout (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-auto lg:h-[650px]">
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            
            {/* Customer Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-brand-600" />
                Cliente de la Venta
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="">-- Consumidor Final (Venta Anónima) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.credit_balance > 0 ? `(Deuda Cta.Cte: $${c.credit_balance.toLocaleString('es-AR')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Detalle del Carrito</h4>
              {cart.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <span className="text-xs">Haz clic en un producto para agregarlo</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <div className="flex-1 pr-2">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-slate-500">${item.unit_sale_price.toLocaleString('es-AR')} c/u</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={item.max_stock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                          className="w-12 text-center border border-slate-200 rounded-lg py-1 font-bold text-slate-800 bg-white"
                        />
                        <span className="font-bold text-brand-600 w-16 text-right">
                          ${(item.unit_sale_price * item.quantity).toLocaleString('es-AR')}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

    </div>
  );
}
