import { Badge } from "~/components/ui/badge";

export const Tags = ({ tags }: { tags: string[] }) => {
  return (
    <div className="flex flex-row flex-wrap gap-2 py-1">
      {tags.map((tag, index) => (
        <Badge variant="secondary" key={index}>
          {tag}
        </Badge>
      ))}
    </div>
  );
};
