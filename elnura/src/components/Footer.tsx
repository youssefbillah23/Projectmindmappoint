import { brand } from "../lib/content";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col items-center gap-6 py-10 text-sm text-ink/55 md:flex-row md:justify-between">
        <span className="font-medium text-ink">{brand.name}</span>
        <nav className="flex items-center gap-6">
          <a href={brand.instagram} className="transition-colors hover:text-ink">
            Instagram
          </a>
          <a href={brand.email} className="transition-colors hover:text-ink">
            Email
          </a>
          <a href="#approach" className="transition-colors hover:text-ink">
            Approach
          </a>
        </nav>
        <span>
          © {year} {brand.name} · {brand.role}
        </span>
      </div>
    </footer>
  );
}
