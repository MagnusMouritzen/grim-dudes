import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatBlockCard from './StatBlockCard';

const API = '/api';

export default function StatBlockList() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/statblocks`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then(setBlocks)
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
      <h1 className="font-display text-3xl text-gold mb-6 tracking-wide">Bestiary</h1>
      <div className="grid gap-4">
        {blocks.length === 0 ? (
          <p className="text-parchment/80">No stat blocks yet. <Link to="/new" className="text-gold hover:underline">Create one</Link>.</p>
        ) : (
          blocks.map((block) => (
            <Link key={block.id} to={`/statblock/${block.id}`}>
              <StatBlockCard block={block} compact />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
