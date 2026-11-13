const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EXPORT_ROOT } = require('../db/paths');

function formatCurrency(amount) {
  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function generateInvoicePDF(invoice, company, customer) {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const exportDir = EXPORT_ROOT;
  
  // Ensure exports directory exists
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filename = `faktura-${invoice.invoice_number || invoice.id}.pdf`;
  const filepath = path.join(exportDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Colors (legacy PDF palette; the app UI colours live in docs/design-system/tokens.json)
  const brandDeep = '#0d3e51';
  const brandBase = '#2f8981';
  const brandLift = '#67b999';
  const textDark = '#0d3e51';
  const textSoft = '#3d6574';
  const textSubtle = '#6e8b97';
  const bgLight = '#f0f8f5';
  const borderColor = '#d5e7e6';
  const borderLight = '#e1f1eb';

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 60;
  const contentWidth = pageWidth - (margin * 2);

  // Header with brand color bar
  doc.rect(0, 0, pageWidth, 120)
    .fill(brandDeep);
  
  // Company name in header
  if (company?.name) {
    doc.fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(company.name, margin, 40, { width: contentWidth });
  }

  // Invoice title
  doc.fillColor('#ffffff')
    .fontSize(32)
    .font('Helvetica-Bold')
    .text('FAKTURA', margin, 70, { width: contentWidth });

  // Main content area starts at y = 140
  let currentY = 140;

  // Top section: Invoice details and company info side by side
  const leftColWidth = 240;
  const rightColWidth = contentWidth - leftColWidth - 40;
  const rightColX = margin + leftColWidth + 40;

  // Left column: Company details
  doc.fillColor(textDark)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Fra:', margin, currentY);
  
  currentY += 18;
  if (company?.name) {
    doc.fillColor(textDark)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(company.name, margin, currentY);
    currentY += 16;
  }
  
  let companyInfoY = currentY;
  if (company?.org_number) {
    doc.fillColor(textSubtle)
      .fontSize(9)
      .text(`Org.nr: ${company.org_number}`, margin, companyInfoY);
    companyInfoY += 14;
  }
  if (company?.address) {
    doc.fillColor(textSoft)
      .fontSize(9)
      .text(company.address, margin, companyInfoY);
    companyInfoY += 14;
  }
  if (company?.post_number && company?.post_location) {
    doc.text(`${company.post_number} ${company.post_location}`, margin, companyInfoY);
    companyInfoY += 14;
  }
  if (company?.contact_email) {
    doc.text(company.contact_email, margin, companyInfoY);
    companyInfoY += 14;
  }
  if (company?.contact_number) {
    doc.text(company.contact_number, margin, companyInfoY);
    companyInfoY += 14;
  }

  // Right column: Invoice details in a box
  const invoiceBoxY = currentY - 18;
  const invoiceBoxHeight = 100;
  
  // Background box for invoice details
  doc.rect(rightColX, invoiceBoxY, rightColWidth, invoiceBoxHeight)
    .fill(bgLight)
    .stroke(borderColor)
    .lineWidth(1);
  
  let invoiceY = invoiceBoxY + 15;
  
  // Invoice number (prominent)
  doc.fillColor(textSubtle)
    .fontSize(8)
    .font('Helvetica')
    .text('FAKTURANUMMER', rightColX + 12, invoiceY, { width: rightColWidth - 24 });
  invoiceY += 12;
  doc.fillColor(brandDeep)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(invoice.invoice_number || `#${invoice.id}`, rightColX + 12, invoiceY, { width: rightColWidth - 24 });
  invoiceY += 25;

  // Invoice date and due date side by side
  const dateColWidth = (rightColWidth - 36) / 2;
  
  if (invoice.invoice_date) {
    doc.fillColor(textSubtle)
      .fontSize(8)
      .font('Helvetica')
      .text('FAKTURADATO', rightColX + 12, invoiceY, { width: dateColWidth });
    doc.fillColor(textDark)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(formatDate(invoice.invoice_date), rightColX + 12, invoiceY + 12, { width: dateColWidth });
  }
  
  if (invoice.due_date) {
    doc.fillColor(textSubtle)
      .fontSize(8)
      .font('Helvetica')
      .text('FORFALLSDATO', rightColX + 12 + dateColWidth + 12, invoiceY, { width: dateColWidth });
    doc.fillColor(textDark)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(formatDate(invoice.due_date), rightColX + 12 + dateColWidth + 12, invoiceY + 12, { width: dateColWidth });
  }

  // Customer section
  currentY = Math.max(companyInfoY, invoiceBoxY + invoiceBoxHeight) + 30;
  
  doc.fillColor(textDark)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Til:', margin, currentY);
  
  currentY += 18;
  if (customer?.name) {
    doc.fillColor(textDark)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(customer.name, margin, currentY);
    currentY += 16;
  }
  
  let customerY = currentY;
  if (customer?.org_number) {
    doc.fillColor(textSubtle)
      .fontSize(9)
      .text(`Org.nr: ${customer.org_number}`, margin, customerY);
    customerY += 14;
  }
  if (customer?.address) {
    doc.fillColor(textSoft)
      .fontSize(9)
      .text(customer.address, margin, customerY);
    customerY += 14;
  }
  if (customer?.post_number && customer?.post_location) {
    doc.text(`${customer.post_number} ${customer.post_location}`, margin, customerY);
    customerY += 14;
  }
  if (customer?.contact_name) {
    doc.text(`Kontakt: ${customer.contact_name}`, margin, customerY);
    customerY += 14;
  }
  if (customer?.email) {
    doc.text(customer.email, margin, customerY);
    customerY += 14;
  }
  if (customer?.phone) {
    doc.text(customer.phone, margin, customerY);
    customerY += 14;
  }

  // References section (if any)
  let refY = customerY + 20;
  if (invoice.your_reference || invoice.our_reference) {
    if (invoice.your_reference) {
      doc.fillColor(textSubtle)
        .fontSize(8)
        .text(`Deres referanse: `, margin, refY);
      doc.fillColor(textDark)
        .fontSize(9)
        .text(invoice.your_reference, margin + 80, refY);
      refY += 14;
    }
    if (invoice.our_reference) {
      doc.fillColor(textSubtle)
        .fontSize(8)
        .text(`Vår referanse: `, margin, refY);
      doc.fillColor(textDark)
        .fontSize(9)
        .text(invoice.our_reference, margin + 80, refY);
      refY += 14;
    }
  }

  // Line items table
  let tableY = refY + 25;
  
  // Column positions and widths - precisely calculated to fit perfectly
  const padding = 12;
  const colGap = 10;
  
  // Start from left margin + padding
  let currentX = margin + padding;
  
  // Description column (widest)
  const colDescX = currentX;
  const colDescWidth = 210;
  currentX += colDescWidth + colGap;
  
  // Quantity column
  const colQtyX = currentX;
  const colQtyWidth = 42;
  currentX += colQtyWidth + colGap;
  
  // Price column
  const colPriceX = currentX;
  const colPriceWidth = 72;
  currentX += colPriceWidth + colGap;
  
  // VAT column
  const colVatX = currentX;
  const colVatWidth = 42;
  currentX += colVatWidth + colGap;
  
  // Total column (rightmost) - ensure it fits with padding
  const colTotalX = currentX;
  const colTotalWidth = Math.min(75, margin + contentWidth - padding - currentX);
  
  // Verify everything fits
  const tableRightEdge = colTotalX + colTotalWidth;
  const maxRight = margin + contentWidth - padding;
  
  // Table header with background
  const headerHeight = 30;
  doc.rect(margin, tableY, contentWidth, headerHeight)
    .fill(brandDeep);
  
  doc.fillColor('#ffffff')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Beskrivelse', colDescX, tableY + 9, { width: colDescWidth });
  
  // Center "Antall" in its column
  const antallText = 'Antall';
  const antallTextWidth = doc.widthOfString(antallText, { fontSize: 9 });
  doc.text(antallText, colQtyX + (colQtyWidth - antallTextWidth) / 2, tableY + 9);
  
  doc.text('Pris', colPriceX, tableY + 9, { width: colPriceWidth, align: 'right' });
  doc.text('MVA', colVatX, tableY + 9, { width: colVatWidth, align: 'right' });
  doc.text('Total', colTotalX, tableY + 9, { width: colTotalWidth, align: 'right' });

  tableY += headerHeight;

  // Line items with alternating row colors
  const items = invoice.items || [];
  items.forEach((item, index) => {
    const rowHeight = 25;
    const isEven = index % 2 === 0;
    
    if (isEven) {
      doc.rect(margin, tableY, contentWidth, rowHeight)
        .fill(bgLight);
    }
    
    // Calculate line height based on description length
    const descriptionLines = doc.heightOfString(item.description || '', {
      width: colDescWidth,
      fontSize: 9
    });
    const actualRowHeight = Math.max(rowHeight, descriptionLines + 8);
    
    // Description
    doc.fillColor(textDark)
      .fontSize(9)
      .font('Helvetica')
      .text(item.description || '', colDescX, tableY + 8, { width: colDescWidth, lineGap: 2 });
    
    // Quantity - centered in column
    const quantity = item.quantity || 0;
    const qtyText = String(quantity);
    const qtyTextWidth = doc.widthOfString(qtyText, { fontSize: 9 });
    doc.text(qtyText, colQtyX + (colQtyWidth - qtyTextWidth) / 2, tableY + 8);
    
    // Unit price
    const unitPrice = item.unitPrice || item.unit_price || 0;
    doc.text(formatCurrency(unitPrice), colPriceX, tableY + 8, { width: colPriceWidth, align: 'right' });
    
    // VAT rate
    const vatRate = item.vatRate != null ? item.vatRate : item.vat_rate || 0;
    doc.text(`${(vatRate * 100).toFixed(0)}%`, colVatX, tableY + 8, { width: colVatWidth, align: 'right' });
    
    // Line total
    const lineTotal = quantity * unitPrice * (1 + vatRate);
    doc.font('Helvetica-Bold')
      .text(formatCurrency(lineTotal), colTotalX, tableY + 8, { width: colTotalWidth, align: 'right' });
    
    // Reset font
    doc.font('Helvetica');
    
    // Row separator
    doc.strokeColor(borderLight)
      .lineWidth(0.5)
      .moveTo(margin, tableY + actualRowHeight)
      .lineTo(margin + contentWidth, tableY + actualRowHeight)
      .stroke();
    
    tableY += actualRowHeight;
  });

  // Totals section (right-aligned)
  const totalsY = tableY + 25;
  const totalsWidth = 220;
  const totalsX = margin + contentWidth - totalsWidth;
  
  // Subtotals box
  doc.rect(totalsX, totalsY, totalsWidth, 80)
    .fill(bgLight)
    .stroke(borderColor)
    .lineWidth(1);
  
  let totalsContentY = totalsY + 15;
  
  // Subtotal
  doc.fillColor(textSubtle)
    .fontSize(9)
    .font('Helvetica')
    .text('Delsum:', totalsX + 12, totalsContentY, { width: totalsWidth - 24, align: 'right' });
  doc.fillColor(textDark)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(formatCurrency(invoice.subtotal || 0), totalsX + 12, totalsContentY + 12, { width: totalsWidth - 24, align: 'right' });
  totalsContentY += 30;

  // VAT
  doc.fillColor(textSubtle)
    .fontSize(9)
    .font('Helvetica')
    .text('MVA:', totalsX + 12, totalsContentY, { width: totalsWidth - 24, align: 'right' });
  doc.fillColor(textDark)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(formatCurrency(invoice.vat_total || 0), totalsX + 12, totalsContentY + 12, { width: totalsWidth - 24, align: 'right' });
  totalsContentY += 30;

  // Total (highlighted)
  doc.strokeColor(brandBase)
    .lineWidth(2)
    .moveTo(totalsX + 12, totalsContentY)
    .lineTo(totalsX + totalsWidth - 12, totalsContentY)
    .stroke();
  
  totalsContentY += 10;
  
  doc.fillColor(brandDeep)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('TOTAL:', totalsX + 12, totalsContentY, { width: totalsWidth - 24, align: 'right' });
  
  doc.fillColor(brandDeep)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(formatCurrency(invoice.total || 0), totalsX + 12, totalsContentY + 15, { width: totalsWidth - 24, align: 'right' });

  // Notes and payment info section
  let notesY = totalsY + 100;
  
  // Notes
  if (invoice.notes) {
    doc.fillColor(textSubtle)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('NOTATER', margin, notesY);
    doc.fillColor(textDark)
      .fontSize(9)
      .font('Helvetica')
      .text(invoice.notes, margin, notesY + 15, { width: contentWidth / 2, lineGap: 3 });
    notesY += 50;
  }

  // Payment info
  if (company?.account_number) {
    doc.fillColor(textSubtle)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('BETALINGSINFORMASJON', margin, notesY);
    doc.fillColor(textDark)
      .fontSize(9)
      .font('Helvetica')
      .text(`Kontonummer: ${company.account_number}`, margin, notesY + 15);
    if (invoice.kid) {
      doc.text(`KID: ${invoice.kid}`, margin, notesY + 29);
    }
  }

  // Footer
  const footerY = pageHeight - 40;
  doc.strokeColor(borderLight)
    .lineWidth(0.5)
    .moveTo(margin, footerY - 20)
    .lineTo(margin + contentWidth, footerY - 20)
    .stroke();
  
  doc.fillColor(textSubtle)
    .fontSize(7)
    .font('Helvetica')
    .text(
      `Generert av Fattern • ${new Date().toLocaleDateString('no-NO')}`,
      margin,
      footerY,
      { align: 'center', width: contentWidth }
    );

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(filepath);
    });
    stream.on('error', reject);
  });
}

module.exports = { generateInvoicePDF };
