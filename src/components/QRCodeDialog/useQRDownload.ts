import type * as React from "react";

interface UseQRDownloadOptions {
  slug: string;
  downloadSize: number;
  canvasRef: React.RefObject<HTMLDivElement>;
  svgRef: React.RefObject<HTMLDivElement>;
}

export function useQRDownload({
  slug,
  downloadSize,
  canvasRef,
  svgRef,
}: UseQRDownloadOptions) {
  const handleDownloadPng = () => {
    const canvasContainer = canvasRef.current;

    if (!canvasContainer) return;

    const canvas = canvasContainer.querySelector("canvas");

    if (!canvas) return;

    const link = document.createElement("a");

    link.download = `qr-${slug}-${downloadSize}px.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleDownloadSvg = () => {
    const svgContainer = svgRef.current;

    if (!svgContainer) return;

    const svgElement = svgContainer.querySelector("svg");

    if (!svgElement) return;

    // Clone the SVG and set the download dimensions
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    clonedSvg.setAttribute("width", String(downloadSize));
    clonedSvg.setAttribute("height", String(downloadSize));

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");

    link.download = `qr-${slug}-${downloadSize}px.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  };

  return { handleDownloadPng, handleDownloadSvg };
}
