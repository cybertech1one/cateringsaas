import { type Metadata } from "next";
import { QRCodeGeneratorPage } from "~/pageComponents/QRCodeGenerator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QR Code Generator",
  robots: { index: false },
};

export default function Page({ params }: { params: { slug: string } }) {
  return <QRCodeGeneratorPage slug={params.slug} />;
}
