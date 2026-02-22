interface PrintOrderData {
  restaurantName: string;
  orderNumber: number;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  tableNumber: string | null;
  items: {
    dishName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string | null;
  }[];
  totalAmount: number;
  deliveryFee: number | null;
  currency: string;
  paymentMethod: string | null;
  customerNotes: string | null;
}

export function printOrderTicket(order: PrintOrderData) {
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="text-align:left;padding:2px 0;">${item.quantity}x ${item.dishName}${item.notes ? ` <small>(${item.notes})</small>` : ""}</td>
          <td style="text-align:right;padding:2px 0;">${(item.totalPrice / 100).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const deliveryFee = order.deliveryFee ?? 0;
  const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order #${order.orderNumber}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 4mm;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .header { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 4px; }
    .info-row { display: flex; justify-content: space-between; }
    .items-table { width: 100%; border-collapse: collapse; }
    .total-row { font-size: 14px; font-weight: bold; }
    .notes {
      border: 1px dashed #000;
      padding: 4px;
      margin-top: 4px;
      font-style: italic;
      font-size: 11px;
    }
    .footer { text-align: center; font-size: 10px; margin-top: 8px; color: #666; }
    @media screen {
      body { padding: 16px; border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <div class="header">${escapeHtml(order.restaurantName)}</div>
  <hr class="divider">

  <div class="info-row">
    <span class="bold">Order #${order.orderNumber}</span>
    <span>${dateStr}</span>
  </div>
  <div class="info-row">
    <span></span>
    <span>${timeStr}</span>
  </div>

  ${order.customerName ? `<div>Customer: <span class="bold">${escapeHtml(order.customerName)}</span></div>` : ""}
  ${order.customerPhone ? `<div>Phone: ${escapeHtml(order.customerPhone)}</div>` : ""}
  ${order.tableNumber ? `<div>Table: <span class="bold">${escapeHtml(order.tableNumber)}</span></div>` : ""}

  <hr class="divider">

  <table class="items-table">
    ${itemsHtml}
  </table>

  <hr class="divider">

  <table class="items-table">
    <tr>
      <td style="text-align:left;">Subtotal</td>
      <td style="text-align:right;">${(subtotal / 100).toFixed(2)} ${escapeHtml(order.currency)}</td>
    </tr>
    ${
      deliveryFee > 0
        ? `<tr>
            <td style="text-align:left;">Delivery</td>
            <td style="text-align:right;">${(deliveryFee / 100).toFixed(2)} ${escapeHtml(order.currency)}</td>
          </tr>`
        : ""
    }
    <tr class="total-row">
      <td style="text-align:left;padding-top:4px;">TOTAL</td>
      <td style="text-align:right;padding-top:4px;">${(order.totalAmount / 100).toFixed(2)} ${escapeHtml(order.currency)}</td>
    </tr>
  </table>

  <hr class="divider">

  <div>Payment: ${escapeHtml(order.paymentMethod ?? "Cash")}</div>

  ${
    order.customerNotes
      ? `<div class="notes">${escapeHtml(order.customerNotes)}</div>`
      : ""
  }

  <div class="footer">
    <p>Powered by Diyafa</p>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=320,height=600");

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}
