// ========================================
// EMILUXE - CERTIFICATE GENERATOR
// ========================================
// Generador de comprobantes/facturas
// para descargar e imprimir

/**
 * Generar HTML del comprobante
 * @param {Object} order - Datos de la orden
 * @returns {string} HTML del comprobante
 */
export function generateCertificateHTML(order) {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 0.8rem; border-bottom: 1px solid #ddd; text-align: left;">${item.name}</td>
      <td style="padding: 0.8rem; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 0.8rem; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toLocaleString('es-CO')}</td>
      <td style="padding: 0.8rem; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toLocaleString('es-CO')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprobante Orden #${order.orderId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          padding: 20px;
        }

        .certificate-container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          border: 2px solid #ff7fa0;
          border-radius: 10px;
          padding: 40px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #ff7fa0;
          padding-bottom: 20px;
        }

        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #ff7fa0;
          margin-bottom: 10px;
        }

        .header-title {
          font-size: 24px;
          font-weight: 600;
          color: #2c2c2c;
          margin-bottom: 5px;
        }

        .header-subtitle {
          font-size: 14px;
          color: #999;
        }

        .order-id {
          background-color: #f3e5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          text-align: center;
        }

        .order-id-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 5px;
        }

        .order-id-value {
          font-size: 24px;
          font-weight: 700;
          color: #ff7fa0;
          font-family: monospace;
        }

        .section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #ff7fa0;
          text-transform: uppercase;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ff7fa0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .info-group {
          font-size: 13px;
        }

        .info-label {
          color: #999;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .info-value {
          color: #2c2c2c;
          font-weight: 500;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .table th {
          background-color: #f3e5f5;
          padding: 12px;
          text-align: left;
          font-weight: 700;
          color: #ff7fa0;
          font-size: 13px;
        }

        .table th:nth-child(2),
        .table th:nth-child(3),
        .table th:nth-child(4) {
          text-align: right;
        }

        .totals {
          margin: 25px 0;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .total-row.final {
          border-top: 2px solid #ff7fa0;
          padding-top: 12px;
          font-weight: 700;
          font-size: 18px;
          color: #ff7fa0;
        }

        .payment-method {
          background-color: #e8f5e9;
          border: 2px solid #4caf50;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }

        .payment-method-title {
          font-size: 12px;
          color: #2e7d32;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .payment-method-value {
          font-size: 16px;
          font-weight: 700;
          color: #2e7d32;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #999;
          font-size: 12px;
          line-height: 1.6;
        }

        .thank-you {
          font-size: 14px;
          color: #ff7fa0;
          font-weight: 600;
          margin-top: 15px;
        }

        @media print {
          body {
            background-color: white;
            padding: 0;
          }

          .certificate-container {
            box-shadow: none;
            border: 1px solid #ddd;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo">✨ EmiLuxe ✨</div>
          <div class="header-title">Comprobante de Compra</div>
          <div class="header-subtitle">Pago Contra Entrega</div>
        </div>

        <!-- ORDER ID -->
        <div class="order-id">
          <div class="order-id-label">NÚMERO DE ORDEN</div>
          <div class="order-id-value">#${order.orderId}</div>
        </div>

        <!-- CUSTOMER INFO -->
        <div class="section">
          <div class="section-title">📋 Información del Cliente</div>
          <div class="info-grid">
            <div class="info-group">
              <div class="info-label">Nombre:</div>
              <div class="info-value">${order.customerName}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Teléfono Principal:</div>
              <div class="info-value">${order.phoneNumber}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Dirección:</div>
              <div class="info-value">${order.deliveryAddress}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Hora Preferida:</div>
              <div class="info-value">${order.preferredTime}</div>
            </div>
          </div>
          ${order.secondaryPhone ? `
            <div class="info-group" style="margin-top: 15px;">
              <div class="info-label">Teléfono Secundario:</div>
              <div class="info-value">${order.secondaryPhone}</div>
            </div>
          ` : ''}
          ${order.notes ? `
            <div class="info-group" style="margin-top: 15px;">
              <div class="info-label">Notas:</div>
              <div class="info-value">${order.notes}</div>
            </div>
          ` : ''}
        </div>

        <!-- ORDER DETAILS -->
        <div class="section">
          <div class="section-title">📦 Detalles de la Orden</div>
          <table class="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <!-- TOTALS -->
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${order.total.toLocaleString('es-CO')}</span>
          </div>
          <div class="total-row">
            <span>Envío:</span>
            <span>Gratis</span>
          </div>
          <div class="total-row final">
            <span>TOTAL A PAGAR:</span>
            <span>$${order.total.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <!-- PAYMENT METHOD -->
        <div class="payment-method">
          <div class="payment-method-title">💰 MÉTODO DE PAGO</div>
          <div class="payment-method-value">PAGO CONTRA ENTREGA</div>
          <div style="font-size: 12px; color: #2e7d32; margin-top: 8px;">
            Paga directamente al repartidor cuando recibas tu pedido
          </div>
        </div>

        <!-- DATE AND TIME -->
        <div class="section">
          <div class="section-title">📅 Información Adicional</div>
          <div class="info-group">
            <div class="info-label">Fecha de Orden:</div>
            <div class="info-value">${order.date}</div>
          </div>
          <div class="info-group" style="margin-top: 15px;">
            <div class="info-label">Estado:</div>
            <div class="info-value" style="color: #ff7fa0; font-weight: 700;">${order.status}</div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p>Este es tu comprobante de compra. Conservalo para tu control.</p>
          <p style="margin-top: 10px;">Para consultas, contacta con nosotras a través de WhatsApp</p>
          <div class="thank-you">¡Gracias por tu compra! 💕</div>
          <p style="margin-top: 15px; font-size: 11px;">
            EmiLuxe - Boutique Femenina Premium<br>
            © 2026 Todos los derechos reservados
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Descargar comprobante como PDF
 * Requiere jsPDF: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
 * @param {Object} order - Datos de la orden
 */
export function downloadCertificateAsPDF(order) {
  if (typeof html2pdf === 'undefined') {
    console.error('html2pdf no está cargado. Descarga como HTML en su lugar.');
    downloadCertificateAsHTML(order);
    return;
  }

  const element = document.createElement('div');
  element.innerHTML = generateCertificateHTML(order);

  const options = {
    margin: 10,
    filename: `comprobante-emiluxe-${order.orderId}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(options).from(element).save();
}

/**
 * Descargar comprobante como HTML
 * @param {Object} order - Datos de la orden
 */
export function downloadCertificateAsHTML(order) {
  const html = generateCertificateHTML(order);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `comprobante-emiluxe-${order.orderId}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Abrir comprobante en nueva ventana para imprimir
 * @param {Object} order - Datos de la orden
 */
export function printCertificate(order) {
  const html = generateCertificateHTML(order);
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

/**
 * Enviar comprobante por WhatsApp
 * @param {Object} order - Datos de la orden
 * @param {string} whatsappNumber - Número de WhatsApp
 */
export function sendCertificateViaWhatsApp(order, whatsappNumber) {
  const message = `
📄 *COMPROBANTE DE COMPRA*

Orden: #${order.orderId}
Cliente: ${order.customerName}
Teléfono: ${order.phoneNumber}

📦 *DETALLES:*
${order.items.map(item => `• ${item.name} x${item.quantity}: $${item.price.toLocaleString('es-CO')}`).join('\n')}

💰 *Total: $${order.total.toLocaleString('es-CO')}*

📍 Dirección: ${order.deliveryAddress}
⏰ Hora: ${order.preferredTime}

Pago Contra Entrega

Gracias por tu compra ❤️`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  window.open(whatsappURL, '_blank');
}

/**
 * Formato de datos para la orden
 * @param {Object} rawOrder - Datos crudos de la orden
 * @returns {Object} Orden formateada
 */
export function formatOrderData(rawOrder) {
  return {
    orderId: rawOrder.orderId || 'N/A',
    customerName: rawOrder.customerName || 'Cliente',
    phoneNumber: rawOrder.phoneNumber || 'N/A',
    secondaryPhone: rawOrder.secondaryPhone || '',
    deliveryAddress: rawOrder.deliveryAddress || 'N/A',
    preferredTime: rawOrder.preferredTime || 'N/A',
    notes: rawOrder.notes || '',
    items: rawOrder.items || [],
    total: rawOrder.total || 0,
    date: rawOrder.date || new Date().toLocaleString('es-CO'),
    status: rawOrder.status || 'Pendiente'
  };
}

export default {
  generateCertificateHTML,
  downloadCertificateAsPDF,
  downloadCertificateAsHTML,
  printCertificate,
  sendCertificateViaWhatsApp,
  formatOrderData
};
