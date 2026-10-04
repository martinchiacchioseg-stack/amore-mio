import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShoppingBag, 
  MessageCircle, 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Heart,
  Tag
} from 'lucide-react';

const FALLBACK_PRODUCTS = [
  {
    id: 1,
    code: 'ART-101',
    name: 'Conjunto Encaje Sensazione',
    description: 'Conjunto de encaje elastizado con aro y colaless. Alta calidad y confort.',
    sale_price: 14900,
    stock: 15,
    category_name: 'Conjuntos Femeninos',
    image_url: null,
    is_available: true,
    whatsapp_link: 'https://wa.me/5493416123456?text=Quiero%20consultar%20por%20ART-101%20Conjunto%20Encaje%20Sensazione'
  },
  {
    id: 2,
    code: 'ART-102',
    name: 'Body Soft Velvet',
    description: 'Body de terciopelo con transparencias y breteles regulables.',
    sale_price: 19800,
    stock: 8,
    category_name: 'Lencería Fina',
    image_url: null,
    is_available: true,
    whatsapp_link: 'https://wa.me/5493416123456?text=Quiero%20consultar%20por%20ART-102%20Body%20Soft%20Velvet'
  },
  {
    id: 3,
    code: 'ART-201',
    name: 'Boxer Seamless Confort Hombre',
    description: 'Boxer sin costuras 100% algodón peinado de máxima suavidad.',
    sale_price: 7500,
    stock: 25,
    category_name: 'Ropa Interior Masculina',
    image_url: null,
    is_available: true,
    whatsapp_link: 'https://wa.me/5493416123456?text=Quiero%20consultar%20por%20ART-201%20Boxer%20Seamless'
  },
  {
    id: 4,
    code: 'ART-301',
    name: 'Pijama Satin Elegance',
    description: 'Pijama de raso satén 2 piezas (saco abotonado y pantalón).',
    sale_price: 26900,
    stock: 0,
    category_name: 'Pijamas & Homewear',
    image_url: null,
    is_available: false,
    whatsapp_link: 'https://wa.me/5493416123456?text=Quiero%20consultar%20por%20ART-301%20Pijama%20Satin'
  }
];

export default function PublicCatalog() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadCatalog();
  }, [selectedCategory, search]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Usando categorías locales:', err);
      setCategories([
        { id: 1, name: 'Conjuntos Femeninos' },
        { id: 2, name: 'Lencería Fina' },
        { id: 3, name: 'Ropa Interior Masculina' },
        { id: 4, name: 'Pijamas & Homewear' }
      ]);
    }
  };

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalog', {
        params: { category: selectedCategory, search }
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setProducts(res.data);
      } else {
        filterFallbackProducts();
      }
    } catch (err) {
      console.warn('Conexión backend en espera, mostrando catálogo estático:', err);
      filterFallbackProducts();
    } finally {
      setLoading(false);
    }
  };

  const filterFallbackProducts = () => {
    let list = [...FALLBACK_PRODUCTS];
    if (selectedCategory) {
      list = list.filter(p => p.category_name && p.category_name.toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    if (search) {
      list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()));
    }
    setProducts(list);
  };

  const handleDownloadPDF = () => {
    window.open('/api/catalog/pdf', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-brand-50/20 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 md:py-24 border-b border-brand-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/30 via-slate-900 to-slate-950"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-400/30 px-4 py-1.5 rounded-full text-brand-300 text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Colección Exclusiva • Amore Mío</span>
          </div>

          <div className="flex justify-center mb-6">
            <img 
              src="/assets/logo.jpg" 
              alt="Amore Mío Logo" 
              className="h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-4 border-brand-400/40 shadow-2xl shadow-brand-500/20"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-100 to-brand-300">
            AMORE MÍO
          </h1>
          <p className="text-lg md:text-xl font-light text-brand-200 tracking-wider uppercase mb-8">
            Ropa Interior • Para Él y Para Ella
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition shadow-lg shadow-brand-600/30 hover:scale-105"
            >
              <FileText className="w-4 h-4 mr-2" />
              Descargar Catálogo en PDF
            </button>
            <a
              href="https://wa.me/5493416123456?text=¡Hola%20Amore%20Mío!%20Quería%20hacer%20una%20consulta%20general."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-lg shadow-emerald-600/20 hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contacto por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Main Content & Filters */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Filter Toolbar */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === ''
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas las categorías
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedCategory === cat.name
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar prendas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-slate-50"
            />
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse h-80"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron productos disponibles</h3>
            <p className="text-xs text-slate-500 mt-1">Prueba seleccionando otra categoría o limpiando la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isAvailable = product.stock > 0 || product.is_available;
              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col group"
                >
                  <div className="relative h-64 bg-slate-100 overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-slate-400">
                        <Heart className="w-12 h-12 mb-2 text-brand-300" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amore Mío</span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      {isAvailable ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Stock Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-sm shadow-sm">
                          <XCircle className="w-3 h-3 mr-1" /> Agotado
                        </span>
                      )}
                    </div>

                    {product.category_name && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-sm">
                          <Tag className="w-3 h-3 mr-1 text-brand-400" />
                          {product.category_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">CÓD: {product.code}</span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Precio</span>
                        <span className="text-xl font-extrabold text-brand-600">
                          ${Number(product.sale_price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>

                      <a
                        href={product.whatsapp_link || `https://wa.me/5493416123456?text=Consultar%20por%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm hover:scale-105"
                        title="Consultar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Consultar
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
