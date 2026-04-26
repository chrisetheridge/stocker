import { Button } from "~/components/ui";

export function SavedResearchToggle({
  saved,
  onToggle,
}: {
  saved: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "ghost"}
      onClick={onToggle}
      className="w-full sm:w-auto"
    >
      {saved ? "Saved for research" : "Save for research"}
    </Button>
  );
}
