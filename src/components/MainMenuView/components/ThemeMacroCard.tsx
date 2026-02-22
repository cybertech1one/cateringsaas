import { cn } from "~/utils/cn";

export const ThemeMacroCard = ({
  carbohydrates,
  fat,
  calories,
  protein,
  themed,
}: {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  themed: boolean;
}) => {
  if (!calories && !protein && !carbohydrates && !fat) return null;

  const pillStyle = themed
    ? {
        backgroundColor: "var(--menu-surface)",
        color: "var(--menu-muted)",
      }
    : undefined;

  return (
    <div
      className={cn(
        "mt-1 flex flex-wrap items-center gap-2 text-xs",
        !themed && "text-muted-foreground",
      )}
    >
      {calories != null && calories > 0 && (
        <span
          className={cn("rounded-full px-2 py-0.5", !themed && "bg-secondary")}
          style={pillStyle}
        >
          {calories} kcal
        </span>
      )}
      {protein != null && protein > 0 && (
        <span
          className={cn("rounded-full px-2 py-0.5", !themed && "bg-secondary")}
          style={pillStyle}
        >
          P: {protein}g
        </span>
      )}
      {carbohydrates != null && carbohydrates > 0 && (
        <span
          className={cn("rounded-full px-2 py-0.5", !themed && "bg-secondary")}
          style={pillStyle}
        >
          C: {carbohydrates}g
        </span>
      )}
      {fat != null && fat > 0 && (
        <span
          className={cn("rounded-full px-2 py-0.5", !themed && "bg-secondary")}
          style={pillStyle}
        >
          F: {fat}g
        </span>
      )}
    </div>
  );
};
