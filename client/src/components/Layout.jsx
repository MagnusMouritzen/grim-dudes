import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-blood/50 bg-ink/95 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-black/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl md:text-3xl text-gold tracking-wide hover:text-parchment transition-colors">
            Grim Dudes
          </Link>
          <nav className="flex gap-4">
            <Link to="/" className="text-parchment/90 hover:text-parchment text-sm uppercase tracking-wider">
              Bestiary
            </Link>
            <Link to="/new" className="text-blood hover:text-gold text-sm uppercase tracking-wider font-semibold">
              New Stat Block
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-iron/50 py-4 text-center text-parchment/60 text-sm">
        WFRP 4e Stat Block Editor — For the Old World
      </footer>
    </div>
  );
}
