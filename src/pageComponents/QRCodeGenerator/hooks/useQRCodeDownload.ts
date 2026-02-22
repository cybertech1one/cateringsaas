"use client";

import { useCallback } from "react";
import { type QRCustomizationOptions } from "../QRCodeGenerator.types";

const QR_EXPORT_SIZE = 1024;

/**
 * Renders a QR code SVG element to a canvas at the specified size
 * and returns a data URL or blob.
 */
function svgToCanvas(
  svgElement: SVGSVGElement,
  size: number,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));

        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };

    img.src = url;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useQRCodeDownload(
  qrRef: React.RefObject<SVGSVGElement | null>,
  _options: QRCustomizationOptions,
  restaurantName: string,
) {
  const getFilenameBase = useCallback(() => {
    const safeName = restaurantName
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    return `qr-${safeName || "menu"}`;
  }, [restaurantName]);

  const downloadPNG = useCallback(async () => {
    const svg = qrRef.current;

    if (!svg) return;

    const canvas = await svgToCanvas(svg, QR_EXPORT_SIZE);

    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${getFilenameBase()}.png`);
      }
    }, "image/png");
  }, [qrRef, getFilenameBase]);

  const downloadSVG = useCallback(() => {
    const svg = qrRef.current;

    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    downloadBlob(blob, `${getFilenameBase()}.svg`);
  }, [qrRef, getFilenameBase]);

  const downloadPDF = useCallback(async () => {
    const svg = qrRef.current;

    if (!svg) return;

    const canvas = await svgToCanvas(svg, QR_EXPORT_SIZE);
    const imgDataUrl = canvas.toDataURL("image/png");

    // Build a simple HTML document for PDF printing
    const printWindow = window.open("", "_blank");

    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${restaurantName}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
            }
            .qr-image {
              width: 160mm;
              height: 160mm;
              max-width: 100%;
            }
            .restaurant-name {
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 16pt;
            }
            .scan-text {
              font-size: 14pt;
              color: #555;
              margin-top: 12pt;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="restaurant-name">${restaurantName}</div>
            <img src="${imgDataUrl}" class="qr-image" alt="QR Code" />
            <div class="scan-text">Scan to view our menu</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [qrRef, restaurantName]);

  const copyToClipboard = useCallback(async () => {
    const svg = qrRef.current;

    if (!svg) return false;

    try {
      const canvas = await svgToCanvas(svg, QR_EXPORT_SIZE);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (!blob) return false;

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      return true;
    } catch {
      return false;
    }
  }, [qrRef]);

  return {
    downloadPNG,
    downloadSVG,
    downloadPDF,
    copyToClipboard,
  };
}
