import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  ShoppingCart, 
  Store, 
  Wallet, 
  FileText, 
  TrendingUp,
  ShieldCheck,
  Play,
  Pause
} from 'lucide-react';

const steps = [
  {
    id: 'intro',
    title: 'Bienvenido al Sistema Amore Mío',
    subtitle: 'Gestión Integral Inteligente',
    icon: ShieldCheck,
    color: 'from-brand-900 to-black',
    content: 'Una plataforma diseñada a medida para automatizar tus ventas, controlar tu stock en tiempo real y gestionar las comisiones de tu equipo con total seguridad. Todo en la nube y accesible desde cualquier dispositivo.',
    visual: (
      <div className="flex justify-center items-center h-full">
        <img src="/assets/logo_final.jpg" alt="Amore Mío" className="h-48 md:h-64 object-contain rounded-2xl shadow-2xl animate-pulse" />
      </div>
    )
  },
  {
    id: 'pos',
    title: 'Punto de Venta Ultra Rápido',
    subtitle: 'Facturación sin distracciones',
    icon: ShoppingCart,
    color: 'from-brand-800 to-brand-950',
    content: 'Un módulo de ventas de una sola columna. Buscá productos al instante con un menú desplegable inteligente, agregá clientes nuevos sin salir de la pantalla y cobrá en segundos. Todo optimizado para la velocidad en el mostrador.',
    visual: (
      <div className="bg-white p-4 rounded-xl shadow-2xl max-w-sm mx-auto transform rotate-1 border border-brand-100 text-slate-800">
        <div className="border-b border-brand-100 pb-2 mb-2 flex flex-col">
          <span className="text-[10px] font-bold text-brand-600">Buscar o Seleccionar Producto</span>
          <div className="bg-slate-100 p-1.5 rounded text-xs text-slate-500 mt-1">Conjunto Encaje...</div>
        </div>
        <div className="bg-brand-50 p-2 rounded flex justify-between items-center mb-3 border border-brand-200">
          <div>
            <div className="text-xs font-bold text-brand-900">Conjunto Encaje Rojo</div>
            <div className="text-[10px] text-brand-600">ART: CE-01</div>
          </div>
          <span className="font-extrabold text-brand-900">$15.000</span>
        </div>
        <button className="w-full bg-brand-600 text-white text-xs font-bold py-2 rounded shadow">
          REGISTRAR VENTA Y COBRAR
        </button>
      </div>
    )
  },
  {
    id: 'catalog',
    title: 'Catálogo Web en Vivo',
    subtitle: 'Tu vidriera digital conectada a tu stock',
    icon: Store,
    color: 'from-pink-900 to-brand-950',
    content: 'Tus clientes entran a un enlace exclusivo y ven tu catálogo con los colores de tu marca. ¡La magia es que está conectado a tu inventario! Si vendés el último artículo o lo pausás desde el sistema, desaparece automáticamente de la web para que no te pidan cosas sin stock.',
    visual: (
      <div className="bg-black p-4 rounded-3xl shadow-2xl max-w-[220px] mx-auto border-4 border-slate-800 h-72 flex flex-col">
        <div className="text-center pb-2 border-b border-white/20 mb-3">
          <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-300 font-bold text-lg">AMORE MÍO</h3>
          <p className="text-[8px] text-brand-200 uppercase tracking-widest">Catálogo Online</p>
        </div>
        <div className="flex-1 overflow-hidden space-y-3">
          <div className="bg-white/5 rounded-lg h-20 w-full flex items-center p-2 border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded mr-2 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-2 w-3/4 bg-white/20 rounded mb-1"></div>
              <div className="h-2 w-1/2 bg-white/10 rounded mb-2"></div>
              <div className="h-3 w-1/3 bg-brand-400 rounded"></div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg h-20 w-full flex items-center p-2 border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded mr-2 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-2 w-3/4 bg-white/20 rounded mb-1"></div>
              <div className="h-2 w-1/2 bg-white/10 rounded mb-2"></div>
              <div className="h-3 w-1/3 bg-brand-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'reports',
    title: 'Estadísticas e Informes',
    subtitle: 'Control total de tu negocio',
    icon: TrendingUp,
    color: 'from-slate-900 to-black',
    content: 'Un panel de control (Dashboard) que te muestra gráficos de ventas diarias, ganancias reales y productos más vendidos. Tomá decisiones inteligentes basadas en datos reales, no en suposiciones.',
    visual: (
      <div className="bg-white p-4 rounded-xl shadow-2xl max-w-sm mx-auto border border-slate-200 text-slate-800">
        <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700">Ventas del Mes</span>
          <span className="text-sm font-extrabold text-emerald-600">+$250.000</span>
        </div>
        <div className="flex items-end space-x-2 h-24 mb-2">
          <div className="flex-1 bg-brand-200 rounded-t-sm h-1/3"></div>
          <div className="flex-1 bg-brand-300 rounded-t-sm h-1/2"></div>
          <div className="flex-1 bg-brand-400 rounded-t-sm h-3/4"></div>
          <div className="flex-1 bg-brand-500 rounded-t-sm h-full"></div>
          <div className="flex-1 bg-brand-600 rounded-t-sm h-2/3"></div>
        </div>
        <div className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">Gráfico de Rendimiento</div>
      </div>
    )
  },
  {
    id: 'cash',
    title: 'Caja y Comisiones',
    subtitle: 'Cuentas claras, siempre',
    icon: Wallet,
    color: 'from-emerald-900 to-brand-950',
    content: 'El módulo de caja separa tu ganancia real del costo de reposición de mercadería. Además, calcula automáticamente la comisión de cada vendedora. Podés liquidarles el saldo acumulado adeudado con un solo clic.',
    visual: (
      <div className="bg-white p-4 rounded-xl shadow-2xl max-w-sm mx-auto -rotate-1 border border-emerald-100 text-slate-800">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
          <span className="text-xs font-bold text-slate-700">Vendedora: Romina</span>
          <span className="text-xs font-bold text-rose-600">Deuda: $4.500</span>
        </div>
        <div className="flex justify-between text-[10px] text-emerald-700 font-bold mb-3">
          <span>Ganancia Real Neta:</span>
          <span>$10.500</span>
        </div>
        <button className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded shadow">
          PAGAR COMISIÓN
        </button>
      </div>
    )
  },
  {
    id: 'pdf',
    title: 'Tickets y Remitos PDF',
    subtitle: 'Comprobantes No Fiscales',
    icon: FileText,
    color: 'from-slate-800 to-black',
    content: 'Al cerrar una venta, se genera un PDF profesional listo para enviar por WhatsApp o imprimir, con tu logo, la gran "X" y la leyenda requerida de "No válido como comprobante fiscal".',
    visual: (
      <div className="bg-white p-6 rounded shadow-2xl max-w-[200px] mx-auto border-t-8 border-brand-600 h-64 flex flex-col items-center text-slate-900">
        <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-bold text-xl mb-2">X</div>
        <div className="text-[8px] text-center font-bold mb-4">NO VÁLIDO COMO COMPROBANTE FISCAL</div>
        <div className="w-full h-1 bg-slate-200 mb-2"></div>
        <div className="w-full h-1 bg-slate-200 mb-2"></div>
        <div className="w-3/4 h-1 bg-slate-200 mb-4"></div>
        <div className="mt-auto font-bold text-xs">Total: $15.000</div>
      </div>
    )
  }
];

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextStep = () => setCurrentStep((prev) => (prev + 1) % steps.length);
  const prevStep = () => setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 bg-gradient-to-br ${step.color} text-white`}>
      
      {/* Top Navbar */}
      <div className="p-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <img src="/assets/logo_final.jpg" alt="Logo" className="h-10 rounded bg-black" />
          <span className="font-bold tracking-widest hidden sm:block">TOUR INTERACTIVO</span>
        </div>
        <Link to="/login" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold backdrop-blur-sm transition border border-white/20">
          Ingresar al Sistema
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-20 gap-12 z-10">
        
        {/* Text Info */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 border border-white/10">
            <Icon className="w-8 h-8 text-brand-300" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 leading-tight">
            {step.title}
          </h1>
          <h2 className="text-xl lg:text-2xl text-brand-300 font-semibold mb-6">
            {step.subtitle}
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            {step.content}
          </p>

          {/* Controls */}
          <div className="flex items-center justify-center lg:justify-start space-x-4">
            <button onClick={prevStep} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition">
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-500 font-bold flex items-center space-x-2 transition shadow-lg shadow-brand-600/30"
            >
              {isPlaying ? <><Pause className="w-4 h-4"/> <span>Pausar</span></> : <><Play className="w-4 h-4"/> <span>Reproducir</span></>}
            </button>

            <button onClick={nextStep} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Indicators */}
          <div className="flex justify-center lg:justify-start space-x-2 mt-8">
            {steps.map((s, idx) => (
              <button 
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`transition-all duration-300 h-1.5 rounded-full ${idx === currentStep ? 'w-8 bg-brand-400' : 'w-4 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>

        {/* Visual Mockup Area */}
        <div className="flex-1 w-full max-w-lg relative h-[400px]">
          <div className="absolute inset-0 flex items-center justify-center transition-all duration-500">
            {step.visual}
          </div>
        </div>

      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-600 rounded-full blur-[150px] transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600 rounded-full blur-[150px] transform -translate-x-1/3 translate-y-1/3"></div>
      </div>
    </div>
  );
}
