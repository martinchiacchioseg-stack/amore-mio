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
  Tag,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Layers,
  Info,
  Eye
} from 'lucide-react';

const FALLBACK_PRODUCTS = [
  {
    id: 1,
    code: 'ART-101',
    name: 'Conjunto Encaje Sensazione',
    description: 'Conjunto de encaje elastizado con aro y colaless. Alta calidad, diseño elegante y máximo confort para uso diario o momentos especiales.',
    sale_price: 14900,
    stock: 15,
    sizes: '85, 90, 95, 100',
    category_name: 'Conjuntos Femeninos',
    image_url: null,
    images: [],
    is_available: true
  },
  {
    id: 2,
    code: 'ART-102',
    name: 'Body Soft Velvet',
    description: 'Body de terciopelo con transparencias y breteles regulables. Calce anatómico perfecto.',
    sale_price: 19800,
    stock: 8,
    sizes: '1, 2, 3, 4',
    category_name: 'Lencería Fina',
    image_url: null,
    images: [],
    is_available: true
  },
  {
    id: 3,
    code: 'ART-201',
    name: 'Boxer Seamless Confort Hombre',
    description: 'Boxer sin costuras 100% algodón peinado de máxima suavidad y durabilidad.',
    sale_price: 7500,
    stock: 25,
    sizes: 'S, M, L, XL',
    category_name: 'Ropa Interior Masculina',
    image_url: null,
    images: [],
    is_available: true
  },
  {
    id: 4,
    code: 'ART-301',
    name: 'Pijama Satin Elegance',
    description: 'Pijama de raso satén 2 piezas (saco abotonado y pantalón). Suave al tacto y fresco.',
    sale_price: 26900,
    stock: 0,
    sizes: 'M, L, XL',
    category_name: 'Pijamas & Homewear',
    image_url: null,
    images: [],
    is_available: false
  }
];

