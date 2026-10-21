import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possiblePaths = [
  path.join(process.cwd(), 'public/assets/logo_final.jpg'), // Vercel
  path.join(__dirname, '../../../client/public/assets/logo_final.jpg'), // Local monorepo
  path.join(__dirname, '../../public/assets/logo_final.jpg') // Local server
];
const logoPath = possiblePaths.find(p => fs.existsSync(p));

const possibleRolphiPaths = [
  path.join(process.cwd(), 'public/assets/rolphi.jpg'),
  path.join(__dirname, '../../../client/public/assets/rolphi.jpg'),
  path.join(__dirname, '../../public/assets/rolphi.jpg')
];
const rolphiPath = possibleRolphiPaths.find(p => fs.existsSync(p));

function drawHeader(doc, title, subtitle = '') {
  // Brand Header
  if (logoPath) {
    try {
      doc.image(logoPath, 45, 45, { width: 70 });
    } catch (e) {
      console.error('Error loading logo in PDF:', e);
    }
  }

  doc.fillColor('#C45A78')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('AMORE MÍO', 130, 45);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666666')
     .text('Ropa Interior • Para Él y Para Ella', 130, 70);

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#1A1A1A')
     .text(title, 130, 85);

  if (subtitle) {
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#888888')
       .text(subtitle, 130, 103);
  }

  // Pink horizontal bar divider
  doc.moveTo(45, 120)
     .lineTo(550, 120)
     .strokeColor('#E598AC')
     .lineWidth(2)
     .stroke();
}

function drawFooter(doc) {
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.moveTo(45, 740)
       .lineTo(550, 740)
       .strokeColor('#E0E0E0')
       .lineWidth(1)
       .stroke();

    doc.fontSize(8)
       .fillColor('#888888')
       .text(`Amore Mío - Ropa Interior | Emisión: ${new Date().toLocaleDateString('es-AR')}`, 45, 750);

    doc.text(`Página ${i + 1} de ${pageCount}`, 0, 750, { align: 'right', width: 550 });

    doc.fillColor('#C45A78')
       .text('Desarrollado por RolΦ Studio', 45, 762, { align: 'center', width: 505 });
  }
}

