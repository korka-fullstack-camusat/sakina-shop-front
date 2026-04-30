/**
 * Génère et imprime une facture dans une nouvelle fenêtre navigateur.
 * Fonctionne entièrement côté client — aucune dépendance externe.
 */
export function printInvoice(order: Order): void {
  const date = new Date(order.updated_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const itemsRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.product_name}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${item.unit_price.toLocaleString("fr-FR")} ${item.currency}</td>
        <td class="right">${(item.unit_price * item.quantity).toLocaleString("fr-FR")} ${item.currency}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture ${order.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 40px; max-width: 720px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 28px; font-weight: 800; color: #047857; letter-spacing: -0.5px; }
    .brand span { color: #d48600; }
    .invoice-meta { text-align: right; }
    .invoice-meta .number { font-size: 20px; font-weight: 700; color: #047857; }
    .invoice-meta .date { color: #666; font-size: 13px; margin-top: 4px; }
    .divider { border: none; border-top: 2px solid #ecfdf5; margin: 24px 0; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
    .client-block { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 32px; }
    .client-name { font-size: 16px; font-weight: 700; color: #111; }
    .client-detail { font-size: 13px; color: #555; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #047857; color: #fff; }
    thead th { padding: 10px 14px; font-size: 12px; font-weight: 600; text-align: left; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody td { padding: 10px 14px; font-size: 13px; }
    tbody tr:hover { background: #f9fafb; }
    .center { text-align: center; }
    .right   { text-align: right; }
    .total-row { display: flex; justify-content: flex-end; margin-top: 8px; }
    .total-box { background: #047857; color: #fff; border-radius: 12px; padding: 14px 24px; text-align: right; min-width: 220px; }
    .total-label { font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
    .total-amount { font-size: 24px; font-weight: 800; margin-top: 4px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #aaa; font-size: 12px; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; margin-left: 8px; vertical-align: middle; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Sakina<span> Shop</span></div>
      <div style="font-size:12px;color:#666;margin-top:4px;">contact@sakina-shop.com</div>
    </div>
    <div class="invoice-meta">
      <div class="number">${order.invoice_number}</div>
      <div class="date">Date : ${date}</div>
      <span class="badge">✓ Livrée</span>
    </div>
  </div>

  <div class="client-block">
    <div class="section-title">Facturé à</div>
    <div class="client-name">${order.customer_name}</div>
    <div class="client-detail">📞 ${order.customer_phone}</div>
    ${order.customer_email ? `<div class="client-detail">✉ ${order.customer_email}</div>` : ""}
    <div class="client-detail">📍 ${order.customer_address}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th class="center">Qté</th>
        <th class="right">Prix unitaire</th>
        <th class="right">Sous-total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="total-row">
    <div class="total-box">
      <div class="total-label">Total TTC</div>
      <div class="total-amount">${order.total.toLocaleString("fr-FR")} ${order.currency}</div>
    </div>
  </div>

  ${order.payment_method ? `<p style="font-size:12px;color:#666;text-align:right;margin-top:8px;">Mode de paiement : <strong>${order.payment_method}</strong></p>` : ""}
  ${order.notes ? `<p style="font-size:12px;color:#888;margin-top:8px;">Notes : ${order.notes}</p>` : ""}

  <div class="footer">
    Merci pour votre confiance — Sakina Shop
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
