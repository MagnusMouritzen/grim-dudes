import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StatBlockCard from './StatBlockCard';

const API = '/api';

export default function StatBlockView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);
  const [skillsRef, setSkillsRef] = useState([]);
  const [traitsRef, setTraitsRef] = useState([]);
  const [weaponsRef, setWeaponsRef] = useState(null);
  const [armourRef, setArmourRef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const fetchBlock = fetch(`${API}/statblocks/${encodeURIComponent(id)}`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Not found'))
    );
    const fetchSkills = fetch(`${API}/skills`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load skills'))
    );
    const fetchTraits = fetch(`${API}/traits`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load traits'))
    );
    const fetchWeapons = fetch(`${API}/weapons`).then((r) => (r.ok ? r.json() : null));
    const fetchArmour = fetch(`${API}/armour`).then((r) => (r.ok ? r.json() : null));

    Promise.all([fetchBlock, fetchSkills, fetchTraits, fetchWeapons, fetchArmour])
      .then(([blockData, skillsData, traitsData, weaponsData, armourData]) => {
        setBlock(blockData);
        setSkillsRef(Array.isArray(skillsData) ? skillsData : []);
        setTraitsRef(Array.isArray(traitsData) ? traitsData : []);
        setWeaponsRef(weaponsData || null);
        setArmourRef(armourData || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!id) return;
    if (!window.confirm('Delete this stat block? This cannot be undone.')) return;
    fetch(`${API}/statblocks/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete');
        navigate('/');
      })
      .catch((e) => setError(e.message));
  };

  if (loading) return <div className="text-center py-12 text-parchment/80">Loading…</div>;
  if (error) {
    return (
      <div className="rounded border border-blood/60 bg-blood/10 p-4 text-parchment">
        {error}. <Link to="/" className="text-gold hover:underline">Back to bestiary</Link>.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/"
          className="text-parchment/80 hover:text-parchment text-sm inline-block"
        >
          ← Bestiary
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/statblock/${encodeURIComponent(id)}/edit`}
            className="px-3 py-1 text-xs uppercase tracking-wider rounded border border-iron/70 bg-ink/70 text-parchment/90 hover:border-gold/60"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1 text-xs uppercase tracking-wider rounded border border-blood/70 bg-blood/80 text-parchment hover:bg-blood"
          >
            Delete
          </button>
        </div>
      </div>
      <StatBlockCard block={block} skillsRef={skillsRef} traitsRef={traitsRef} weaponsRef={weaponsRef} armourRef={armourRef} />
    </div>
  );
}
