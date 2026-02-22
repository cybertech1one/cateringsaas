import { cn } from "~/utils/cn";
import { ThemePriceCard } from "./ThemePriceCard";

export const ThemeVariantCard = ({
  description,
  name,
  price,
  themed,
}: {
  name: string;
  price: number | null;
  description: string | null;
  themed: boolean;
}) => {
  return (
    <div className="flex w-full flex-col pl-4 py-1">
      <div className="align flex w-full justify-between">
        <h4
          className={cn("text-sm font-medium", !themed && "text-foreground")}
        >
          {name}
        </h4>
        {price && <ThemePriceCard price={price} themed={themed} />}
      </div>
      <p
        className={cn("text-xs", !themed && "text-muted-foreground")}
        style={themed ? { color: "var(--menu-muted)" } : undefined}
      >
        {description}
      </p>
    </div>
  );
};
