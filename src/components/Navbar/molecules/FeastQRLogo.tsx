import Image from "next/image";
import Icon from "~/assets/icon.png";

export const DiyafaLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <Image src={Icon} alt="Diyafa logo" height={32} />
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        Diy<span className="text-primary">afa</span>
        <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-super" />
      </span>
    </div>
  );
};

/** @deprecated Use DiyafaLogo instead */
export const FeastQRLogo = DiyafaLogo;
