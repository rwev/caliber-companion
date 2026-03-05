import { useState, useRef, useEffect } from 'preact/hooks';

interface CaliberIndex {
  name: string;
  slug: string;
  designation: string;
}

interface Props {
  calibers: CaliberIndex[];
  basePath: string;
}

export default function CaliberSearch({ calibers, basePath }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length > 0
    ? calibers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.designation.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  function navigate(slug: string) {
    window.location.href = `${basePath}/calibers/${slug}`;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      navigate(results[activeIdx].slug);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div class="relative" ref={containerRef}>
      <div class="relative">
        <svg class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onInput={(e) => { setQuery((e.target as HTMLInputElement).value); setOpen(true); }}
          onFocus={() => { if (query.length > 0) setOpen(true); }}
          onKeyDown={onKeyDown}
          class="w-28 border border-surface-border bg-surface-raised py-1.5 pl-7 pr-2 font-mono text-sm text-text-primary placeholder:text-text-muted transition-all focus:w-44 focus:border-accent/40 focus:outline-none sm:w-32 sm:focus:w-52"
        />
      </div>

      {open && results.length > 0 && (
        <div class="absolute right-0 top-full z-30 mt-1 w-64 border border-surface-border bg-surface-raised shadow-xl">
          {results.map((cal, i) => (
            <button
              key={cal.slug}
              onClick={() => navigate(cal.slug)}
              class={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                i === activeIdx ? 'bg-accent/15 text-accent' : 'hover:bg-surface-overlay'
              }`}
            >
              <span class="font-mono text-sm text-text-primary">{cal.name}</span>
              <span class="font-mono text-sm text-text-muted">{cal.designation}</span>
            </button>
          ))}
        </div>
      )}

      {open && query.length > 0 && results.length === 0 && (
        <div class="absolute right-0 top-full z-30 mt-1 w-64 border border-surface-border bg-surface-raised px-3 py-2 shadow-xl">
          <span class="font-mono text-sm text-text-muted">No results</span>
        </div>
      )}
    </div>
  );
}
