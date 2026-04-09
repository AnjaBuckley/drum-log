import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export default function StarRating({ value, onChange, readonly, size = "md" }: StarRatingProps) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn("transition-colors", readonly ? "cursor-default" : "cursor-pointer hover:scale-110")}
        >
          <Star
            className={cn(
              sizeClass,
              star <= value ? "fill-primary text-primary" : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
