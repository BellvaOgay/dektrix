import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryPillProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const CategoryPill = ({ icon: Icon, label, active, onClick }: CategoryPillProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 hover-lift whitespace-nowrap",
        active
          ? "border-primary bg-primary/20 text-primary shadow-neon"
          : "border-border bg-card hover:border-primary/50 hover:bg-primary/10"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export default CategoryPill;
