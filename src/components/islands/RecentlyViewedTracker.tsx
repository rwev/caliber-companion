import { useEffect } from 'preact/hooks';

const STORAGE_KEY = 'cc-recently-viewed';
const MAX_ITEMS = 12;

interface ViewEntry {
  slug: string;
  ts: number;
}

function getRecent(): ViewEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

interface Props {
  slug: string;
}

export default function RecentlyViewedTracker({ slug }: Props) {
  useEffect(() => {
    const recent = getRecent().filter(e => e.slug !== slug);
    recent.unshift({ slug, ts: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_ITEMS)));
  }, [slug]);

  return null;
}
