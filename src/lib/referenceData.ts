import skills from '../../data/skills.json';
import traits from '../../data/traits.json';
import careers from '../../data/careers.json';
import weaponsQualities from '../../data/weapons/qualities-and-flaws.json';
import meleeWeapons from '../../data/weapons/melee-weapons.json';
import rangedWeapons from '../../data/weapons/ranged-weapons.json';
import ammunition from '../../data/weapons/ammunition.json';
import armourQualities from '../../data/armour/qualities-and-flaws.json';
import armourItems from '../../data/armour/armour.json';
import dogTemplate from '../../data/templates/dog.json';
import humanTemplate from '../../data/templates/human.json';
import ogreTemplate from '../../data/templates/ogre.json';
import saurusTemplate from '../../data/templates/saurus.json';
import skeletonMinionTemplate from '../../data/templates/skeleton-minion.json';
import skinkTemplate from '../../data/templates/skink.json';

type TemplateLike = Record<string, unknown> & { id?: string; name?: string };

const TEMPLATE_FILES: Record<string, TemplateLike> = {
  dog: dogTemplate as TemplateLike,
  human: humanTemplate as TemplateLike,
  ogre: ogreTemplate as TemplateLike,
  saurus: saurusTemplate as TemplateLike,
  'skeleton-minion': skeletonMinionTemplate as TemplateLike,
  skink: skinkTemplate as TemplateLike,
};

function slugifyTemplateId(id: string): string {
  const safe = id.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase();
  return safe || 'template';
}

const TEMPLATES: TemplateLike[] = Object.entries(TEMPLATE_FILES).map(([fileId, data]) => ({
  id: data.id || fileId,
  name: data.name || 'Template',
  ...data,
}));

const TEMPLATES_BY_ID: Map<string, TemplateLike> = (() => {
  const m = new Map<string, TemplateLike>();
  for (const [fileId, data] of Object.entries(TEMPLATE_FILES)) {
    const merged: TemplateLike = { id: data.id || fileId, name: data.name || 'Template', ...data };
    m.set(fileId, merged);
    if (typeof merged.id === 'string' && merged.id !== fileId) m.set(merged.id, merged);
  }
  return m;
})();

export function getSkills(): unknown[] {
  return Array.isArray(skills) ? skills : [];
}

export function getTraits(): unknown[] {
  return Array.isArray(traits) ? traits : [];
}

export function getWeaponsBundle() {
  return {
    qualitiesAndFlaws: Array.isArray(weaponsQualities) ? weaponsQualities : [],
    melee: meleeWeapons,
    ranged: rangedWeapons,
    ammunition,
  };
}

export function getArmourBundle() {
  return {
    qualitiesAndFlaws: Array.isArray(armourQualities) ? armourQualities : [],
    armour: armourItems,
  };
}

export function getCareers() {
  return careers;
}

export function listTemplates(): TemplateLike[] {
  return TEMPLATES;
}

export function getTemplateById(id: string): TemplateLike | null {
  const direct = TEMPLATES_BY_ID.get(id);
  if (direct) return direct;
  const bySlug = TEMPLATES_BY_ID.get(slugifyTemplateId(id));
  return bySlug ?? null;
}
