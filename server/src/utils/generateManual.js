import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const dest = path.join(process.cwd(), '../../../client/public/assets/Manual_Amore_Mio.pdf');
const doc = new PDFDocument({ margin: 50, size: 'A4' });
doc.pipe(fs.createWriteStream(dest));

// Colors
const pink = '#e598ac';
const darkPink = '#c45a78';
const dark = '#333333';
const gray = '#666666';

// Helper for headers
function addHeader(text) {
  doc.moveDown(1.5);
  doc.fontSize(16).fillColor(darkPink).font('Helvetica-Bold').text(text);
  doc.moveDown(0.5);
}

function addSubHeader(text) {
  doc.moveDown(1);
  doc.fontSize(12).fillColor('#a33f5b').font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function addText(text, bold = false) {
  doc.fontSize(11).fillColor(dark).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(text, { align: 'justify', lineGap: 3 });
}

function addBullet(text) {
  doc.fontSize(11).fillColor(dark).font('Helvetica').text(`• ${text}`, { align: 'justify', lineGap: 3, indent: 15 });
}

// Title Page
doc.fontSize(28).fillColor(darkPink).font('Helvetica-Bold').text('Manual de Usuario', { align: 'center' });
doc.fontSize(18).fillColor(pink).text('Amore Mío - Lencería', { align: 'center' });
doc.moveDown(1);
doc.fontSize(12).fillColor(gray).font('Helvetica').text('Guía paso a paso para administradores y vendedores', { align: 'center' });
doc.moveDown(3);

addText('¡Bienvenida al sistema de gestión de Amore Mío! Este manual está redactado especialmente para que cualquier persona, sin importar su experiencia previa con sistemas informáticos, pueda administrar el negocio de principio a fin de manera rápida y sencilla.');
addText('A continuación, te explicamos paso a paso cómo cargar tus productos, realizar ventas, manejar tu caja y administrar el catálogo web.');

addHeader('1. Primeros Pasos y Acceso al Sistema');
addText('Para ingresar al sistema, debes acceder a la página web provista e ingresar tu Correo Electrónico y Contraseña.');
addText('Existen diferentes niveles de permisos (Roles):');
addBullet('Administrador (Admin): Tiene control total. Puede ver ganancias, cargar productos, crear vendedores y ver la caja.');
addBullet('Vendedor: Tiene un acceso limitado. Solo puede hacer ventas (Punto de Venta), ver el catálogo y cargar movimientos de caja menores.');

addHeader('2. Cómo cargar y administrar Productos');
addText('El módulo de "Productos" es donde mantendrás actualizado tu inventario y precios.');
addSubHeader('Paso a paso para crear un Producto nuevo:');
addBullet('1. En el menú principal (a la izquierda o en el ícono de las 3 rayitas en el celular), haz clic en "Productos".');
addBullet('2. Haz clic en el botón rosa que dice "+ Nuevo Producto" (arriba a la derecha).');
addBullet('3. Se abrirá una ventana. Completa el "Código" (ej. ART-001) y el "Nombre" (ej. Conjunto de Encaje).');
addBullet('4. Selecciona la "Categoría". Si la categoría no existe, podrás crearla desde el menú Categorías.');
addBullet('5. Precios: Ingresa el "Costo" (lo que te costó a ti). Luego, ingresa el "Precio de Venta" (a cuánto lo vas a vender). ¡El sistema calculará automáticamente qué porcentaje de ganancia estás obteniendo!');
addBullet('6. Stock: Ingresa la cantidad de unidades que tienes físicamente. Si pones el "Stock Mínimo" en 3, el sistema te avisará con letras rojas cuando te queden 3 o menos.');
addBullet('7. Haz clic en "Guardar Producto". ¡Listo!');

addSubHeader('Cómo subir un producto al Catálogo de Internet (Web):');
addText('En tu lista de productos, verás una columna llamada "Estado Web" con un ícono de un Ojo. Si haces clic en ese ícono, el producto cambiará entre "Oculto" (gris) y "Publicado" (verde). Todo lo que esté en "Publicado" aparecerá automáticamente en tu catálogo online para que lo vean tus clientes.');

addHeader('3. Cómo hacer una Venta (Punto de Venta / Caja)');
addText('Este es el lugar que más usarás en el día a día para cobrar a los clientes.');
addSubHeader('Paso a paso para registrar una venta:');
addBullet('1. Ve al menú "Punto de Venta".');
addBullet('2. En la barra de búsqueda, escribe el nombre de la prenda o el código. Verás que aparecen los resultados.');
addBullet('3. Haz clic en el producto que el cliente se lleva. Esto lo agregará al "Carrito" (a la derecha). Si lleva 2 iguales, puedes cambiar el número donde dice cantidad.');
addBullet('4. Selecciona el Cliente: Por defecto dice "Consumidor Final". Si es un cliente registrado, búscalo en la lista desplegable.');
addBullet('5. Elige la Modalidad de Pago: Selecciona "CONTADO" si el cliente te paga en el momento. Luego elige si fue en Efectivo, Transferencia o código QR.');
addBullet('6. Finalmente, haz clic en el botón verde gigante "Confirmar Venta".');
addText('¡Importante! Al confirmar, el sistema automáticamente:');
addBullet('- Descuenta el stock de ese producto.');
addBullet('- Guarda el dinero en la Caja Diaria.');
addBullet('- Le calcula la comisión exacta a la vendedora que hizo la venta.');
addText('Al terminar, aparecerá un botón para "Descargar Ticket", el cual genera un PDF no fiscal que puedes imprimir o enviar por WhatsApp al cliente.');

addHeader('4. Cómo registrar y manejar Clientes');
addText('Si quieres llevar un registro de quién te compra, ve al menú "Clientes".');
addBullet('Haz clic en "+ Nuevo Cliente" y completa su nombre y teléfono.');
addBullet('Cuentas Corrientes (Fiado): Si le vendes a un cliente de confianza y te paga después, en el Punto de Venta debes elegir Modalidad "A CUENTA CORRIENTE". Esto no sumará dinero a tu caja de hoy, sino que le generará una deuda al cliente. Podrás ver y cobrar sus deudas desde el perfil del cliente.');

addHeader('5. Control de Caja y Rendición de Vendedores');
addText('Al final del día o de la semana, querrás saber cuánto dinero entró y cuánto debes pagarle a tus vendedoras.');
addSubHeader('Paso a paso para ver la caja:');
addBullet('1. Ve al menú "Caja Diaria".');
addBullet('2. Elige las fechas (por ejemplo, desde el lunes hasta hoy).');
addBullet('3. Verás tres recuadros principales: cuánto entró en total, cuánto de ese total fue por Efectivo/Transferencia/QR, y la "Rentabilidad Real" (te muestra la ganancia neta luego de restar el costo de las prendas y las comisiones).');
addSubHeader('Para pagarle a una vendedora:');
addBullet('En esa misma pantalla de Caja, hay un cuadro para seleccionar a una vendedora. Elige su nombre y haz clic en "Descargar Rendición PDF". El sistema te dará un documento exacto con el detalle de todo lo que vendió y el total exacto de comisiones que debes abonarle.');

addHeader('6. Usuarios y Configuración de Comisiones');
addText('Solo el Administrador puede agregar vendedoras al sistema.');
addBullet('1. Ve al menú "Usuarios".');
addBullet('2. Haz clic en "Nuevo Usuario". Completa su nombre, un email y una contraseña provisoria (el sistema le pedirá que la cambie cuando ingrese).');
addBullet('3. Tipo de Comisión: Puedes elegir que gane un "Porcentaje" (ej. 10% de cada venta) o un monto "Fijo" (ej. $500 por cada prenda vendida).');

doc.moveDown(3);
doc.fontSize(10).fillColor('#aaaaaa').text('Este manual fue generado automáticamente por el sistema.', { align: 'center' });
doc.text('Amore Mío Lencería - Desarrollado por RolΦ Studio', { align: 'center' });

doc.end();
console.log('Manual comprensivo generado con exito!');
