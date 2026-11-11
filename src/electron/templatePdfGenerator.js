const { BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EXPORT_ROOT } = require('../db/paths');

/**
 * Converts an image file path to a data URL
 */
function imagePathToDataURL(imagePath) {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return null;
  }

  try {
    const buffer = fs.readFileSync(imagePath);
    const base64 = buffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    
    // Determine MIME type from extension
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    
    const mimeType = mimeTypes[ext] || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to convert image to data URL:', error);
    return null;
  }
}

/**
 * Processes template elements to convert image paths to data URLs
 */
async function processTemplateImages(template) {
  const { TemplateStorage } = require('../db/templateStorage');
  const templateStorage = new TemplateStorage();
  
  const processedElements = await Promise.all(
    template.elements.map(async (element) => {
      if (element.type === 'image' && element.src) {
        // If already a data URL or HTTP URL, use as-is
        if (element.src.startsWith('data:') || element.src.startsWith('http')) {
          return element;
        }
        
        // Convert file path to absolute path
        let imagePath = element.src;
        if (!path.isAbsolute(imagePath)) {
          imagePath = templateStorage.getImagePath(imagePath);
        }
        
        // Convert to data URL
        const dataURL = imagePathToDataURL(imagePath);
        if (dataURL) {
          return { ...element, src: dataURL };
        }
      }
      return element;
    })
  );
  
  return { ...template, elements: processedElements };
}

/**
 * The data object template bindings resolve against
 * (invoice.*, customer.*, company.*).
 */
function buildTemplateData(invoiceData, company, customer) {
  return {
    invoice: {
      invoice_number: invoiceData.invoice_number || invoiceData.id,
      kid: invoiceData.kid || '',
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      status: invoiceData.status,
      total: invoiceData.total,
      subtotal: invoiceData.subtotal,
      vat_total: invoiceData.vat_total,
      items: (invoiceData.items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price || item.unitPrice,
        vat_rate: item.vat_rate || item.vatRate || 0,
        line_total: item.line_total || item.lineTotal || (item.quantity * (item.unit_price || item.unitPrice) * (1 + (item.vat_rate || item.vatRate || 0))),
      })),
    },
    customer: customer ? {
      name: customer.name,
      org_number: customer.org_number,
      address: customer.address,
      post_number: customer.post_number,
      post_location: customer.post_location,
      email: customer.email,
      phone: customer.phone,
    } : {},
    company: company ? {
      name: company.name,
      org_number: company.org_number,
      address: company.address,
      post_number: company.post_number,
      post_location: company.post_location,
      contact_email: company.contact_email,
      contact_number: company.contact_number,
      account_number: company.account_number,
    } : {},
  };
}

/**
 * Generates a PDF from a template using Electron's printToPDF
 */
