import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const dest = path.join(process.cwd(), 'client/public/assets/Manual_Amore_Mio.pdf');
const doc = new PDFDocument({ margin: 50, size: 'A4' });
doc.pipe(fs.createWriteStream(dest));

// Colors
const brandPink = '#ec4899';
const darkPink = '#be185d';
const dark = '#0f172a';
const gray = '#475569';
const lightGray = '#94a3b8';
const emerald = '#059669';

// Helpers
let pageNumber = 1;
doc.on('pageAdded', () => {
  pageNumber++;
  doc.fontSize(9).fillColor(lightGray).text(`Página ${pageNumber}`, 50, 780, { align: 'center' });
});

function addTitle(text) {
  doc.fontSize(28).fillColor(darkPink).font('Helvetica-Bold').text(text, { align: 'center' });
  doc.moveDown(2);
}

function addChapter(num, title) {
  doc.addPage();
  doc.fontSize(22).fillColor(darkPink).font('Helvetica-Bold').text(`Capítulo ${num}: ${title}`);
  doc.moveDown(1.5);
}

function addHeader(text) {
  doc.moveDown(1.5);
  doc.fontSize(16).fillColor(brandPink).font('Helvetica-Bold').text(text);
  doc.moveDown(0.5);
}

function addSubHeader(text) {
  doc.moveDown(1);
  doc.fontSize(12).fillColor(dark).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function addText(text, bold = false) {
  doc.fontSize(11).fillColor(gray).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(text, { align: 'justify', lineGap: 4 });
  doc.moveDown(0.5);
}

function addBullet(text) {
  doc.fontSize(11).fillColor(gray).font('Helvetica').text(`• ${text}`, { align: 'justify', lineGap: 3, indent: 15 });
  doc.moveDown(0.2);
}

function addImportant(text) {
  doc.moveDown(0.5);
  doc.rect(50, doc.y, 495, 30).fillColor('#fce7f3').fill();
  doc.fillColor(darkPink).font('Helvetica-Bold').fontSize(10).text(` IMPORTANTE: ${text}`, 60, doc.y - 20, { width: 475 });
  doc.moveDown(1.5);
}

// --- PORTADA ---
doc.moveDown(5);
doc.fontSize(36).fillColor(dark).font('Helvetica-Bold').text('AMORE MÍO', { align: 'center' });
doc.fontSize(14).fillColor(brandPink).font('Helvetica-Bold').text('ROPA INTERIOR PARA ÉL Y PARA ELLA', { align: 'center' });
doc.moveDown(3);
doc.fontSize(24).fillColor(gray).font('Helvetica').text('Manual Oficial de Usuario', { align: 'center' });
doc.moveDown(1);
doc.fontSize(12).fillColor(lightGray).font('Helvetica').text('Guía Completa de Configuración y Uso Paso a Paso', { align: 'center' });
doc.moveDown(15);
doc.fontSize(10).fillColor(lightGray).text('Versión 2.0 - Actualizado con Gestión Integral y Catálogo Web', { align: 'center' });

// --- ÍNDICE ---
doc.addPage();
doc.fontSize(22).fillColor(darkPink).font('Helvetica-Bold').text('Índice General', { align: 'center' });
doc.moveDown(2);

const indexItems = [
  "1. Introducción y Acceso al Sistema",
  "2. Configuración Inicial: Roles y Usuarios",
  "3. Gestión de Proveedores",
  "4. Creación de Categorías y Productos",
  "5. El Catálogo Web Interactivo",
  "6. Módulo de Punto de Venta (Facturación Rápida)",
  "7. Clientes y Cuentas Corrientes (Fiados)",
  "8. Caja Diaria, Ganancias Reales y Comisiones",
  "9. Panel de Control (Dashboard y Estadísticas)",
  "10. Licencias y Administración General"
];

indexItems.forEach(item => {
  doc.fontSize(12).fillColor(dark).font('Helvetica-Bold').text(item, { lineGap: 10 });
});

// --- CAPÍTULOS ---

// CAP 1
addChapter(1, 'Introducción y Acceso al Sistema');
addText('Bienvenida al sistema integral de gestión de Amore Mío. Esta plataforma fue diseñada a medida para permitirte automatizar tus ventas, controlar tu stock en tiempo real en la nube, gestionar a tus vendedoras y mostrar tus productos en un catálogo web público de forma automática.');
addHeader('Acceso al sistema');
addText('El sistema funciona 100% online, lo que significa que puedes acceder desde tu celular, tablet o computadora sin instalar nada.');
addBullet('1. Abre tu navegador web (Chrome, Safari, etc.) e ingresa a la dirección web (enlace) que te proporcionaron.');
addBullet('2. Verás la pantalla de inicio con el logotipo de Amore Mío.');
addBullet('3. Haz clic en "Ingreso Personal" e introduce tu Correo Electrónico y Contraseña.');
addText('Una vez que ingreses, verás un menú superior oscuro (casi negro) que contrasta con el sistema. Este menú te acompañará siempre y te permitirá navegar por todos los módulos.');

// CAP 2
addChapter(2, 'Configuración Inicial: Roles y Usuarios');
addText('Si eres la Administradora del sistema, el primer paso es configurar quién más tendrá acceso y qué permisos tendrá.');
addHeader('Crear una Vendedora');
addText('Tus empleadas necesitan su propio usuario para que el sistema pueda registrar sus ventas y calcular sus comisiones de forma automática.');
addBullet('1. En el menú superior, haz clic en "Usuarios / Config".');
addBullet('2. Arriba a la derecha, verás un botón verde que dice "+ Nuevo Usuario". Haz clic en él.');
addBullet('3. Completa los datos: Nombre completo, Email de la vendedora, y una Contraseña provisoria.');
addBullet('4. Asegúrate de seleccionar el rol "VENDEDOR". Los vendedores no pueden ver las ganancias del negocio ni crear nuevos usuarios.');
addSubHeader('Configuración de Comisiones');
addText('En esa misma pantalla de creación, verás la sección de comisiones. Es fundamental completarla correctamente:');
addBullet('Tipo de Comisión: Puedes elegir "Porcentaje" (ej: 10% de cada venta) o "Monto Fijo" (ej: $1000 por cada venta realizada).');
addBullet('Valor de Comisión: Escribe el número correspondiente.');
addText('Haz clic en "Guardar Usuario". La próxima vez que tu vendedora ingrese con el email y contraseña que le creaste, el sistema le exigirá que cambie la contraseña por una propia por motivos de seguridad.');

// CAP 3
addChapter(3, 'Gestión de Proveedores');
addText('Antes de cargar la mercadería, es muy útil cargar quién te la provee para tener un control estricto de costos.');
addHeader('Cargar un Proveedor');
addBullet('1. Ve a "Proveedores" en el menú principal.');
addBullet('2. Haz clic en "+ Nuevo Proveedor".');
addBullet('3. Completa el Nombre de la fábrica o distribuidor (Ej: "Fábrica Textil El Hilo").');
addBullet('4. Opcionalmente, ingresa su teléfono, email y dirección para tener su contacto a mano cuando necesites reponer mercadería.');
addBullet('5. Haz clic en Guardar.');

// CAP 4
addChapter(4, 'Creación de Categorías y Productos');
addText('El corazón de tu negocio. Aquí es donde cargas tu stock.');
addHeader('Crear Categorías');
addText('Las categorías agrupan tu ropa. Por ejemplo: "Lencería Fina", "Pijamas", "Boxers".');
addBullet('En el módulo de "Productos", antes de crear un producto, asegúrate de tener las categorías correctas creadas en el botón "Gestionar Categorías".');
addHeader('Cargar un Producto Nuevo');
addBullet('1. Ve al menú "Productos".');
addBullet('2. Haz clic en "+ Nuevo Producto".');
addBullet('3. Llena la información básica: Código (Art), Nombre (Ej: "Conjunto de Encaje Rojo") y una pequeña descripción.');
addSubHeader('Costos, Precios y Rentabilidad');
addBullet('Costo de Reposición: Cuánto le pagaste al Proveedor por esta prenda.');
addBullet('Precio de Venta: Cuánto le cobrarás al cliente final.');
addImportant('Al cargar ambos valores, el sistema te mostrará automáticamente tu margen de rentabilidad (ganancia neta) en pantalla.');
addSubHeader('Control de Stock');
addText('En la sección de Stock de esa misma pantalla:');
addBullet('Stock Actual: Cuántas prendas tienes físicamente hoy.');
addBullet('Stock Mínimo: La cantidad de alerta. Si pones 3, el sistema te avisará en rojo cuando queden 3 prendas o menos para que le pidas más a tu Proveedor.');

// CAP 5
addChapter(5, 'El Catálogo Web Interactivo');
addText('Amore Mío cuenta con una vidriera digital pública (Catálogo) donde tus clientes pueden ver tus artículos. La gran ventaja es que está directamente conectado a tu stock.');
addHeader('¿Cómo funciona el Catálogo Web?');
addText('En el menú "Productos", verás un interruptor verde/gris para cada prenda que dice "Publicado" u "Oculto".');
addBullet('Si está "Publicado" (verde), el producto aparece en tu enlace web público instantáneamente.');
addBullet('Si está "Oculto" (gris), el producto desaparece de la web, pero sigue existiendo en tu sistema interno.');
addImportant('¡Automatización Total! Si vendes tu última unidad de un artículo y su stock llega a CERO, el sistema lo oculta de la web automáticamente para evitar que los clientes te pidan algo que ya no tienes.');
addText('Puedes ver el catálogo tú mismo haciendo clic en el botón oscuro "Catálogo" en la barra superior.');

// CAP 6
addChapter(6, 'Punto de Venta (Facturación Rápida)');
addText('El módulo de "Punto de Venta" fue diseñado para ser veloz, sin distracciones y eficiente. Toda esta sección se visualiza dentro de un recuadro rosado pálido para diferenciar los controles principales.');
addHeader('Buscar y Seleccionar Producto');
addText('Ya no tienes que buscar imágenes gigantes. Simplemente haz clic en la barra buscadora.');
addBullet('Al hacer clic en "Buscar o Seleccionar Producto", se desplegará una lista completa de todo tu inventario en stock.');
addBullet('Puedes hacer scroll (deslizar) para buscar, o simplemente empezar a escribir (el código o el nombre) para filtrar al instante.');
addBullet('Haz clic en el producto y se agregará inmediatamente a la tabla inferior del carrito.');
addHeader('Seleccionar Cliente (Menú Inline)');
addText('Arriba a la izquierda, puedes seleccionar al cliente. Por defecto dice "Consumidor Final (Venta Anónima)". Si necesitas registrar a nombre de quién es la venta:');
addBullet('Abre el desplegable y busca al cliente.');
addBullet('Si es un cliente nuevo, no hace falta salir de Ventas: haz clic en el botoncito verde "+ Nuevo", ponle su nombre y se seleccionará automáticamente.');
addHeader('Cerrar la Venta y Comprobantes');
addBullet('1. Una vez agregados los productos, elige la forma de pago (Efectivo, Transferencia, QR).');
addBullet('2. Presiona "Registrar Venta".');
addBullet('3. ¡Éxito! El sistema restó el stock, guardó la venta y sumó la comisión de la vendedora en milisegundos.');
addBullet('4. Haz clic en "Descargar Remito". Se generará un PDF profesional con tu logotipo negro, una "X" gigante arriba y la leyenda de "No válido como comprobante fiscal" exigida por las normativas. Listo para mandar por WhatsApp.');

// CAP 7
addChapter(7, 'Clientes y Cuentas Corrientes (Fiados)');
addText('El sistema te permite gestionar la relación con tus compradores recurrentes.');
addHeader('Dar a Fiado (Cuenta Corriente)');
addText('Si un cliente de confianza se lleva prendas pero promete pagar después, en el Punto de Venta debes cambiar el "Tipo de Pago" de "Al Contado" a "A Cuenta Corriente (Fiado)".');
addImportant('Las ventas A Cuenta Corriente NO suman plata a la Caja Diaria del día, ya que no entró dinero real. En cambio, le generan una DEUDA al cliente.');
addHeader('Cobrar una Deuda');
addBullet('1. Ve al menú "Clientes & Cta Cte".');
addBullet('2. Verás en letras rojas los clientes que tienen deudas.');
addBullet('3. Haz clic en "Cobrar" y escribe el monto que el cliente te está entregando hoy.');
addBullet('4. Esa entrega de dinero sí ingresará automáticamente a la Caja de hoy bajo el concepto de "Cobro de Cuenta Corriente".');

// CAP 8
addChapter(8, 'Caja Diaria, Ganancias Reales y Comisiones');
addText('Aquí es donde la magia financiera del sistema ocurre. En el módulo de "Caja & Rendición", la Administradora tiene control total del dinero.');
addHeader('Interpretación de la Caja');
addText('En la pantalla verás tres grandes recuadros:');
addBullet('Ingresos Brutos: Todo el dinero que entró hoy (o en el rango de fechas seleccionado).');
addBullet('Costos y Egresos: El costo de la mercadería que se vendió (basado en el costo del Proveedor) más los gastos manuales que cargues.');
addBullet('Ganancia Real Neta: Es el número más importante. Es lo que realmente ganó tu negocio luego de descontar lo que costó reponer la prenda y la comisión que se le debe pagar a la vendedora.');
addHeader('Pago de Comisiones a Vendedoras');
addText('En la parte inferior de la Caja, verás una tabla llamada "Saldos Acumulados de Vendedores".');
addBullet('El sistema lleva una cuenta milimétrica sumando la comisión de cada venta que hace una empleada.');
addBullet('Si la vendedora Romina acumuló $4.500 de comisiones esta semana, aparecerá ahí su deuda.');
addBullet('Para pagarle: Haz clic en el botón "Pagar Comisión". El sistema descontará esa plata de tu Caja General como un egreso de pago de sueldos y pondrá la deuda de Romina en CERO.');

// CAP 9
addChapter(9, 'Panel de Control (Dashboard y Estadísticas)');
addText('Si quieres ver el resumen de la salud de tu negocio, dirígete al menú "Estadísticas".');
addText('En esta pantalla encontrarás gráficos e indicadores en tiempo real:');
addBullet('Ventas Totales del mes.');
addBullet('Ranking de los productos más vendidos (ideal para saber qué volver a pedirle a los proveedores).');
addBullet('Gráficos de rendimiento semanal.');
addText('Todo esto te permite tomar decisiones basadas en números reales, no en intuiciones.');

// CAP 10
addChapter(10, 'Licencias y Administración General');
addText('El acceso al sistema está controlado por una licencia de uso que se puede renovar.');
addHeader('Indicador de Licencia');
addText('Si ingresas como Administradora, observarás en la barra superior negra, al lado derecho, un indicador de "Licencia: X días". Este indicador te mantendrá informada sobre cuánto tiempo de validez le resta al sistema actual.');
addBullet('Si el indicador está en color verde (Esmeralda), tu licencia está al día.');
addBullet('Si quedan menos de 30 días, el indicador se pondrá en rojo (Rosa Fuerte) para avisarte preventivamente.');
addHeader('Copias de Seguridad');
addText('Dado que el sistema trabaja en la nube con tecnología moderna de bases de datos, todas tus ventas, clientes y stock están respaldados de forma continua. No es necesario que hagas "backups" manuales con pendrives o discos duros.');

doc.end();
console.log('Manual PDF completísimo generado exitosamente en:', dest);
