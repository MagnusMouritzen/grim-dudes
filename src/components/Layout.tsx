'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import LastEncounterNav from './LastEncounterNav';
import { Heraldry, PlusIcon } from './icons';

type NavLink = {
  href: string;
  label: string;
  matchExact?: boolean;
};

const links: NavLink[] = [
  { href: '/', label: 'Bestiary', matchExact: true },
  { href: '/view', label: 'Encounter' },
  { href: '/new', label: 'New Stat Block' },
];

function isActive(path: string, link: NavLink): boolean {
  if (link.matchExact) return path === link.href;
  return path === link.href || path.startsWith(`${link.href}/`);
}

export default function Layout({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '/';

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 grim-btn-primary"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 print:hidden">
        <div className="bg-ink-900/80 backdrop-blur-md">
          <div className="grim-content-max px-3 sm:px-4 h-[72px] flex items-center justify-between gap-2 min-w-0">
            <Link
              href="/"
              className="group inline-flex items-baseline gap-1.5 sm:gap-2 transition-colors duration-fast ease-grim min-w-0"
              aria-label="Grim Dudes home"
            >
              <span className="font-display text-xl sm:text-2xl md:text-3xl text-gold-400 tracking-wide group-hover:text-parchment truncate">
                Grim Dudes
              </span>
              <span className="hidden sm:inline font-mono text-[0.65rem] uppercase tracking-[0.3em] text-iron-500 group-hover:text-gold-400 transition-colors">
                WFRP 4e
              </span>
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-x-0.5 sm:gap-x-1 gap-y-1 shrink-0 min-w-0">
              {links.map((link) => {
                const active = isActive(path, link);
                const isPrimary = link.href === '/new';
                if (isPrimary) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'grim-btn-primary text-xs !px-2.5 sm:!px-3'
                          : 'grim-header-new-stat'
                      }
                    >
                      <PlusIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="sm:hidden">New</span>
                      <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative px-2 sm:px-3 py-1.5 text-xs uppercase tracking-wider transition-colors duration-fast ease-grim ${
                      active ? 'text-gold-400' : 'text-parchment/80 hover:text-parchment'
                    }`}
                  >
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="navUnderline"
                        className="absolute left-2 right-2 sm:left-3 sm:right-3 -bottom-0.5 h-[2px] bg-gold-500"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                  </Link>
                );
              })}
              <LastEncounterNav />
            </nav>
          </div>
          {/* Double underline: blood thick + gold hair-line */}
          <div className="h-[2px] bg-blood-700/60" />
          <div className="h-px bg-gradient-to-r from-transparent via-gold-600/50 to-transparent" />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 grim-content-max px-3 sm:px-4 py-6 sm:py-8 lg:py-10 relative z-[1] focus:outline-none scroll-mt-20"
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <footer className="print:hidden relative z-[1] pb-8 pt-6">
        <div className="grim-content-max px-3 sm:px-4 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-700/40" />
          <Heraldry className="w-5 h-5 text-gold-500/80" />
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-parchment/50 whitespace-nowrap">
            For the Old World
          </p>
          <Heraldry className="w-5 h-5 text-gold-500/80" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-700/40" />
        </div>
        <div className="mt-3 text-center">
          <Link
            href="/admin"
            className="inline-block font-mono text-[0.6rem] uppercase tracking-[0.3em] text-parchment/30 hover:text-gold-400/70 transition-colors py-1.5 px-2 -m-0.5 rounded-sm"
          >
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
