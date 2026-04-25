/**
 * One-line summary for appending pool rolls to the combat & scene log.
 */

export function formatNd6LogLine(rolls: number[], _subtotal: number, mod: number, total: number): string {
  const dice = rolls.join(' ');
  const m =
    mod !== 0
      ? `, mod ${mod > 0 ? `+${mod}` : String(mod)}`
      : '';
  return `Nd6: ${total} — ${dice}${m}`;
}

export function formatNd10LogLine(rolls: number[], _subtotal: number, mod: number, total: number): string {
  const dice = rolls.join(' ');
  const m =
    mod !== 0
      ? `, mod ${mod > 0 ? `+${mod}` : String(mod)}`
      : '';
  return `Nd10: ${total} — ${dice}${m}`;
}
