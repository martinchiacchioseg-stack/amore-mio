import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Truck, Plus, Search, Edit3, Trash2, Phone, Mail, MapPin, Instagram, Facebook, Globe } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    instagram: '',
    facebook: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sup = null) => {
    if (sup) {
      setEditingId(sup.id);
      setFormData({
        name: sup.name,
        contact_person: sup.contact_person || '',
        phone: sup.phone || '',
        email: sup.email || '',
        address: sup.address || '',
        instagram: sup.instagram || sup.social_media || '',
        facebook: sup.facebook || ''
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', 
        contact_person: '', 
        phone: '', 
        email: '', 
        address: '', 
        instagram: '', 
        facebook: '' 
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar proveedor.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      loadSuppliers();
    } catch (err) {
      alert('Error al eliminar proveedor.');
    }
  };

  const filteredSuppliers = suppliers.filter((sup) => {
    const s = search.toLowerCase();
    return (
      (sup.name && sup.name.toLowerCase().includes(s)) ||
      (sup.contact_person && sup.contact_person.toLowerCase().includes(s)) ||
      (sup.phone && sup.phone.toLowerCase().includes(s)) ||
      (sup.email && sup.email.toLowerCase().includes(s)) ||
      (sup.address && sup.address.toLowerCase().includes(s)) ||
      (sup.instagram && sup.instagram.toLowerCase().includes(s)) ||
      (sup.facebook && sup.facebook.toLowerCase().includes(s)) ||
      (sup.social_media && sup.social_media.toLowerCase().includes(s))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Truck className="w-6 h-6 mr-2 text-brand-600" />
            Proveedores de Mercadería
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administración de fabricantes y distribuidores de lencería y ropa interior.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar proveedor o red social..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-brand-600/30 flex items-center justify-center flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-400 text-xs col-span-3">Cargando proveedores...</p>
        ) : filteredSuppliers.length === 0 ? (
          <p className="text-slate-400 text-xs col-span-3">
            {search ? 'No se encontraron proveedores que coincidan con la búsqueda.' : 'No hay proveedores registrados.'}
          </p>
        ) : (
          filteredSuppliers.map((sup) => (
            <div key={sup.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold text-slate-900">{sup.name}</h3>
                  <div className="flex space-x-1">
                    <button onClick={() => handleOpenModal(sup)} className="p-1 text-slate-400 hover:text-brand-600" title="Editar">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(sup.id)} className="p-1 text-slate-400 hover:text-rose-600" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {sup.contact_person && (
                  <span className="text-xs text-brand-600 font-semibold block mb-2">Contacto: {sup.contact_person}</span>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {sup.phone && (
                    <div className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                      <span>{sup.phone}</span>
                    </div>
                  )}
                  {sup.email && (
                    <div className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                      <span>{sup.address}</span>
                    </div>
                  )}

                  {/* Sección Redes Sociales en la Ficha del Proveedor */}
                  {((sup.instagram || sup.social_media) || sup.facebook) && (
                    <div className="pt-2 mt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Redes Sociales:
                      </span>

                      {(sup.instagram || sup.social_media) && (
                        <div className="flex items-center">
                          <Instagram className="w-3.5 h-3.5 mr-2 text-pink-500 flex-shrink-0" />
                          <a
                            href={(sup.instagram || sup.social_media).startsWith('http') 
                              ? (sup.instagram || sup.social_media) 
                              : `https://instagram.com/${(sup.instagram || sup.social_media).replace('@', '').trim()}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-pink-600 hover:text-pink-700 font-semibold hover:underline truncate"
                            title="Ver Instagram del proveedor"
                          >
                            {sup.instagram || sup.social_media}
                          </a>
                        </div>
                      )}

                      {sup.facebook && (
                        <div className="flex items-center">
                          <Facebook className="w-3.5 h-3.5 mr-2 text-blue-600 flex-shrink-0" />
                          <a
                            href={sup.facebook.startsWith('http') 
                              ? sup.facebook 
                              : `https://facebook.com/${sup.facebook.replace('@', '').trim()}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline truncate"
                            title="Ver Facebook del proveedor"
                          >
                            {sup.facebook}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Empresa / Razón Social *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Textil Romance S.A."
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Ej: Laura Gómez"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 9 11 4455-8899"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@proveedor.com"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección / Depósito</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. Corrientes 1234, CABA"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              {/* Ítem Redes Sociales con Facebook e Instagram para completar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-2">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Redes Sociales
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Instagram</label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-pink-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="Ej: @textilromance o enlace"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Facebook</label>
                  <div className="relative">
                    <Facebook className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="Ej: facebook.com/textilromance o página"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
