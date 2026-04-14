import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StatBlockCard from './StatBlockCard';

const API = '/api';

function parseIds(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function StatBlockMultiView() {
  const [searchParams] = useSearchParams();
  const ids = useMemo(() => parseIds(searchParams.get('ids')), [searchParams]);

  const [blocks, setBlocks] = useState([]);
  const [skillsRef, setSkillsRef] = useState([]);
  const [traitsRef, setTraitsRef] = useState([]);
  const [weaponsRef, setWeaponsRef] = useState(null);
  const [armourRef, setArmourRef] = useState(null);
  const [careersRef, setCareersRef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ids.length === 0) {
      setBlocks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchSkills = fetch(`${API}/skills`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load skills'))
    );
    const fetchTraits = fetch(`${API}/traits`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load traits'))
    );
    const fetchWeapons = fetch(`${API}/weapons`).then((r) => (r.ok ? r.json() : null));
    const fetchArmour = fetch(`${API}/armour`).then((r) => (r.ok ? r.json() : null));
    const fetchCareers = fetch(`${API}/careers`).then((r) => (r.ok ? r.json() : null));

    const fetchBlocks = Promise.all(
      ids.map((id) =>
        fetch(`${API}/statblocks/${encodeURIComponent(id)}`).then((r) => {
          if (!r.ok) return Promise.reject(new Error(`Not found: ${id}`));
          return r.json();
        })
      )
    );

    Promise.all([fetchBlocks, fetchSkills, fetchTraits, fetchWeapons, fetchArmour, fetchCareers])
      .then(([blockList, skillsData, traitsData, weaponsData, armourData, careersData]) => {
        setBlocks(blockList);
        setSkillsRef(Array.isArray(skillsData) ? skillsData : []);
        setTraitsRef(Array.isArray(traitsData) ? traitsData : []);
        setWeaponsRef(weaponsData || null);
        setArmourRef(armourData || null);
        setCareersRef(careersData || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ids.join(',')]);

  if (ids.length === 0) {
    return (
      <div>
        <Link to="/" className="text-parchment/80 hover:text-parchment text-sm inline-block mb-4">
          ← Bestiary
        </Link>
        <p className="text-parchment/90">
          No stat blocks selected. From the bestiary, tick the boxes next to entries and choose <strong className="text-gold">View together</strong>, or open{' '}
          <code className="text-parchment bg-ink/80 px-1 rounded">/view?ids=id1,id2</code>.
        </p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12 text-parchment/80">Loading…</div>;

  if (error) {
    return (
      <div>
        <Link to="/" className="text-parchment/80 hover:text-parchment text-sm inline-block mb-4">
          ← Bestiary
        </Link>
        <div className="rounded border border-blood/60 bg-blood/10 p-4 text-parchment">
          {error}. <Link to="/" className="text-gold hover:underline">Back to bestiary</Link>.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link to="/" className="text-parchment/80 hover:text-parchment text-sm inline-block">
          ← Bestiary
        </Link>
        <p className="text-parchment/70 text-xs sm:text-sm">
          Two per row on wide screens; more stat blocks continue on the next rows.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-6 items-start">
        {blocks.map((block) => (
          <div key={block.id} className="min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                to={`/statblock/${encodeURIComponent(block.id)}`}
                className="px-2 py-1 text-[0.65rem] uppercase tracking-wider rounded border border-iron/70 bg-ink/70 text-parchment/90 hover:border-gold/60"
              >
                Full page
              </Link>
              <Link
                to={`/statblock/${encodeURIComponent(block.id)}/edit`}
                className="px-2 py-1 text-[0.65rem] uppercase tracking-wider rounded border border-iron/70 bg-ink/70 text-parchment/90 hover:border-gold/60"
              >
                Edit
              </Link>
            </div>
            <StatBlockCard
              block={block}
              dense
              skillsRef={skillsRef}
              traitsRef={traitsRef}
              weaponsRef={weaponsRef}
              armourRef={armourRef}
              careersRef={careersRef}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
