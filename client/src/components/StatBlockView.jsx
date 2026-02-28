import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatBlockCard from './StatBlockCard';

const API = '/api';

export default function StatBlockView() {
  const { id } = useParams();
  const [block, setBlock] = useState(null);
  const [skillsRef, setSkillsRef] = useState([]);
  const [traitsRef, setTraitsRef] = useState([]);
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

    Promise.all([fetchBlock, fetchSkills, fetchTraits])
      .then(([blockData, skillsData, traitsData]) => {
        setBlock(blockData);
        setSkillsRef(Array.isArray(skillsData) ? skillsData : []);
        setTraitsRef(Array.isArray(traitsData) ? traitsData : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

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
      <Link
        to="/"
        className="text-parchment/80 hover:text-parchment text-sm mb-4 inline-block"
      >
        ← Bestiary
      </Link>
      <StatBlockCard block={block} skillsRef={skillsRef} traitsRef={traitsRef} />
    </div>
  );
}
