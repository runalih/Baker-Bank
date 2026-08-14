import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-teal text-paper' : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
  }`;

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink md:flex-row">
      <aside className="flex shrink-0 flex-row flex-wrap items-center gap-3 border-b border-line bg-paper-2 px-4 py-3 md:w-56 md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:border-r md:px-4 md:py-6">
        <h1 className="font-display text-xl font-semibold text-ink md:mb-8 md:px-1">
          BakerBank
        </h1>
        <nav className="flex flex-row gap-1 md:flex-col">
          <NavLink to="/materials" className={navLinkClass}>
            Materials
          </NavLink>
          <NavLink to="/recipes" className={navLinkClass}>
            Recipes
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={() => signOut()}
          className="ml-auto shrink-0 rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-paper md:hidden"
        >
          Sign out
        </button>

        <div className="hidden md:mt-auto md:block md:w-full md:border-t md:border-line md:pt-4">
          <p className="mb-2 truncate px-1 text-xs text-ink-2" title={user?.email ?? ''}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-ink-2 hover:bg-paper"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
