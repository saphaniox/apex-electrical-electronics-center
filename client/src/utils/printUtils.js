/**
 * Print Utilities for Apex Electrical & Electronics Center
 * Provides functionality for printing tables, invoices, and exporting to PDF
 */

import logo from '../assets/logo.png'

/**
 * Convert image to base64 for embedding in print documents
 */
function getLogoBase64() {
  return logo;
}

/**
 * Print a table with formatted headers and data
 * Opens print dialog in browser
 */
export function printTable(tableId, title = 'Document') {
  const printWindow = window.open('', '', 'width=900,height=600');
  const table = document.getElementById(tableId);
  
  if (!table) {
    console.error(`Table with ID '${tableId}' not found`);
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 20px;
          color: #333;
        }
        .logo-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo-header img {
          height: 60px;
          margin-bottom: 10px;
        }
        h1 {
          text-align: center;
          color: #1890ff;
          margin-bottom: 10px;
        }
        .print-date {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #1890ff;
          color: white;
          padding: 12px;
          text-align: left;
          border: 1px solid #ddd;
        }
        td {
          padding: 10px;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        tr:hover {
          background-color: #f0f0f0;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="logo-header">
        <img src="${getLogoBase64()}" alt="Apex Logo" />
      </div>
      <h1>${title}</h1>
      <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
      ${table.outerHTML}
      <div class="footer">
        <p>© Apex Electrical & Electronics Center | ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
}



/**
 * Print invoice in a formatted way
 */
export function printInvoice(invoice) {
  const printWindow = window.open('', '', 'width=800,height=600');
  
  const totalAmount = invoice.items?.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity);
  }, 0) || invoice.total_amount || 0;

  const itemsHtml = (invoice.items || []).map((item, idx) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.product_name || 'Product'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">UGX ${(item.unit_price || 0).toLocaleString()}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">UGX ${((item.unit_price || 0) * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number || 'N/A'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
          padding: 20px;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #1890ff;
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #1890ff;
          padding-bottom: 20px;
        }
        .logo-container {
          margin-bottom: 15px;
        }
        .logo-container img {
          height: 80px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1890ff;
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .invoice-title {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .invoice-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .meta-item {
          text-align: left;
        }
        .meta-label {
          font-weight: bold;
          color: #666;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th {
          background-color: #1890ff;
          color: white;
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .items-table td {
          padding: 10px;
          border: 1px solid #ddd;
        }
        .items-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          gap: 50px;
          font-size: 14px;
          padding-right: 50px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        .total-amount {
          font-size: 18px;
          font-weight: bold;
          color: #1890ff;
          border-top: 2px solid #1890ff;
          padding-top: 10px;
        }
        .notes {
          margin-top: 30px;
          padding: 15px;
          background-color: #f5f5f5;
          border-left: 4px solid #1890ff;
        }
        .notes-label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          .invoice-container { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="logo-container">
            <img src="${getLogoBase64()}" alt="Apex Logo" />
          </div>
          <div class="company-name">APEX ELECTRICAL & ELECTRONICS CENTER</div>
          <div class="company-info">Maya Nanziga</div>
          <div class="company-info">Tel: 0778 247 008 | 0758 705 803</div>
          <div class="invoice-title">INVOICE</div>
        </div>

        <div class="invoice-meta">
          <div class="meta-item">
            <div class="meta-label">Invoice Number:</div>
            <div>${invoice.invoice_number || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Date:</div>
            <div>${new Date(invoice.created_at).toLocaleDateString()}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Customer Name:</div>
            <div>${invoice.customer_name || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Customer Phone:</div>
            <div>${invoice.customer_phone || 'N/A'}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Item Description</th>
              <th style="width: 80px; text-align: right;">Qty</th>
              <th style="width: 120px; text-align: right;">Unit Price</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span><strong>Total Amount:</strong></span>
            <span class="total-amount">UGX ${totalAmount.toLocaleString()}</span>
          </div>
        </div>

        ${invoice.notes ? `
          <div class="notes">
            <div class="notes-label">Notes:</div>
            <div>${invoice.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>© Apex Electrical & Electronics Center | ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Print sales order in a formatted way
 */
export function printSalesOrder(salesOrder) {
  const printWindow = window.open('', '', 'width=800,height=600');
  
  const totalAmount = salesOrder.total_amount || 0;

  const itemsHtml = (salesOrder.items || []).map((item, idx) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.product_name || 'Product'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">UGX ${(item.unit_price || 0).toLocaleString()}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">UGX ${((item.unit_price || 0) * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Order ${salesOrder.order_number || 'N/A'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
          padding: 20px;
        }
        .order-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #52c41a;
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #52c41a;
          padding-bottom: 20px;
        }
        .logo-container {
          margin-bottom: 15px;
        }
        .logo-container img {
          height: 80px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #52c41a;
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .sales-order-title {
          font-size: 20px;
          margin-bottom: 10px;
        }
        .order-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .meta-item {
          text-align: left;
        }
        .meta-label {
          font-weight: bold;
          color: #666;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th {
          background-color: #52c41a;
          color: white;
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .items-table td {
          padding: 10px;
          border: 1px solid #ddd;
        }
        .items-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          font-size: 14px;
          padding-right: 50px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        .total-amount {
          font-size: 18px;
          font-weight: bold;
          color: #52c41a;
          border-top: 2px solid #52c41a;
          padding-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          .order-container { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="order-container">
        <div class="header">
          <div class="logo-container">
            <img src="${getLogoBase64()}" alt="Apex Logo" />
          </div>
          <div class="company-name">APEX ELECTRICAL & ELECTRONICS CENTER</div>
          <div class="company-info">Maya Nanziga</div>
          <div class="company-info">Tel: 0778 247 008 | 0758 705 803</div>
          <div class="order-title">SALES ORDER</div>
        </div>

        <div class="order-meta">
          <div class="meta-item">
            <div class="meta-label">Order Number:</div>
            <div>${salesOrder.order_number || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Date:</div>
            <div>${new Date(salesOrder.created_at).toLocaleDateString()}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Customer Name:</div>
            <div>${salesOrder.customer_name || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Phone Number:</div>
            <div>${salesOrder.customer_phone || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Status:</div>
            <div style="text-transform: uppercase; color: ${salesOrder.status === 'completed' ? '#52c41a' : '#faad14'};">${salesOrder.status || 'Pending'}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Product Name</th>
              <th style="width: 100px; text-align: right;">Quantity</th>
              <th style="width: 150px; text-align: right;">Unit Price</th>
              <th style="width: 150px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <div class="total-amount">TOTAL AMOUNT: UGX ${totalAmount.toLocaleString()}</div>
          </div>
        </div>

        <div class="footer">
          <p>© Apex Electrical & Electronics Center | ${new Date().getFullYear()}</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Export JSON data to PDF with table formatting
 */
export function exportDataToPDFTable(data, filename, title, columns) {
  // Load html2pdf library
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  script.async = true;

  script.onload = () => {
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.backgroundColor = 'white';

    // Title
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.color = '#1890ff';
    titleEl.style.textAlign = 'center';
    titleEl.style.marginBottom = '10px';
    element.appendChild(titleEl);

    // Date
    const dateEl = document.createElement('p');
    dateEl.textContent = `Generated: ${new Date().toLocaleString()}`;
    dateEl.style.textAlign = 'right';
    dateEl.style.fontSize = '12px';
    dateEl.style.color = '#999';
    dateEl.style.marginBottom = '20px';
    element.appendChild(dateEl);

    // Table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11px';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#1890ff';
    headerRow.style.color = 'white';

    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      th.style.padding = '10px';
      th.style.border = '1px solid #ddd';
      th.style.textAlign = 'left';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    data.forEach((row, idx) => {
      const tr = document.createElement('tr');
      if (idx % 2 === 0) tr.style.backgroundColor = '#f9f9f9';
      
      columns.forEach(col => {
        const td = document.createElement('td');
        td.textContent = row[col] || '';
        td.style.padding = '8px';
        td.style.border = '1px solid #ddd';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    element.appendChild(table);

    // Footer
    const footerEl = document.createElement('p');
    footerEl.textContent = '© Apex Electrical & Electronics Center';
    footerEl.style.textAlign = 'center';
    footerEl.style.marginTop = 'auto';
    footerEl.style.paddingTop = '20px';
    footerEl.style.fontSize = '10px';
    footerEl.style.color = '#999';
    element.appendChild(footerEl);

    // Generate PDF
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { 
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      }
    };

    window.html2pdf().set(opt).from(element).save();
  };

  if (!document.querySelector('script[src*="html2pdf"]')) {
    document.head.appendChild(script);
  }
}

export default {
  printTable,
  printInvoice,
  exportDataToPDFTable
}