export default function PublicCatalog() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalogWhatsapp, setCatalogWhatsapp] = useState('5493416123456');

  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    loadPublicSettings();
    loadCategories();
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, search]);

  const loadPublicSettings = async () => {
    try {
      const res = await api.get('/settings/public');
      if (res.data && res.data.catalog_whatsapp) {
        setCatalogWhatsapp(res.data.catalog_whatsapp.replace(/[^\d+]/g, ''));
      }
    } catch (err) {
      console.warn('Usando WhatsApp por defecto:', err);
    }
  };

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
        if (res.data[0]?.whatsapp_phone) {
          setCatalogWhatsapp(res.data[0].whatsapp_phone);
        }
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
      const s = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.code.toLowerCase().includes(s) ||
        (p.sizes && p.sizes.toLowerCase().includes(s))
      );
    }
    setProducts(list);
  };

  const handleDownloadPDF = () => {
    window.open('/api/catalog/pdf', '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/catalogo');
    alert('¡Enlace del catálogo copiado al portapapeles! Ya puedes pegarlo y enviarlo.');
  };

  const handleOpenProductDetail = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setSelectedSize('');
  };

  // Helper to extract gallery photos
  const getProductImages = (prod) => {
    if (!prod) return [];
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      return prod.images;
    }
    if (prod.image_url) {
      return [prod.image_url];
    }
    return [];
  };

  const activeProductImages = getProductImages(selectedProduct);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 via-white to-brand-100">
      {/* Compact Header */}
      <header className="bg-brand-900 text-white py-4 border-b border-brand-800 sticky top-0 z-40 shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/40 via-brand-900 to-brand-950"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4">
            <div className="rounded-xl overflow-hidden shadow-sm">
              <img 
                src="/assets/logo_final.jpg" 
                alt="Amore Mío Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-brand-200 tracking-wider uppercase">
                Catálogo Público Online
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition shadow-sm border border-white/20"
              title="Copiar enlace del catálogo"
            >
              <Share2 className="w-4 h-4 md:mr-1.5" />
              <span className="hidden md:inline">Compartir Enlace</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Catálogo PDF
            </button>
            <a
              href={`https://wa.me/${catalogWhatsapp}?text=${encodeURIComponent('¡Hola Amore Mío! Quería hacer una consulta general sobre el catálogo.')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Main Content & Filters */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por prenda, código o talle (ej: 95, XL)..."
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
            <p className="text-xs text-slate-500 mt-1">Prueba seleccionando otra categoría o buscando por otro talle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isAvailable = product.stock > 0 || product.is_available;
              const productImages = getProductImages(product);
              const hasMultiplePhotos = productImages.length > 1;

              return (
                <div 
                  key={product.id}
                  onClick={() => handleOpenProductDetail(product)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col group cursor-pointer relative"
                >
                  {/* Photo Container */}
                  <div className="relative h-64 bg-slate-100 overflow-hidden">
                    {productImages.length > 0 ? (
                      <img 
                        src={productImages[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-slate-400">
                        <Heart className="w-12 h-12 mb-2 text-brand-300" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amore Mío</span>
                      </div>
                    )}

                    {/* Stock Badge */}
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

                    {/* Category Badge */}
                    {product.category_name && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-sm">
                          <Tag className="w-3 h-3 mr-1 text-brand-400" />
                          {product.category_name}
                        </span>
                      </div>
                    )}

                    {/* Multiple Photos Badge */}
                    {hasMultiplePhotos && (
                      <div className="absolute bottom-3 right-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-950/80 text-white backdrop-blur-sm shadow-sm">
                          <Camera className="w-3 h-3 mr-1 text-brand-300" />
                          {productImages.length} fotos
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-400">CÓD: {product.code}</span>
                        <span className="text-[10px] font-bold text-brand-600 flex items-center group-hover:underline">
                          <Eye className="w-3 h-3 mr-1" /> Ver Detalle
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                        {product.name}
                      </h3>

                      {product.sizes && (
                        <div className="flex items-center space-x-1.5 mt-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Talles:</span>
                          <div className="flex flex-wrap gap-1">
                            {product.sizes.split(',').slice(0, 4).map((s, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded text-[9px] font-bold">
                                {s.trim()}
                              </span>
                            ))}
                            {product.sizes.split(',').length > 4 && (
                              <span className="text-[9px] text-slate-400">+{product.sizes.split(',').length - 4}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {product.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
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
                        href={`https://wa.me/${catalogWhatsapp}?text=${encodeURIComponent(
                          `¡Hola Amore Mío! Quería consultar por el producto "${product.name}" (Código: ${product.code}) de $${Number(product.sale_price).toLocaleString('es-AR')}. ¿Tienen stock?`
                        )}`}
                        onClick={(e) => e.stopPropagation()}
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

      {/* Product Detail Modal (Photos Gallery + Description + Talles + WhatsApp) */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto border border-slate-100 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition backdrop-blur-sm shadow-md"
              title="Cerrar detalle"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Left Column: Photo Gallery */}
              <div className="bg-slate-950 flex flex-col justify-between">
                <div className="relative h-72 sm:h-96 w-full flex items-center justify-center overflow-hidden bg-black">
                  {activeProductImages.length > 0 ? (
                    <img 
                      src={activeProductImages[activeImageIndex] || activeProductImages[0]} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Heart className="w-16 h-16 mb-2 text-brand-400" />
                      <span className="text-xs uppercase font-bold text-slate-400">Amore Mío</span>
                    </div>
                  )}

                  {/* Left / Right Carousel Controls */}
                  {activeProductImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeProductImages.length - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-sm shadow-lg"
                        title="Foto anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev < activeProductImages.length - 1 ? prev + 1 : 0))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-sm shadow-lg"
                        title="Foto siguiente"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Photo counter */}
                      <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-black/70 text-white px-2.5 py-1 rounded-full backdrop-blur-sm shadow">
                        {activeImageIndex + 1} / {activeProductImages.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Thumbnails Row if multiple photos */}
                {activeProductImages.length > 1 && (
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto">
                    {activeProductImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-14 w-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                          activeImageIndex === idx 
                            ? 'border-brand-500 scale-105 shadow-md ring-2 ring-brand-500/50' 
                            : 'border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Info & Actions */}
              <div className="p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400">ARTÍCULO: {selectedProduct.code}</span>
                    {selectedProduct.category_name && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        {selectedProduct.category_name}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {selectedProduct.name}
                  </h2>

                  <div className="mt-3 flex items-baseline space-x-3">
                    <span className="text-2xl font-extrabold text-brand-600">
                      ${Number(selectedProduct.sale_price).toLocaleString('es-AR')}
                    </span>
                    {(selectedProduct.stock > 0 || selectedProduct.is_available) ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        ✓ En Stock
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                        Agotado
                      </span>
                    )}
                  </div>

                  {/* Talles disponibles */}
                  {selectedProduct.sizes && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Talles Disponibles:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.sizes.split(',').map((sizeStr, idx) => {
                          const size = sizeStr.trim();
                          const isSelected = selectedSize === size;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedSize(isSelected ? '' : size)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-brand-600 text-white border-brand-600 shadow-md scale-105'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                      {selectedSize && (
                        <p className="text-[11px] text-brand-600 font-semibold mt-1">
                          Talle seleccionado: <strong>{selectedSize}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Descripción de la Prenda:
                    </label>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                      {selectedProduct.description || 'Prenda de alta calidad de la colección Amore Mío. Confeccionada con materiales seleccionados para brindar calce perfecto y confort.'}
                    </p>
                  </div>
                </div>

                {/* Bottom WhatsApp Button */}
                <div className="pt-4 border-t border-slate-100">
                  <a
                    href={`https://wa.me/${catalogWhatsapp}?text=${encodeURIComponent(
                      `¡Hola Amore Mío! Quería consultar por el producto "${selectedProduct.name}" (Código: ${selectedProduct.code})${selectedSize ? ` en talle ${selectedSize}` : ''} de $${Number(selectedProduct.sale_price).toLocaleString('es-AR')}. ¿Tienen disponibilidad?`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 space-x-2"
                  >
                    <MessageCircle className="w-5 h-5 mr-1" />
                    <span>
                      Consultar por WhatsApp {selectedSize ? `(Talle ${selectedSize})` : ''}
                    </span>
                  </a>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    Te responderá directamente el equipo de ventas de Amore Mío.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
