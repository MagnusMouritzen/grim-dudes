'use client';

import { useState } from 'react';
import { ChevronIcon } from './icons';

/**
 * Short, original reminders — not a substitute for the rulebook (copyright).
 */
export default function ViewGmQuickRef() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grim-card p-4 print:hidden border-iron-700/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-gold-400/95 text-sm uppercase tracking-wider">
          GM reminders
        </span>
        <ChevronIcon
          className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="mt-3 space-y-2 text-parchment/85 text-sm list-disc pl-4">
          <li>
            <strong className="text-parchment/95">Tests:</strong> apply difficulty, help, and other
            modifiers at the table, then use your final target number for this roller.
          </li>
          <li>
            <strong className="text-parchment/95">Advantage &amp; outnumbering:</strong> your rulebook
            covers how the outnumbered side takes penalties and how groups build or spend Advantage in
            combat—keep the book or a cheat-sheet within reach.
          </li>
          <li>
            <strong className="text-parchment/95">Criticals &amp; 00/100:</strong> 01 and 100 interact
            with your chosen critical / miscast tables; this app only shows the raw d100.
          </li>
          <li>
            <strong className="text-parchment/95">d6 pools:</strong> many subsystems use d6 in a
            specific way—use the Nd6 roller only as a quick sum, then apply the correct book steps.
          </li>
          <li>
            <strong className="text-parchment/95">Tens/ones on d100:</strong> the roller shows both
            digits for tables that read the dice separately; your group still uses one total for tests vs
            a target.
          </li>
          <li>
            <strong className="text-parchment/95">Bestiary:</strong> stars on the home page are
            shortcuts for recurring characters—kept in this browser only, not in your account or export.
          </li>
          <li>
            <strong className="text-parchment/95">Session notes</strong> on /view and stat pages are a
            scratchpad; use <strong className="text-parchment/95">Copy</strong> to paste threads,
            handouts, or next-session prep elsewhere.             <strong className="text-parchment/95">Copy
            session</strong> bundles initiative (if any), notes, and the combat log in one paste—plain
            or <strong className="text-parchment/95">Copy MD</strong> for markdown (linked initiative when
            block-linked).
          </li>
          <li>
            <strong className="text-parchment/95">Text</strong> on a stat page copies a short
            plain summary (wounds, move, blurb) plus the link—handy for Discord or a VTT token note.
          </li>
          <li>
            <strong className="text-parchment/95">Initiative copy:</strong> includes the{' '}
            <strong className="text-parchment/95">round</strong> number and marks who has the{' '}
            <strong className="text-parchment/95">turn</strong> if you set it with the Turn button. The{' '}
            <strong className="text-parchment/95">Time</strong> (fiction clock) lives on multi-block{' '}
            <strong className="text-parchment/95">/view</strong> initiative and on a stat page’s GM tools
            strip; it is included in list copies and in <strong className="text-parchment/95">Copy turn</strong>;
            if there is no initiative, time still appears in <strong className="text-parchment/95">Copy session</strong>. If any
            scratch counters (Fortune, XP, Tension, Advantage) are above zero, copy also appends a short{' '}
            <strong className="text-parchment/95">Table (scratch)</strong> line. Set an{' '}
            <strong className="text-parchment/95">Encounter name</strong> to prefix pasted text. Per-row{' '}
            <strong className="text-parchment/95">State</strong> (optional) is included in those copies and in
            the list—your rulebook still defines the condition.
          </li>
          <li>
            <strong className="text-parchment/95">New round:</strong> adds 1 to the session{' '}
            <strong className="text-parchment/95">Round</strong> and sets{' '}
            <strong className="text-parchment/95">turn</strong> to the first combatant in the sorted list
            (highest Init)—handy when a full initiative pass finishes.
          </li>
          <li>
            <strong className="text-parchment/95">Improv</strong> draws are original table prompts (name,
            complication, atmosphere, weather, street, rumour, motive, voice, twist), not published
            tables—use them as sparks, then resolve with the book.
          </li>
          <li>
            <strong className="text-parchment/95">Imperial coin:</strong> on a stat page you get
            compact normalize + copy. On <strong className="text-parchment/95">/view</strong>, the same
            tool can add a <strong className="text-parchment/95">second pile</strong> and{' '}
            <strong className="text-parchment/95">split among N</strong> (equal shares, with a note for
            remainder bp)—prices, quality, and haggling still come from the book.
          </li>
          <li>
            <strong className="text-parchment/95">d100 tags</strong> label what a roll was for (e.g. Lore,
            Charm, Melee, Perception)—they do not set targets; you still choose the number after modifiers;
            they appear in <strong className="text-parchment/95">Last d100</strong> for recent rolls.
          </li>
          <li>
            <strong className="text-parchment/95">Opposed d100</strong> rolls two dice with optional
            1–100 targets; if only one side passes the simple test, the card says who leads, otherwise it
            points to Success Levels (both pass) or your book (both fail, crits, etc.).
          </li>
          <li>
            <strong className="text-parchment/95">Fortune (scratch):</strong> the small counter by the
            round is for quick table tracking only—not your official character record.
          </li>
          <li>
            <strong className="text-parchment/95">XP (scratch):</strong> running total you intend to
            hand out or discuss—type a number or use ±1 / ±5. Not written to any stat block here.
          </li>
          <li>
            <strong className="text-parchment/95">Tension (0–8):</strong> a narrative dial for how hot
            the situation feels—optional; use (or ignore) to match your group’s play style.
          </li>
          <li>
            <strong className="text-parchment/95">Adv (scratch):</strong> rough combat Advantage for
            whichever side you are tracking—your book rules when it accrues and caps.
          </li>
          <li>
            <strong className="text-parchment/95">Combat &amp; scene log</strong> adds timestamped lines
            without replacing your session notes—handy for tracking what happened in a fight. After a d100
            roll,             <strong className="text-parchment/95">To log</strong> appends that result (with tag and
            optional vs target) to the log. <strong className="text-parchment/95">Opposed d100</strong>,{' '}
            <strong className="text-parchment/95">Nd6</strong>, and <strong className="text-parchment/95">Nd10</strong>{' '}
            can append the same way when present.
          </li>
        </ul>
      )}
    </div>
  );
}
