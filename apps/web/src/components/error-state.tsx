import { Badge, Button, Card, CardBody } from "./ui";

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card>
      <CardBody className="space-y-4 text-center">
        <div className="flex justify-center">
          <Badge tone="danger">Error</Badge>
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