// 1. Generate Catalog PDF
export function generateCatalogPDF(products, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  drawHeader(doc, 'CATÁLOGO DE PRODUCTOS', `Generado el ${new Date().toLocaleDateString('es-AR')}`);

  let y = 140;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1A1A1A');
  doc.text('CÓDIGO', 45, y);
  doc.text('PRODUCTO / DESCRIPCIÓN', 120, y);
  doc.text('CATEGORÍA', 350, y);
  doc.text('ESTADO', 450, y);
  doc.text('PRECIO', 500, y, { align: 'right' });

  y += 15;
  doc.moveTo(45, y).lineTo(550, y).strokeColor('#CCCCCC').lineWidth(1).stroke();
  y += 10;

  doc.font('Helvetica').fontSize(9);

  products.forEach((prod) => {
    if (y > 700) {
      doc.addPage();
      drawHeader(doc, 'CATÁLOGO DE PRODUCTOS (cont.)');
      y = 140;
    }

    doc.fillColor('#333333').text(prod.code, 45, y);
    doc.font('Helvetica-Bold').text(prod.name, 120, y);
    
    if (prod.description) {
      doc.font('Helvetica').fontSize(8).fillColor('#666666').text(prod.description, 120, y + 12, { width: 220 });
    }

    doc.font('Helvetica').fontSize(9).fillColor('#333333').text(prod.category_name || 'Sin categoría', 350, y);

    const isAvailable = prod.stock > 0;
    doc.fillColor(isAvailable ? '#2E7D32' : '#C62828')
       .text(isAvailable ? 'DISPONIBLE' : 'AGOTADO', 450, y);

    doc.fillColor('#C45A78')
       .font('Helvetica-Bold')
       .text(`$${Number(prod.sale_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 470, y, { align: 'right', width: 80 });

    y += prod.description ? 28 : 20;
    doc.moveTo(45, y - 5).lineTo(550, y - 5).strokeColor('#F0F0F0').lineWidth(0.5).stroke();
  });

  drawFooter(doc);
  doc.end();
}

// 2. Generate Customer Credit Account PDF (Cuenta Corriente)
export function generateCustomerCreditPDF(customer, movements, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  drawHeader(doc, `ESTADO DE CUENTA CORRIENTE - ${customer.name.toUpperCase()}`, `Teléfono: ${customer.phone || 'N/A'} | Email: ${customer.email || 'N/A'}`);

  let y = 135;

  // Summary box
  doc.rect(45, y, 505, 45).fill('#FFF5F7').stroke('#E598AC');
  doc.fillColor('#C45A78').fontSize(11).font('Helvetica-Bold').text('RESUMEN DE CUENTA', 60, y + 10);
  doc.fillColor('#333333').fontSize(10).font('Helvetica').text(`Saldo deudor actual: `, 60, y + 26);
  doc.fillColor('#C45A78').font('Helvetica-Bold').text(`$${Number(customer.credit_balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 170, y + 26);

  doc.fillColor('#333333').font('Helvetica').text(`Límite autorizado: $${Number(customer.credit_limit).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 350, y + 26);

  y += 60;

  // Table Headers
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1A1A1A');
  doc.text('FECHA', 45, y);
  doc.text('TIPO DE MOVIMIENTO', 120, y);
  doc.text('NOTAS / VENTA', 240, y);
  doc.text('VENCIMIENTO', 390, y);
  doc.text('MONTO', 480, y, { align: 'right' });

  y += 15;
  doc.moveTo(45, y).lineTo(550, y).strokeColor('#CCCCCC').lineWidth(1).stroke();
  y += 10;

  doc.font('Helvetica').fontSize(9);

  movements.forEach((mov) => {
    if (y > 700) {
      doc.addPage();
      drawHeader(doc, `ESTADO DE CUENTA CORRIENTE - ${customer.name.toUpperCase()} (cont.)`);
      y = 140;
    }

    const isDebit = mov.type === 'DEBIT';
    const dateStr = new Date(mov.created_at).toLocaleDateString('es-AR');
    const dueDateStr = mov.due_date ? new Date(mov.due_date).toLocaleDateString('es-AR') : '-';

    doc.fillColor('#333333').text(dateStr, 45, y);
    doc.fillColor(isDebit ? '#C62828' : '#2E7D32')
       .font('Helvetica-Bold')
       .text(isDebit ? 'CARGO / DEUDA (+)' : 'PAGO / ABONO (-)', 120, y);

    doc.font('Helvetica').fillColor('#555555').text(mov.notes || `Venta #${mov.sale_id || 'N/A'}`, 240, y, { width: 140 });
    doc.text(dueDateStr, 390, y);

    const amountFormatted = `${isDebit ? '+' : '-'}$${Number(mov.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    doc.fillColor(isDebit ? '#C62828' : '#2E7D32')
       .font('Helvetica-Bold')
       .text(amountFormatted, 460, y, { align: 'right', width: 90 });

    y += 22;
    doc.moveTo(45, y - 5).lineTo(550, y - 5).strokeColor('#F0F0F0').lineWidth(0.5).stroke();
  });

  drawFooter(doc);
  doc.end();
}

// 3. Generate Seller Settlement PDF (Rendición por Vendedor)
export function generateSellerSettlementPDF(seller, sales, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  drawHeader(doc, `RENDICIÓN DE VENTAS Y COMISIONES`, `Vendedor: ${seller.name} | Comisión: ${seller.commission_type === 'PERCENTAGE' ? `${seller.commission_value}%` : `$${seller.commission_value} fijo`}`);

  let y = 135;

  let totalSales = 0;
  let totalCommissions = 0;
  let cashSales = 0;
  let transferSales = 0;
  let qrSales = 0;
  let creditSales = 0;

  sales.forEach(s => {
    totalSales += Number(s.total);
    totalCommissions += Number(s.seller_commission);
    if (s.payment_method === 'CASH') cashSales += Number(s.total);
    else if (s.payment_method === 'TRANSFER') transferSales += Number(s.total);
    else if (s.payment_method === 'QR') qrSales += Number(s.total);
    else if (s.payment_method === 'CREDIT_ACCOUNT') creditSales += Number(s.total);
  });

  // Summary box
  doc.rect(45, y, 505, 55).fill('#FFF5F7').stroke('#E598AC');
  doc.fillColor('#C45A78').fontSize(10).font('Helvetica-Bold').text('RESUMEN DE OPERACIONES', 60, y + 8);
  
  doc.fillColor('#333333').fontSize(9).font('Helvetica')
     .text(`Ventas Totales: $${totalSales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 60, y + 24)
     .text(`Comisión a pagar: $${totalCommissions.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 60, y + 38);

  doc.text(`Efectivo: $${cashSales.toLocaleString('es-AR')}`, 250, y + 24)
     .text(`Transferencia: $${transferSales.toLocaleString('es-AR')}`, 250, y + 38);

  doc.text(`QR: $${qrSales.toLocaleString('es-AR')}`, 400, y + 24)
     .text(`Cta. Cte: $${creditSales.toLocaleString('es-AR')}`, 400, y + 38);

  y += 70;

  // Table Headers
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1A1A1A');
  doc.text('Nº VENTA', 45, y);
  doc.text('FECHA', 110, y);
  doc.text('CLIENTE', 180, y);
  doc.text('MEDIO PAGO', 310, y);
  doc.text('TOTAL VENTA', 400, y, { align: 'right' });
  doc.text('COMISIÓN', 480, y, { align: 'right' });

  y += 15;
  doc.moveTo(45, y).lineTo(550, y).strokeColor('#CCCCCC').lineWidth(1).stroke();
  y += 10;

  doc.font('Helvetica').fontSize(9);

  sales.forEach((s) => {
    if (y > 700) {
      doc.addPage();
      drawHeader(doc, `RENDICIÓN DE VENTAS - ${seller.name.toUpperCase()} (cont.)`);
      y = 140;
    }

    doc.fillColor('#333333').text(s.sale_number, 45, y);
    doc.text(new Date(s.created_at).toLocaleDateString('es-AR'), 110, y);
    doc.text(s.customer_name || 'Consumidor Final', 180, y, { width: 120 });
    doc.text(s.payment_method, 310, y);

    doc.font('Helvetica-Bold')
       .text(`$${Number(s.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 380, y, { align: 'right', width: 80 });

    doc.fillColor('#C45A78')
       .text(`$${Number(s.seller_commission).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 470, y, { align: 'right', width: 80 });

    y += 20;
    doc.moveTo(45, y - 5).lineTo(550, y - 5).strokeColor('#F0F0F0').lineWidth(0.5).stroke();
  });

  drawFooter(doc);
  doc.end();
}

export function generateSaleTicketPDF(sale, items, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A5' });
  doc.pipe(res);

  drawHeader(doc, 'PRESUPUESTO / REMITO', `Nº ${sale.sale_number} - ${new Date(sale.created_at).toLocaleDateString('es-AR')}`);

  // Draw X box for non-fiscal receipt (Argentine convention)
  doc.rect(190, 40, 40, 40).strokeColor('#333').lineWidth(1).stroke();
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#333').text('X', 190, 48, { width: 40, align: 'center' });
  doc.fontSize(6).font('Helvetica').text('DOCUMENTO', 190, 85, { width: 40, align: 'center' });
  
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#888').text('DOCUMENTO NO VÁLIDO COMO COMPROBANTE FISCAL', 45, 120, { width: 320, align: 'center' });

  let y = 145;

  // Customer Info
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('Cliente:', 45, y);
  doc.font('Helvetica').text(sale.customer_name || 'Consumidor Final', 95, y);
  y += 15;
  if (sale.customer_document) {
    doc.font('Helvetica-Bold').text('DNI/CUIT:', 45, y);
    doc.font('Helvetica').text(sale.customer_document, 105, y);
    y += 15;
  }
  doc.font('Helvetica-Bold').text('Atendido por:', 45, y);
  doc.font('Helvetica').text(sale.seller_name, 115, y);
  y += 20;

  // Table header
  doc.rect(45, y, 320, 18).fill('#F8F9FA');
  doc.fillColor('#1A1A1A').fontSize(8).font('Helvetica-Bold');
  doc.text('CANT', 50, y + 5);
  doc.text('ARTÍCULO', 90, y + 5);
  doc.text('P.UNIT', 250, y + 5, { width: 50, align: 'right' });
  doc.text('SUBT', 310, y + 5, { width: 50, align: 'right' });
  y += 25;

  doc.font('Helvetica').fontSize(9).fillColor('#333');
  items.forEach(item => {
    if (y > 520) {
      doc.addPage({ margin: 45, size: 'A5' });
      drawHeader(doc, 'TICKET DE COMPRA (cont.)');
      y = 140;
    }
    
    doc.text(item.quantity, 50, y);
    doc.text(`${item.product_code} - ${item.product_name}`, 90, y, { width: 150 });
    doc.text(`$${Number(item.unit_sale_price).toLocaleString('es-AR')}`, 250, y, { width: 50, align: 'right' });
    doc.text(`$${Number(item.subtotal).toLocaleString('es-AR')}`, 310, y, { width: 50, align: 'right' });
    y += Math.max(20, doc.heightOfString(`${item.product_code} - ${item.product_name}`, { width: 150 }) + 10);
  });

  // Totals
  doc.moveTo(45, y).lineTo(365, y).strokeColor('#E0E0E0').lineWidth(1).stroke();
  y += 10;
  
  if (Number(sale.discount) > 0) {
    doc.font('Helvetica').fontSize(10);
    doc.text('Descuento:', 200, y, { width: 100, align: 'right' });
    doc.text(`-$${Number(sale.discount).toLocaleString('es-AR')}`, 310, y, { width: 50, align: 'right' });
    y += 15;
  }

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#C45A78');
  doc.text('TOTAL:', 200, y, { width: 100, align: 'right' });
  doc.text(`$${Number(sale.total).toLocaleString('es-AR')}`, 310, y, { width: 50, align: 'right' });
  
  y += 30;
  doc.font('Helvetica').fontSize(8).fillColor('#888').text('Gracias por elegir Amore Mío.', 45, y, { align: 'center', width: 320 });

  doc.end();
}

/**
 * Genera el Certificado Oficial de Licencia & Suscripción en PDF (RolΦ Studio)
 */
export function generateLicenseCertificatePDF(res, license) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4'
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Certificado_Licencia_${license.licenseCode || 'Amore_Mio'}.pdf"`
  );

  doc.pipe(res);

  // Outer border & background accent
  doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor('#047857').stroke();
  doc.rect(25, 25, 545, 792).lineWidth(0.5).strokeColor('#10b981').stroke();

  // Top header background (Dark Emerald)
  doc.rect(25, 25, 545, 105).fillColor('#064e3b').fill();

  // Rolphi Logo if available
  if (rolphiPath) {
    try {
      doc.image(rolphiPath, 45, 38, { width: 75 });
    } catch (e) {
      console.error('Error drawing rolphi logo:', e);
    }
  }

  // Header texts
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(16)
     .text('ROLΦ STUDIO', 135, 42);

  doc.fillColor('#a7f3d0')
     .font('Helvetica-Bold')
     .fontSize(9.5)
     .text('SUPERVISIÓN TÉCNICA & DESARROLLO DE SOFTWARE INDEPENDIENTE', 135, 62);

  doc.fillColor('#e2e8f0')
     .font('Helvetica')
     .fontSize(8.5)
     .text('Contacto Oficial: martinchiacchio.seg@gmail.com • Soporte Activo', 135, 78);

  // Big Title Banner
  doc.rect(40, 150, 515, 36).fillColor('#ecfdf5').fill();
  doc.rect(40, 150, 515, 36).lineWidth(1).strokeColor('#a7f3d0').stroke();

  doc.fillColor('#065f46')
     .font('Helvetica-Bold')
     .fontSize(13)
     .text('CERTIFICADO OFICIAL DE LICENCIA & SUSCRIPCIÓN', 40, 162, { align: 'center', width: 515 });

  // Main Card Box (Emerald theme)
  const cardY = 200;
  doc.roundedRect(40, cardY, 515, 425, 10).fillColor('#ffffff').fill();
  doc.roundedRect(40, cardY, 515, 425, 10).lineWidth(1.5).strokeColor('#10b981').stroke();

  // Green header strip inside box
  doc.roundedRect(40, cardY, 515, 38, 10).fillColor('#047857').fill();
  doc.rect(40, cardY + 20, 515, 18).fillColor('#047857').fill();

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(11)
     .text('ESTADO DEL SISTEMA: LICENCIA ACTIVA Y VIGENTE', 40, cardY + 13, { align: 'center', width: 515 });

  // Certificate Fields Grid
  let y = cardY + 54;
  const drawRow = (label, value, isHighlight = false) => {
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(10).text(label, 60, y, { width: 175 });
    if (isHighlight) {
      doc.fillColor('#047857').font('Helvetica-Bold').fontSize(10.5).text(String(value), 240, y, { width: 290 });
    } else {
      doc.fillColor('#1e293b').font('Helvetica').fontSize(10).text(String(value), 240, y, { width: 290 });
    }
    y += 24;
    doc.moveTo(60, y - 5).lineTo(530, y - 5).lineWidth(0.5).strokeColor('#f1f5f9').stroke();
  };

  drawRow('Software Autorizado:', 'Amore Mío - Sistema de Gestión Comercial', true);
  drawRow('Titular / Cliente:', 'Amore Mío Lencería');
  drawRow('Plan de Licencia:', license.planName || 'Plan Comercial RolΦ Studio', true);
  drawRow('Días Otorgados en este Plan:', `${license.daysGranted || 30} días corridos`);
  drawRow('Fecha de Otorgamiento:', license.grantedAt || new Date().toLocaleDateString('es-AR'));
  drawRow('Fecha de Vencimiento:', license.expirationDate || 'Vigente', true);
  drawRow('Contador de Días Restantes:', `${license.daysRemaining} días de validez activa`, true);
  drawRow('Código Único de Certificado:', license.licenseCode || 'ROLPHI-LIC-2026-OK', true);
  drawRow('Tipo de Mantenimiento:', 'Supervisión Técnica y Actualizaciones en la Nube');
  drawRow('Entorno de Producción:', 'Vercel Serverless + Base de Datos LibSQL');
  if (license.notes) {
    drawRow('Observaciones:', license.notes);
  }

  // Legal / Terms Notice Box
  const noticeY = 645;
  doc.roundedRect(40, noticeY, 515, 75, 8).fillColor('#f8fafc').fill();
  doc.roundedRect(40, noticeY, 515, 75, 8).lineWidth(1).strokeColor('#e2e8f0').stroke();

  doc.fillColor('#065f46')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text('CONDICIONES DE VALIDEZ & SOPORTE TÉCNICO:', 55, noticeY + 10);

  doc.fillColor('#64748b')
     .font('Helvetica')
     .fontSize(7.5)
     .text(
       'Este documento digital certifica que la instalación de Amore Mío cuenta con la licencia técnica correspondiente otorgada por RolΦ Studio. Los días restantes se computan en tiempo real contra los servidores del sistema. Al vencer el plazo otorgado, el administrador podrá solicitar la renovación a través de los canales oficiales de contacto.',
       55,
       noticeY + 23,
       { width: 485, lineGap: 2 }
     );

  // Bottom Seal / Signature
  const footerY = 740;
  doc.moveTo(40, footerY).lineTo(555, footerY).lineWidth(1).strokeColor('#cbd5e1').stroke();

  doc.fillColor('#064e3b')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('ROLΦ STUDIO • DEPARTAMENTO TÉCNICO', 55, footerY + 12);

  doc.fillColor('#94a3b8')
     .font('Helvetica')
     .fontSize(8)
     .text(`Certificado emitido para Amore Mío el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')} hs.`, 55, footerY + 26);

  doc.fillColor('#059669')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('✓ VERIFICADO DIGITALMENTE', 410, footerY + 12, { align: 'right', width: 140 });

  doc.fillColor('#64748b')
     .font('Helvetica')
     .fontSize(8)
     .text('Firma Digital RolΦ Studio', 410, footerY + 26, { align: 'right', width: 140 });

  doc.end();
}
