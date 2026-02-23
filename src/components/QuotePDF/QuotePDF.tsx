"use client";

import { Printer } from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/utils/currency";
import type { QuotePDFData } from "./types";

// ── Helpers ──────────────────────────────────────────────────────

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("fr-MA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

// ── Component ────────────────────────────────────────────────────

interface QuotePDFProps {
  data: QuotePDFData;
  /** Hide the print button (e.g. when embedding in a print-only view) */
  hidePrintButton?: boolean;
}

/**
 * QuotePDF -- Printable Catering Quote Document
 *
 * A professional-looking quote that can be printed or saved as PDF
 * via the browser's native print dialog.
 *
 * Layout:
 *   - Org logo + name header
 *   - "DEVIS / QUOTE" title with reference number
 *   - Client info + event details side-by-side
 *   - Line items table
 *   - Subtotal / TVA / Total
 *   - Payment terms + validity
 *   - Footer with org contact info
 *
 * All monetary values are in centimes. Displayed in MAD.
 */
export function QuotePDF({ data, hidePrintButton }: QuotePDFProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ── Print Styles ──────────────────────────────────────── */}
      <style>{`
        @media print {
          /* Hide everything except the quote */
          body * {
            visibility: hidden;
          }
          #quote-pdf-root,
          #quote-pdf-root * {
            visibility: visible;
          }
          #quote-pdf-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Hide the print button when printing */
          .quote-pdf-no-print {
            display: none !important;
          }
          /* Page setup */
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

      {/* ── Print Button ──────────────────────────────────────── */}
      {!hidePrintButton && (
        <div className="quote-pdf-no-print mb-4 flex justify-end">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      )}

      {/* ── Quote Document ────────────────────────────────────── */}
      <div
        id="quote-pdf-root"
        className="mx-auto max-w-[210mm] bg-white text-gray-900 font-sans text-sm"
        style={{ lineHeight: 1.5 }}
      >
        <div className="border border-gray-200 rounded-lg p-8">

          {/* ── Header ──────────────────────────────────────── */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center gap-4">
              {data.org.logoUrl && (
                <img
                  src={data.org.logoUrl}
                  alt={`${data.org.name} logo`}
                  className="h-16 w-16 rounded-lg object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {data.org.name}
                </h1>
                {data.org.address && (
                  <p className="text-xs text-gray-500 mt-1">{data.org.address}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold tracking-tight text-emerald-700">
                DEVIS / QUOTE
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Ref: {data.quoteNumber}
              </p>
              <p className="text-xs text-gray-500">
                Version {data.version}
              </p>
            </div>
          </div>

          {/* ── Dates ───────────────────────────────────────── */}
          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <span>
              Date: <strong className="text-gray-700">{formatDisplayDate(data.createdAt)}</strong>
            </span>
            <span>
              Valid until: <strong className="text-gray-700">{formatDisplayDate(data.validUntil)}</strong>
            </span>
          </div>

          {/* ── Client + Event Details ──────────────────────── */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Client Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Client
              </h3>
              <p className="font-semibold text-gray-900">{data.client.name}</p>
              {data.client.phone && (
                <p className="text-gray-600 text-xs mt-1">{data.client.phone}</p>
              )}
              {data.client.email && (
                <p className="text-gray-600 text-xs">{data.client.email}</p>
              )}
            </div>

            {/* Event Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Event Details
              </h3>
              <p className="font-semibold text-gray-900">{data.event.title}</p>
              <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                <p>Type: {data.event.type}</p>
                <p>Date: {formatDisplayDate(data.event.date)}</p>
                {data.event.venue && <p>Venue: {data.event.venue}</p>}
                <p>Guests: {data.event.guestCount}</p>
              </div>
            </div>
          </div>

          {/* ── Line Items Table ─────────────────────────────── */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 w-20">
                  Qty
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">
                  Unit Price
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((item, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-2.5 px-1 text-gray-800">
                    {item.description}
                  </td>
                  <td className="py-2.5 text-center text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 text-right text-gray-600">
                    {formatPrice(item.unitPrice)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-800">
                    {formatPrice(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Totals ──────────────────────────────────────── */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-1.5 text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(data.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-gray-600">
                <span>TVA ({data.tvaRate}%)</span>
                <span>{formatPrice(data.tvaAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-800 mt-1 font-bold text-base text-gray-900">
                <span>Total TTC</span>
                <span>{formatPrice(data.total)}</span>
              </div>
            </div>
          </div>

          {/* ── Notes ───────────────────────────────────────── */}
          {data.notes && (
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {data.notes}
              </p>
            </div>
          )}

          {/* ── Payment Terms ───────────────────────────────── */}
          {data.paymentTerms && (
            <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
                Payment Terms / Conditions de paiement
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {data.paymentTerms}
              </p>
            </div>
          )}

          {/* ── Footer ──────────────────────────────────────── */}
          <div className="border-t border-gray-200 pt-4 mt-8">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div>
                <span className="font-medium text-gray-600">{data.org.name}</span>
                {data.org.phone && (
                  <span className="ml-3">{data.org.phone}</span>
                )}
                {data.org.email && (
                  <span className="ml-3">{data.org.email}</span>
                )}
              </div>
              <div>
                <span>
                  This quote is valid until {formatDisplayDate(data.validUntil)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuotePDF;
