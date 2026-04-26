import { Badge, Button, Card, CardBody } from "./ui";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  tone = "muted",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "muted" | "info" | "warning";
}) {
  return (
    <Card>
      <CardBody className="space-y-4 text-center">
        <div className="flex justify-center">
          <Badge
            tone={
              tone === "warning"
                ? "warning"
                : tone === "info"
                  ? "info"
                  : "muted"
            }
          >
            Empty state
          </Badge>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <p className="text-sm leading-6 text-slate-400">{description}</p>
        </div>
        {actionLabel ? (
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
