import { useState, useEffect } from 'preact/hooks';

const STORAGE_KEY = 'cc-favorites';

interface CaliberInfo {
  slug: string;
  name: string;
  designation: string;
  category: string;
}

interface Props {
  allCalibers: CaliberInfo[];
  basePath: string;
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setFavorites(favs: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  window.dispatchEvent(new CustomEvent('cc-favorites-changed'));
}

export default function FavoritesList({ allCalibers, basePath }: Props) {
  const [favSlugs, setFavSlugs] = useState<string[]>([]);

  useEffect(() => {
    setFavSlugs(getFavorites());

    function onChanged() {
      setFavSlugs(getFavorites());
    }
    window.addEventListener('cc-favorites-changed', onChanged);
    return () => window.removeEventListener('cc-favorites-changed', onChanged);
  }, []);

  const favorites = favSlugs
    .map(slug => allCalibers.find(c => c.slug === slug))
    .filter(Boolean) as CaliberInfo[];

  if (favorites.length === 0) return null;

  function removeFav(slug: string) {
    const next = getFavorites().filter(s => s !== slug);
    setFavorites(next);
    setFavSlugs(next);
  }

  return (
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div class="mb-6 flex items-center gap-4">
        <div class="h-px flex-1 bg-surface-border" aria-hidden="true"></div>
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text-muted flex items-center gap-2">
          <svg class="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          Your Saved Calibers
        </h2>
        <div class="h-px flex-1 bg-surface-border" aria-hidden="true"></div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map(cal => (
          <div key={cal.slug} class="group relative rounded-lg border border-surface-border bg-surface transition-all hover:border-accent/40 hover:bg-surface-raised hover:shadow-md">
            <a href={`${basePath}/calibers/${cal.slug}`} class="block p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                    {cal.name}
                  </div>
                  <div class="mt-0.5 font-mono text-sm text-text-muted truncate">
                    {cal.designation}
                  </div>
                </div>
                <span class="shrink-0 rounded-full bg-surface-overlay px-2.5 py-0.5 text-xs font-medium text-text-muted">
                  {titleCase(cal.category)}
                </span>
              </div>
            </a>
            <button
              onClick={() => removeFav(cal.slug)}
              aria-label={`Remove ${cal.name} from favorites`}
              class="absolute top-2 right-2 p-1 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
              title="Remove from favorites"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
