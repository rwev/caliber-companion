import { useState, useEffect } from 'preact/hooks';

const STORAGE_KEY = 'cc-favorites';

interface Props {
  slug: string;
  name: string;
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

export default function FavoriteButton({ slug, name }: Props) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(getFavorites().includes(slug));
  }, [slug]);

  function toggle() {
    const favs = getFavorites();
    let next: string[];
    if (favs.includes(slug)) {
      next = favs.filter(s => s !== slug);
    } else {
      next = [...favs, slug];
    }
    setFavorites(next);
    setIsFav(!isFav);
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFav ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      aria-pressed={isFav}
      title={isFav ? 'Remove from favorites' : 'Save to favorites'}
      class={`inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-sm tracking-wider uppercase transition-colors ${
        isFav
          ? 'border-accent/40 bg-accent/15 text-accent'
          : 'border-surface-border text-text-muted hover:border-accent/30 hover:text-accent'
      }`}
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
      {isFav ? 'Saved' : 'Save'}
    </button>
  );
}
