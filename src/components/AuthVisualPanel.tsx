import { QrCode, Globe, Sparkles, type LucideIcon } from "lucide-react";

interface AuthVisualPanelProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const AuthVisualPanel = ({ title, description, icon: Icon }: AuthVisualPanelProps) => {
  return (
    <div
      className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, hsl(228 22% 6%), hsl(228 18% 11%), hsl(228 14% 16%))" }}
    >
      {/* Moroccan geometric pattern overlay */}
      <div className="absolute inset-0 moroccan-geo opacity-40 pointer-events-none" />

      {/* Warm gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full opacity-30" style={{ background: "radial-gradient(circle, hsla(var(--ember), 0.2) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full opacity-25" style={{ background: "radial-gradient(circle, hsla(var(--gold), 0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />

      {/* 8-pointed star decorations */}
      <svg
        className="absolute top-[10%] right-[10%] w-16 h-16"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "hsl(var(--gold))", opacity: 0.1, animation: "gentleRotate 8s ease-in-out infinite" }}
        aria-hidden="true"
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>
      <svg
        className="absolute bottom-[15%] left-[12%] w-10 h-10"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "hsl(var(--ember))", opacity: 0.08, animation: "gentleRotate 6s ease-in-out infinite reverse" }}
        aria-hidden="true"
      >
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>

      <div className="relative z-10 max-w-md px-8 text-center">
        {/* Arch-framed icon container */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] backdrop-blur-sm arch-card-top" style={{ background: "hsla(var(--ember), 0.08)" }}>
          <Icon className="h-10 w-10 text-primary" />
        </div>

        <h2 className="font-sans text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-white/50 leading-relaxed mb-10">{description}</p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 backdrop-blur-sm">
            <QrCode className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-white/60">QR Menus</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 backdrop-blur-sm">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-white/60">EN / FR / AR</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-white/60">AI-Powered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
