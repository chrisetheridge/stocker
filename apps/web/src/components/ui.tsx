import * as React from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "muted";

function cn(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}

const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-amber-300 text-slate-950 hover:bg-amber-200 focus-visible:outline-amber-200",
  secondary:
    "bg-white/8 text-slate-100 ring-1 ring-inset ring-white/10 hover:bg-white/12",
  ghost:
    "bg-transparent text-slate-200 hover:bg-white/6 focus-visible:outline-slate-300",
  danger:
    "bg-rose-400 text-slate-950 hover:bg-rose-300 focus-visible:outline-rose-200",
  muted:
    "bg-slate-800 text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-slate-700",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
  }
>(function Button({ className, variant = "primary", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
});

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "success" | "warning" | "danger" | "info";
}) {
  const toneClasses: Record<typeof tone, string> = {
    muted: "bg-white/8 text-slate-200 ring-white/10",
    success: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/25",
    warning: "bg-amber-400/15 text-amber-200 ring-amber-400/25",
    danger: "bg-rose-400/15 text-rose-200 ring-rose-400/25",
    info: "bg-sky-400/15 text-sky-200 ring-sky-400/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 ring-0 transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 ring-0 transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 ring-0 transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30",
        className,
      )}
      {...props}
    />
  );
});

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-white/10 p-4", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function Section({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("space-y-4 rounded-3xl border border-white/10 bg-slate-950/50 p-5", className)}
      {...props}
    />
  );
}
