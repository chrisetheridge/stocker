import { Card, CardBody } from "./ui";

export function LoadingState({ label }: { label: string }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded-full bg-white/6" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/6" />
        <p className="pt-2 text-sm text-slate-400">{label}</p>
      </CardBody>
    </Card>
  );
}
