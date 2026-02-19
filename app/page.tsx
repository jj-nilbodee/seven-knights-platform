import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-void px-4">
      <h1 className="font-display text-4xl font-bold text-text-primary tracking-tight">
        Seven Knights Re:Birth
      </h1>
      <p className="mt-3 text-text-secondary">
        ระบบจัดการกิลด์แบบครบวงจร
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-accent px-6 text-sm font-medium text-white hover:bg-accent-bright transition-colors"
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          href="/gvg-guides"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-border-default px-6 text-sm font-medium text-text-primary hover:bg-bg-elevated transition-colors"
        >
          คู่มือ GVG
        </Link>
      </div>
    </div>
  );
}
