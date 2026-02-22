import Link from "next/link";
import Image from "next/image";
import Icon from "~/assets/icon.png";
import { type Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 hero-bg-pattern" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,hsla(var(--ember),0.08)_0%,transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,hsla(var(--gold),0.06)_0%,transparent_70%)] blur-3xl" />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <Image src={Icon} alt="Diyafa logo" height={36} />
        <span className="font-display text-2xl font-bold tracking-tight text-foreground">
          Diy<span className="text-primary">afa</span>
          <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-super" />
        </span>
      </Link>

      {/* Card container */}
      <div className="relative z-10 w-full max-w-[420px]">{children}</div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Diyafa. Morocco&apos;s premier
        catering platform.
      </p>
    </div>
  );
}
