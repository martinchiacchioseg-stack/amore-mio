import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Tag, 
  Upload, 
  Calculator, 
  CheckCircle2, 
  X 
} from 'lucide-react';

export default function Products() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    cost_price: '',
    sale_price: '',
    profit_percentage: '',
    stock: '',
    min_stock_alert: '5',
    is_published: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSuppliers();
  }, [search, selectedCategory, lowStockFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          search,
          category: selectedCategory,
          lowStock: lowStockFilter ? 'true' : 'false'
        }
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  const handleOpenModal = (prod = null) => {
    setError('');
    setImageFile(null);
    if (prod) {
      setEditingId(prod.id);
      setFormData({
        code: prod.code,
        name: prod.name,
        description: prod.description || '',
        category_id: prod.category_id || '',
        supplier_id: prod.supplier_id || '',
        cost_price: prod.cost_price.toString(),
        sale_price: prod.sale_price.toString(),
        profit_percentage: prod.profit_percentage.toString(),
        stock: prod.stock.toString(),
        min_stock_alert: prod.min_stock_alert.toString(),
        is_published: prod.is_published === 1
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        category_id: categories.length > 0 ? categories[0].id.toString() : '',
        supplier_id: suppliers.length > 0 ? suppliers[0].id.toString() : '',
        cost_price: '',
        sale_price: '',
        profit_percentage: '100', // Default 100% margin
        stock: '10',
        min_stock_alert: '5',
        is_published: true
      });
    }
    setShowModal(true);
  };

  // Price calculations
  const handleCostChange = (val) => {
    const cost = parseFloat(val) || 0;
    const pct = parseFloat(formData.profit_percentage) || 0;
    const sale = cost > 0 && pct > 0 ? cost * (1 + pct / 100) : formData.sale_price;

    setFormData({
      ...formData,
      cost_price: val,
      sale_price: sale ? sale.toFixed(2) : formData.sale_price
    });
  };

  const handleProfitPctChange = (val) => {
    const pct = parseFloat(val) || 0;
    const cost = parseFloat(formData.cost_price) || 0;
    const sale = cost > 0 && pct >= 0 ? cost * (1 + pct / 100) : formData.sale_price;

    setFormData({
      ...formData,
      profit_percentage: val,
      sale_price: sale ? sale.toFixed(2) : formData.sale_price
    });
  };

  const handleSalePriceChange = (val) => {
    const sale = parseFloat(val) || 0;
    const cost = parseFloat(formData.cost_price) || 0;
    const pct = cost > 0 && sale >= cost ? ((sale - cost) / cost) * 100 : formData.profit_percentage;

    setFormData({
      ...formData,
      sale_price: val,
      profit_percentage: pct ? pct.toFixed(2) : formData.profit_percentage
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');

    const data = new FormData();
    data.append('code', formData.code);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('category_id', formData.category_id);
    data.append('supplier_id', formData.supplier_id);
    data.append('cost_price', formData.cost_price);
    data.append('sale_price', formData.sale_price);
    data.append('profit_percentage', formData.profit_percentage);
    data.append('stock', formData.stock);
    data.append('min_stock_alert', formData.min_stock_alert);
    data.append('is_published', formData.is_published);

    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, data);
      } else {
        await api.post('/products', data);
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar producto.');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await api.patch(`/products/${id}/toggle-published`);
      loadProducts();
    } catch (err) {
      console.error('Error cambiando publicación:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (err) {
      alert('Error al eliminar producto.');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.post('/categories', { name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      setShowCategoryModal(false);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear categoría.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Package className="w-6 h-6 mr-2 text-brand-600" />
            Catálogo de Productos y Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestiona tu inventario, calcula automáticamente precios por % de ganancia y selecciona qué prendas publicar en la web.
          </p>
        </div>
        
        {user?.role !== 'SELLER' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center"
            >
              <Tag className="w-4 h-4 mr-1.5 text-brand-600" />
              Categorías
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-brand-600/30 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nuevo Producto
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center ${
            lowStockFilter 
              ? 'bg-rose-600 text-white shadow-sm' 
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          Alertas Bajo Stock ({products.filter(p => p.stock <= p.min_stock_alert).length})
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Foto / Código</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Costo / Venta</th>
                <th className="p-4">Margen %</th>
                <th className="p-4">Stock Actual</th>
                <th className="p-4 text-center">Catálogo Web</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Cargando catálogo de productos...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">No se encontraron productos en el inventario.</td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isLowStock = prod.stock <= prod.min_stock_alert;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <span className="font-mono font-bold text-slate-700">{prod.code}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                        <span className="text-slate-400 text-[11px]">{prod.supplier_name || 'Sin proveedor'}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        {prod.category_name || 'Sin categoría'}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 block text-[11px]">Costo: ${prod.cost_price.toLocaleString('es-AR')}</span>
                        <span className="font-extrabold text-brand-600 text-sm">
                          ${prod.sale_price.toLocaleString('es-AR')}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-600">
                        +{Number(prod.profit_percentage).toFixed(1)}%
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isLowStock ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLowStock && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {prod.stock} un.
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => user?.role !== 'SELLER' && handleTogglePublish(prod.id)}
                          disabled={user?.role === 'SELLER'}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                            prod.is_published === 1 
                              ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          } ${user?.role === 'SELLER' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {prod.is_published === 1 ? (
                            <>
                              <Eye className="w-3 h-3 mr-1 text-brand-600" /> Publicado
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" /> Oculto
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        {user?.role !== 'SELLER' && (
                          <>
                            <button
                              onClick={() => handleOpenModal(prod)}
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                              title="Editar producto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Producto' : 'Cargar Nuevo Producto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código de Artículo *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ej: ART-101"
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Conjunto Encaje Sensazione"
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">Selecciona Categoría</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">Selecciona Proveedor</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic Price Calculator Box */}
              <div className="p-4 bg-brand-50/50 border border-brand-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-brand-800 flex items-center">
                  <Calculator className="w-4 h-4 mr-1.5 text-brand-600" />
                  Calculadora de Precio y Margen de Ganancia
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Precio de Compra (Costo) $</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => handleCostChange(e.target.value)}
                      placeholder="6500"
                      className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Ganancia Deseada (% )</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.profit_percentage}
                      onChange={(e) => handleProfitPctChange(e.target.value)}
                      placeholder="100"
                      className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Precio de Venta Final $</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => handleSalePriceChange(e.target.value)}
                      placeholder="13000"
                      className="w-full border border-brand-400 rounded-xl px-3 py-1.5 text-xs bg-white font-extrabold text-brand-700 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Disponible</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alerta Bajo Stock (Límite)</label>
                  <input
                    type="number"
                    value={formData.min_stock_alert}
                    onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto del Producto (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="is_published" className="text-xs font-bold text-slate-800">
                  Publicar este producto en el Catálogo Web Online para clientes
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-md"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Nueva Categoría de Productos</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej: Accesorios Femeninos"
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Breve detalle..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs"
                >
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
