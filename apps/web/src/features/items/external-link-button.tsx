export function ExternalLinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-xl bg-white/8 px-3 py-2 text-sm font-medium text-slate-100 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/12"
    >
      {children}
    </a>
  );
}
