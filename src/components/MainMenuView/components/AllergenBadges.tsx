import { cn } from "~/utils/cn";
import { type AllergenInfo, ALLERGEN_COLORS } from "./types";

export const AllergenBadges = ({ allergens }: { allergens: AllergenInfo[] }) => {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {allergens.map((allergen) => {
        const colorClass =
          ALLERGEN_COLORS[allergen.type ?? allergen.name.toLowerCase()] ??
          "bg-gray-500";

        const letter = (allergen.icon ?? allergen.name.charAt(0)).toUpperCase();

        return (
          <span
            key={allergen.id}
            title={`${allergen.name} (${allergen.severity})`}
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
              colorClass,
            )}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};
