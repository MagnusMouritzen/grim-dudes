import Link from 'next/link';
import { ChevronIcon, TombstoneIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="grim-page max-w-xl mx-auto text-center py-12 sm:py-16">
      <div className="grim-card p-10 flex flex-col items-center gap-5">
        <div className="rounded-full border border-gold-600/45 bg-ink-900/85 p-5 ring-1 ring-verdigris-800/25 motion-safe:animate-fade-in">
          <TombstoneIcon className="w-14 h-14 text-blood-400" />
        </div>
        <div className="motion-safe:animate-fade-in">
          <p className="grim-label mb-1">Error 404</p>
          <h1 className="font-display text-display-lg text-gold-300 tracking-wide leading-none shadow-textGold">
            Lost in the Reikwald
          </h1>
          <p className="text-parchment-200/90 mt-3 max-w-sm mx-auto">
            The stat block you seek has wandered into the dark, or never existed at all.
          </p>
        </div>
        <Link href="/" className="grim-btn-ghost">
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" />
          Back to bestiary
        </Link>
      </div>
    </div>
  );
}
