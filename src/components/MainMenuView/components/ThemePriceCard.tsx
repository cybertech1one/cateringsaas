import { cn } from "~/utils/cn";

export const ThemePriceCard = ({ price, themed }: { price: number; themed: boolean }) => {
  return (
    <span
      className={cn("mt-0.5 text-sm font-semibold", !themed && "text-primary")}
      style={themed ? { color: "var(--menu-primary)" } : undefined}
    >
      {(price / 100).toFixed(2)}{" "}
      <span
        className={cn("text-xs font-normal", !themed && "text-muted-foreground")}
        style={themed ? { color: "var(--menu-muted)" } : undefined}
      >
        د.م.
      </span>
    </span>
  );
};
