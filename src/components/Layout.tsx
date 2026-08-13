import { NavLink, Outlet } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-teal text-paper' : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
  }`;

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-paper-2 px-4 py-6">
        <h1 className="mb-8 px-1 font-display text-xl font-semibold text-ink">
          Baker&apos;s Costing
        </h1>
        <nav className="flex flex-col gap-1">
          <NavLink to="/materials" className={navLinkClass}>
            Materials
          </NavLink>
          <NavLink to="/recipes" className={navLinkClass}>
            Recipes
          </NavLink>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
