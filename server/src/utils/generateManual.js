import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({ margin: 50 });
const dest = path.join(process.cwd(), '../../../client/public/assets/Manual_Amore_Mio.pdf');
doc.pipe(fs.createWriteStream(dest));

// Colors
const pink = '#e598ac';
const darkPink = '#c45a78';
const dark = '#333333';

// Title
doc.fontSize(24).fillColor(darkPink).font('Helvetica-Bold').text('Manual de Usuario: Amore Mio', { align: 'center' });
doc.fontSize(12).fillColor(dark).font('Helvetica').text('Gestion Comercial y Punto de Venta', { align: 'center' });
doc.moveDown(2);

// Intro
doc.fontSize(16).fillColor(darkPink).text('Bienvenida al Sistema');
doc.fontSize(11).fillColor(dark).moveDown(0.5);
doc.text('¡Hola! Este manual esta disenado para ayudarte a sacar el maximo provecho de la plataforma Amore Mio. Nuestro sistema centraliza tus ventas, el control de stock de lenceria, la administracion de clientes y el calculo automatico de tus ganancias.');
doc.moveDown();
doc.text('El sistema cuenta con dos niveles de acceso:');
doc.text('1. Administrador/Manager: Control total sobre precios, costos, proveedores y alta de vendedores.', { indent: 20 });
doc.text('2. Vendedor: Acceso simplificado exclusivo para vender, ver el catalogo y registrar ingresos/egresos de caja.', { indent: 20 });
doc.moveDown(2);

// POS
doc.fontSize(16).fillColor(darkPink).text('Punto de Venta (Caja)');
doc.fontSize(10).fillColor('#666').text('Acceso: Vendedores y Administradores');
doc.fontSize(11).fillColor(dark).moveDown(0.5);
doc.text('Es el corazon del sistema, donde registraras las ventas del dia a dia.');
doc.moveDown(0.5);
doc.text('- Busqueda rapida: Podes buscar productos por nombre o codigo.');
doc.text('- Carrito de compras: Al hacer clic en un producto con stock, se suma automaticamente al carrito.');
doc.text('- Clientes: Podes elegir a un cliente o dejarlo en blanco (Consumidor Final).');
doc.text('- Descuentos: Permite aplicar descuentos al total de la compra antes de cerrarla.');
doc.text('- Ticket: Al finalizar la venta, podes descargar un Presupuesto/Remito en formato PDF.');
doc.moveDown();
doc.fillColor(darkPink).font('Helvetica-Bold').text('Ventaja: ', { continued: true }).fillColor(dark).font('Helvetica').text('Al confirmar la venta, el sistema descuenta el stock automaticamente y calcula la comision exacta del vendedor que esta en la caja.');
doc.moveDown(2);

// Products
doc.fontSize(16).fillColor(darkPink).text('Productos y Catalogo');
doc.fontSize(10).fillColor('#666').text('Acceso: Administradores / Vendedores (Solo vista)');
doc.fontSize(11).fillColor(dark).moveDown(0.5);
doc.text('- Carga Inteligente de Precios: Podes ingresar el Costo y el Porcentaje de Ganancia esperado, y el sistema calcula el Precio de Venta automaticamente.');
doc.text('- Ocultar/Publicar en la Web: Con un clic en el "Ojo", el producto aparece o desaparece de la Landing Page al instante.');
doc.text('- Alertas de Stock: Los productos que lleguen al nivel minimo se marcaran en rojo.');
doc.moveDown(2);

// Web
doc.fontSize(16).fillColor(darkPink).text('Catalogo Web (Landing Page)');
doc.fontSize(10).fillColor('#666').text('Acceso: Publico');
doc.fontSize(11).fillColor(dark).moveDown(0.5);
doc.text('- Compartir facilmente: Un boton para copiar el enlace de tu catalogo y enviarlo por redes sociales.');
doc.text('- PDF del Catalogo: Los clientes pueden descargar un PDF completo con todos tus productos.');
doc.text('- WhatsApp Directo: Conecta a los clientes con tu numero con un solo clic.');
doc.moveDown(2);

// Users
doc.fontSize(16).fillColor(darkPink).text('Usuarios y Comisiones');
doc.fontSize(11).fillColor(dark).moveDown(0.5);
doc.text('Configuracion de tu equipo. Al crear un Vendedor, podes asignarle una comision FIJA o por PORCENTAJE. El sistema se encarga de sumar las comisiones por cada venta cerrada sin calculos extra.');
doc.moveDown(2);

// Box
doc.fontSize(16).fillColor(darkPink).text('Caja Diaria y Rendicion');
doc.fontSize(11).fillColor(dark).moveDown(0.5);
doc.text('- Resumen Automatico: Efectivo, Transferencia o QR separados.');
doc.text('- Rentabilidad Real: Te muestra tu Ganancia Neta restando costos y comisiones.');
doc.text('- Descargar Rendicion PDF: Un informe que detalla exactamente todas las ventas del vendedor y cuanta comision le corresponde cobrar.');
doc.moveDown(3);

doc.fontSize(10).fillColor('#888').text('Desarrollado por RolΦ Studio', { align: 'center' });

doc.end();
console.log('Manual generado con exito!');