async function generateTemplatePDF(template, invoiceData, company, customer) {
  return new Promise(async (resolve, reject) => {
    try {
      // Process template to convert image paths to data URLs
      const processedTemplate = await processTemplateImages(template);
      
      // Create a hidden browser window
      const win = new BrowserWindow({
        show: false,
        width: 794,
        height: 1123,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Prepare data object for template rendering
      const data = buildTemplateData(invoiceData, company, customer);

      // Generate HTML from processed template
      const html = renderTemplateToHTML(processedTemplate, data);

    // Load HTML into window
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    win.webContents.once('did-finish-load', () => {
      // Wait a bit for fonts and images to load
      setTimeout(() => {
        win.webContents
          .printToPDF({
            pageSize: 'A4',
            printBackground: true,
            margins: {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            },
          })
          .then((buffer) => {
            // Save PDF
            const exportDir = EXPORT_ROOT;
            if (!fs.existsSync(exportDir)) {
              fs.mkdirSync(exportDir, { recursive: true });
            }

            const filename = `faktura-${invoiceData.invoice_number || invoiceData.id}.pdf`;
            const filepath = path.join(exportDir, filename);
            fs.writeFileSync(filepath, buffer);

            win.close();
            resolve(filepath);
          })
          .catch((error) => {
            win.close();
            reject(error);
          });
      }, 500);
    });

    win.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
      win.close();
      reject(new Error(`Failed to load template: ${errorDescription}`));
    });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Renders template to HTML (server-side version)
 */
function renderTemplateToHTML(template, data) {
  const pageWidth = 794;
  const pageHeight = 1123;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          width: ${pageWidth}px;
          height: ${pageHeight}px;
          background: white;
          position: relative;
          overflow: hidden;
        }
        .page {
          position: relative;
          width: ${pageWidth}px;
          height: ${pageHeight}px;
        }
        .el {
          position: absolute;
          box-sizing: border-box;
        }
      </style>
    </head>
    <body>
      <div class="page">
  `;

  // Sort elements by z-index (lower z-index renders first/behind)
  // Elements with `visibleIf` only render when that binding has a value (e.g. KID).
  const sortedElements = [...template.elements]
    .filter((element) => !element.visibleIf || resolveBinding(element.visibleIf, data))
    .sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
  sortedElements.forEach((element) => {
    html += renderElement(element, data);
  });

  html += `
      </div>
    </body>
    </html>
  `;

  return html;
}

function renderElement(element, data) {
  const baseStyle = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    backgroundColor: element.backgroundColor || 'transparent',
    opacity: element.opacity !== undefined ? element.opacity : 1,
    borderWidth: element.borderWidth ? `${element.borderWidth}px` : '0px',
    borderColor: element.borderColor || 'transparent',
    borderStyle: element.borderStyle || 'solid',
    borderRadius: element.borderRadius ? `${element.borderRadius}px` : '0px',
    paddingTop: element.paddingTop ? `${element.paddingTop}px` : '0px',
    paddingRight: element.paddingRight ? `${element.paddingRight}px` : '0px',
    paddingBottom: element.paddingBottom ? `${element.paddingBottom}px` : '0px',
    paddingLeft: element.paddingLeft ? `${element.paddingLeft}px` : '0px',
    zIndex: element.zIndex ?? 1,
  };

  // Build box shadow if any shadow properties are set
  if (element.boxShadowX || element.boxShadowY || element.boxShadowBlur) {
    const shadowX = element.boxShadowX || 0;
    const shadowY = element.boxShadowY || 0;
    const shadowBlur = element.boxShadowBlur || 0;
    const shadowColor = element.boxShadowColor || 'rgba(0, 0, 0, 0.1)';
    baseStyle.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`;
  }

  switch (element.type) {
    case 'text':
      return `
        <div class="el" style="${objectToStyleString({
          ...baseStyle,
          fontFamily: element.fontFamily || 'Inter',
          fontSize: `${element.fontSize || 14}px`,
          fontWeight: element.fontWeight || 400,
          color: element.color || '#0d3e51',
          textAlign: element.align || 'left',
          lineHeight: element.lineHeight || 1.5,
          letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : '0px',
          fontStyle: element.fontStyle || 'normal',
          textDecoration: element.textDecoration || 'none',
          textTransform: element.textTransform || 'none',
        })}">
          ${escapeHtml(element.content || '')}
        </div>
      `;

    case 'field':
      const fieldValue = resolveBinding(element.binding, data);
      const formattedValue = formatValue(fieldValue, element.binding);
      return `
        <div class="el" style="${objectToStyleString({
          ...baseStyle,
          fontFamily: element.fontFamily || 'Inter',
          fontSize: `${element.fontSize || 14}px`,
          fontWeight: element.fontWeight || 400,
          color: element.color || '#0d3e51',
          textAlign: element.align || 'left',
          lineHeight: element.lineHeight || 1.5,
          letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : '0px',
          fontStyle: element.fontStyle || 'normal',
          textDecoration: element.textDecoration || 'none',
          textTransform: element.textTransform || 'none',
        })}">
          ${escapeHtml(formattedValue)}
        </div>
      `;

    case 'image':
      if (!element.src) return '';
      // Images should already be converted to data URLs by processTemplateImages
      // But handle any remaining file paths as fallback
      let imageSrc = element.src;
      if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('http')) {
        // This shouldn't happen if processTemplateImages worked correctly
        // But as a fallback, try to convert it
        if (!path.isAbsolute(imageSrc)) {
          const { TemplateStorage } = require('../db/templateStorage');
          const templateStorage = new TemplateStorage();
          imageSrc = templateStorage.getImagePath(imageSrc);
        }
        // Convert to data URL
        const dataURL = imagePathToDataURL(imageSrc);
        if (dataURL) {
          imageSrc = dataURL;
        } else {
          // If conversion failed, return empty (image won't display)
          console.warn('Failed to load image:', imageSrc);
          return '';
        }
      }
      return `
        <img 
          class="el"
          src="${escapeHtml(imageSrc)}" 
          style="${objectToStyleString({
            ...baseStyle,
            objectFit: element.preserveAspectRatio !== false ? 'contain' : 'fill',
          })}"
          alt=""
        />
      `;

    case 'table':
      return renderTable(element, data, baseStyle);

    case 'shape':
      return renderShape(element, baseStyle);

    default:
      return '';
  }
}

function renderShape(element, baseStyle) {
  const shapeType = element.shapeType || 'rectangle';
  
  if (shapeType === 'line') {
    // Horizontal or vertical line
    const isHorizontal = element.width > element.height;
    const lineStyle = {
      ...baseStyle,
      position: 'absolute',
    };
    if (isHorizontal) {
      lineStyle.top = '50%';
      lineStyle.left = '0';
      lineStyle.width = '100%';
      lineStyle.height = `${element.borderWidth || 1}px`;
      lineStyle.transform = 'translateY(-50%)';
    } else {
      lineStyle.left = '50%';
      lineStyle.top = '0';
      lineStyle.height = '100%';
      lineStyle.width = `${element.borderWidth || 1}px`;
      lineStyle.transform = 'translateX(-50%)';
    }
    lineStyle.backgroundColor = element.borderColor || element.backgroundColor || '#0d3e51';
    lineStyle.borderWidth = '0px';
    return `<div class="el" style="${objectToStyleString(lineStyle)}"></div>`;
  } else if (shapeType === 'circle') {
    const circleStyle = {
      ...baseStyle,
      borderRadius: '50%',
      backgroundColor: element.backgroundColor || '#f0f8f5',
      borderWidth: element.borderWidth ? `${element.borderWidth}px` : '1px',
      borderColor: element.borderColor || '#d5e7e6',
      borderStyle: element.borderStyle || 'solid',
    };
    return `<div class="el" style="${objectToStyleString(circleStyle)}"></div>`;
  } else {
    // rectangle (default)
    return `<div class="el" style="${objectToStyleString(baseStyle)}"></div>`;
  }
}

function renderTable(element, data, baseStyle) {
  const items = resolveBinding(element.binding, data) || [];
  const columns = element.columns || [];
  const maxRows = element.maxRows || 15;
  const rowHeight = element.rowHeight || 18;
  const visibleItems = items.slice(0, maxRows);

  // Apply background color to the table container
  const tableContainerStyle = {
    ...baseStyle,
    backgroundColor: element.backgroundColor || 'transparent',
    overflow: element.borderRadius ? 'hidden' : 'visible',
  };

  // Use border-collapse: separate if we have border-radius, otherwise collapse
  const tableBorderCollapse = element.borderRadius ? 'separate' : 'collapse';
  const tableBorderSpacing = element.borderRadius ? '0' : '0';
  
  let html = `
    <div class="el" style="${objectToStyleString(tableContainerStyle)}">
      <table style="width: 100%; border-collapse: ${tableBorderCollapse}; border-spacing: ${tableBorderSpacing}; background-color: ${element.backgroundColor || 'transparent'}; ${element.borderRadius ? `border-radius: ${element.borderRadius}px; overflow: hidden;` : ''}">
        <thead>
          <tr style="background-color: ${element.headerBackgroundColor || '#0d3e51'}; color: ${element.headerTextColor || '#ffffff'};">
  `;

  columns.forEach((col) => {
    html += `
      <th style="
        padding: 8px;
        text-align: ${col.align || 'left'};
        vertical-align: top;
        font-size: 9px;
        font-weight: 600;
        border: 1px solid rgba(255, 255, 255, 0.2);
      ">${escapeHtml(col.header || '')}</th>
    `;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  visibleItems.forEach((item, index) => {
    // Use element background if set, otherwise use alternating row colors
    const rowBgColor = element.backgroundColor 
      ? element.backgroundColor 
      : (index % 2 === 0 ? '#f0f8f5' : 'transparent');
    html += `<tr style="background-color: ${rowBgColor};">`;
    columns.forEach((col) => {
      const value = item[col.field] ?? '';
      const formatted = formatValue(value, col.field);
      html += `
        <td style="
          padding: 4px 8px;
          text-align: ${col.align || 'left'};
          vertical-align: top;
          font-size: 9px;
          color: ${element.rowTextColor || '#0d3e51'};
          border-bottom: 1px solid #d5e7e6;
        ">${escapeHtml(formatted)}</td>
      `;
    });
    html += `</tr>`;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function resolveBinding(binding, data) {
  if (!binding) return '';
  const parts = binding.split('.');
  let value = data;
  for (const part of parts) {
    if (value == null) return '';
    value = value[part];
  }
  return value ?? '';
}

function formatValue(value, binding) {
  if (value == null || value === '') return '';

  // VAT rate stored as a fraction (0.25) — show as a percentage
  if (binding && /vat_rate$/.test(binding) && typeof value === 'number') {
    return `${Math.round(value * 1000) / 10} %`;
  }

  // Date fields
  if (binding && (binding.includes('date') || binding.includes('Date'))) {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Currency fields
  if (binding && (binding.includes('total') || binding.includes('price') || binding.includes('amount'))) {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Number fields
  if (typeof value === 'number') {
    return value.toString();
  }

  return String(value);
}

function objectToStyleString(styles) {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join(' ');
}

function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { generateTemplatePDF, buildTemplateData, renderTemplateToHTML };
