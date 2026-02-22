"use client";

import { formatPrice } from "~/utils/currency";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

interface PrintableReceiptProps {
  restaurantName: string;
  restaurantLogo: string | null;
  orderNumber: number;
  createdAt: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number | null;
  currency: string | null;
  paymentMethod: string | null;
  orderType: string | null;
  tableNumber: string | null;
  customerName: string | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function PrintableReceipt({
  restaurantName,
  restaurantLogo,
  orderNumber,
  createdAt,
  items,
  totalAmount,
  deliveryFee,
  currency,
  paymentMethod,
  orderType,
  tableNumber,
  customerName,
  t,
}: PrintableReceiptProps) {
  const cur = currency ?? "MAD";
  const subtotal = totalAmount - (deliveryFee ?? 0);
  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const orderTypeKey = orderType as "dine_in" | "pickup" | "delivery" | null;
  const paymentLabel = paymentMethod
    ? getReceiptPaymentLabel(paymentMethod, t)
    : null;

  return (
    <div
      className="printable-receipt"
      style={{
        display: "none",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        lineHeight: "1.4",
        width: "72mm",
        maxWidth: "72mm",
        margin: "0 auto",
        color: "#000",
        background: "#fff",
        padding: "4mm",
      }}
    >
      {/* Restaurant header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        {restaurantLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurantLogo}
            alt={restaurantName}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              margin: "0 auto 6px",
              display: "block",
            }}
          />
        )}
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {restaurantName}
        </div>
        <div
          style={{
            fontSize: "11px",
            marginTop: "2px",
            color: "#666",
          }}
        >
          {t("orderTracking.receipt.title")}
        </div>
      </div>

      {/* Dotted separator */}
      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {/* Order info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
        }}
      >
        <span>
          {t("orderTracking.orderNumber", { number: orderNumber })}
        </span>
        <span>{dateStr}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#444",
        }}
      >
        <span>
          {orderTypeKey ? t(`orderTracking.orderType.${orderTypeKey}`) : ""}
        </span>
        <span>{timeStr}</span>
      </div>

      {customerName && (
        <div style={{ marginTop: "4px", fontSize: "11px" }}>
          {customerName}
        </div>
      )}
      {orderType === "dine_in" && tableNumber && (
        <div style={{ fontSize: "11px" }}>
          {t("orderTracking.summary.table", { number: tableNumber })}
        </div>
      )}

      {/* Dotted separator */}
      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {/* Items */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td
                style={{
                  textAlign: "left",
                  padding: "2px 0",
                  verticalAlign: "top",
                }}
              >
                {item.quantity}x {item.name}
                {item.notes && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      fontStyle: "italic",
                      paddingLeft: "16px",
                    }}
                  >
                    {item.notes}
                  </div>
                )}
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "2px 0",
                  whiteSpace: "nowrap",
                  verticalAlign: "top",
                }}
              >
                {formatPrice(item.totalPrice, cur)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dotted separator */}
      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {/* Totals */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {deliveryFee != null && deliveryFee > 0 && (
            <>
              <tr>
                <td style={{ textAlign: "left", padding: "1px 0" }}>
                  {t("orderTracking.receipt.subtotal")}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "1px 0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatPrice(subtotal, cur)}
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: "left", padding: "1px 0" }}>
                  {t("orderTracking.receipt.deliveryFee")}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "1px 0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatPrice(deliveryFee, cur)}
                </td>
              </tr>
            </>
          )}
          <tr
            style={{
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            <td style={{ textAlign: "left", paddingTop: "4px" }}>
              {t("orderTracking.summary.total")}
            </td>
            <td
              style={{
                textAlign: "right",
                paddingTop: "4px",
                whiteSpace: "nowrap",
              }}
            >
              {formatPrice(totalAmount, cur)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Dotted separator */}
      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {/* Payment method */}
      {paymentLabel && (
        <div style={{ fontSize: "11px" }}>
          {t("orderTracking.receipt.paymentMethod")}: {paymentLabel}
        </div>
      )}

      {/* Dotted separator */}
      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {/* Thank you footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "8px",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: "bold" }}>
          {t("orderTracking.receipt.thankYou")}
        </div>
        <div
          style={{
            fontSize: "11px",
            marginTop: "2px",
          }}
        >
          {restaurantName}
        </div>
        <div
          style={{
            fontSize: "9px",
            color: "#999",
            marginTop: "8px",
          }}
        >
          {t("orderTracking.receipt.poweredBy")}
        </div>
      </div>
    </div>
  );
}

function getReceiptPaymentLabel(
  method: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const paymentMap: Record<string, string> = {
    cash: "orderTracking.payment.cash",
    pay_at_table: "orderTracking.payment.payAtTable",
    pay_at_counter: "orderTracking.payment.payAtCounter",
    pay_on_delivery: "orderTracking.payment.payOnDelivery",
  };

  const key = paymentMap[method];

  if (!key) return method;

  return t(key);
}
