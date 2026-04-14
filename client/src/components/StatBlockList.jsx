import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatBlockCard from './StatBlockCard';

const API = '/api';

export default function StatBlockList() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const viewTogether = () => {
    if (selectedIds.length === 0) return;
    const q = selectedIds.map(encodeURIComponent).join(',');
    navigate(`/view?ids=${q}`);
  };

  useEffect(() => {
    fetch(`${API}/statblocks`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then((data) => setBlocks(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-parchment/80">Loading bestiary…</div>
    );
  }
  if (error) {
    return (
      <div className="rounded border border-blood/60 bg-blood/10 p-4 text-parchment">
        Could not load stat blocks: {error}. Make sure the server is running.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-gold tracking-wide">Bestiary</h1>
        {Array.isArray(blocks) && blocks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-parchment/70 text-sm">
              Select several, then open them side by side (two per row on large screens).
            </span>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={viewTogether}
              className="px-3 py-1.5 text-xs uppercase tracking-wider rounded border border-gold/50 bg-blood/30 text-parchment hover:bg-blood/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              View together{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-xs uppercase tracking-wider rounded border border-iron/70 bg-ink/70 text-parchment/90 hover:border-parchment/40"
              >
                Clear selection
              </button>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-4">
        {!Array.isArray(blocks) || blocks.length === 0 ? (
          <p className="text-parchment/80">No stat blocks yet. <Link to="/new" className="text-gold hover:underline">Create one</Link>.</p>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className="flex gap-3 items-stretch">
              <label className="flex items-start pt-4 cursor-pointer shrink-0" title="Select for side-by-side view">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(block.id)}
                  onChange={() => toggleSelected(block.id)}
                  className="mt-1 rounded border-iron/60 bg-ink text-gold focus:ring-gold/40"
                />
              </label>
              <Link to={`/statblock/${block.id}`} className="flex-1 min-w-0 block">
                <StatBlockCard block={block} compact />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
