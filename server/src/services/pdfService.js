import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '../../public/assets/logo.jpg');

function drawHeader(doc, title, subtitle = '') {
  // Brand Header
  if (fs.existsSync(logoPath)) {
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
