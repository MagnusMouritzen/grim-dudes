import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatBlockCard from './StatBlockCard';
import type { Statblock } from '@/lib/types';

const minimal: Statblock = {
  id: 'test-goblin',
  name: 'Test Goblin',
  characteristics: {
    WS: 30,
    BS: 30,
    S: 30,
    T: 30,
    I: 30,
    Ag: 30,
    Dex: 30,
    Int: 30,
    WP: 30,
    Fel: 30,
  },
};

describe('StatBlockCard', () => {
  it('renders the stat block name', () => {
    render(<StatBlockCard block={minimal} compact traitsRef={[]} />);
    expect(screen.getByText('Test Goblin')).toBeInTheDocument();
  });
});
