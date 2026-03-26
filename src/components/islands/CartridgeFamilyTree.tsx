import { useState, useMemo } from 'preact/hooks';

interface TreeNode {
  slug: string;
  name: string;
  category: string;
  year: number;
  children: TreeNode[];
}

interface Props {
  trees: TreeNode[];
  basePath: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  handgun: 'border-blue-500/40 bg-blue-500/10',
  rifle: 'border-green-500/40 bg-green-500/10',
  shotgun: 'border-orange-500/40 bg-orange-500/10',
  pdw: 'border-purple-500/40 bg-purple-500/10',
  magnum_handgun: 'border-pink-500/40 bg-pink-500/10',
  magnum_rifle: 'border-red-500/40 bg-red-500/10',
};

const CATEGORY_TEXT: Record<string, string> = {
  handgun: 'text-blue-400',
  rifle: 'text-green-400',
  shotgun: 'text-orange-400',
  pdw: 'text-purple-400',
  magnum_handgun: 'text-pink-400',
  magnum_rifle: 'text-red-400',
};

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function countDescendants(node: TreeNode): number {
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

function TreeNodeComponent({ node, basePath, depth = 0 }: { node: TreeNode; basePath: string; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const descendantCount = useMemo(() => countDescendants(node), [node]);
  const colorClass = CATEGORY_COLORS[node.category] || 'border-surface-border bg-surface-raised';
  const textClass = CATEGORY_TEXT[node.category] || 'text-text-muted';

  return (
    <div class={depth > 0 ? 'ml-4 sm:ml-6 border-l border-surface-border-subtle pl-3 sm:pl-4' : ''}>
      <div class="flex items-center gap-2 py-1">
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            class="flex h-5 w-5 shrink-0 items-center justify-center border border-surface-border rounded-md text-text-muted hover:border-accent hover:text-accent transition-colors text-xs font-mono"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          >
            {expanded ? '−' : '+'}
          </button>
        )}
        {!hasChildren && <div class="w-5 shrink-0" />}

        <a
          href={`${basePath}/calibers/${node.slug}`}
          class={`group flex items-center gap-2 border rounded-md px-2.5 py-1 transition-colors hover:border-accent/50 ${colorClass}`}
        >
          <span class="font-mono text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
            {node.name}
          </span>
          <span class="font-mono text-xs text-text-muted">{node.year}</span>
        </a>

        {hasChildren && !expanded && (
          <span class="font-mono text-xs text-text-muted">
            +{descendantCount} derived
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div class="mt-0.5">
          {node.children.map(child => (
            <TreeNodeComponent key={child.slug} node={child} basePath={basePath} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CartridgeFamilyTree({ trees, basePath }: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Get all categories present
  const categories = useMemo(() => {
    const cats = new Set<string>();
    function walk(node: TreeNode) {
      cats.add(node.category);
      node.children.forEach(walk);
    }
    trees.forEach(walk);
    return [...cats].sort();
  }, [trees]);

  // Filter trees
  const filteredTrees = useMemo(() => {
    let result = trees;

    if (filter) {
      function hasCategory(node: TreeNode): boolean {
        if (node.category === filter) return true;
        return node.children.some(hasCategory);
      }
      function filterTree(node: TreeNode): TreeNode | null {
        if (node.category === filter) return node;
        const filteredChildren = node.children
          .map(filterTree)
          .filter(Boolean) as TreeNode[];
        if (filteredChildren.length > 0 || node.category === filter) {
          return { ...node, children: filteredChildren };
        }
        return null;
      }
      result = result.map(filterTree).filter(Boolean) as TreeNode[];
    }

    if (search) {
      const q = search.toLowerCase();
      function hasMatch(node: TreeNode): boolean {
        if (node.name.toLowerCase().includes(q)) return true;
        return node.children.some(hasMatch);
      }
      function filterSearch(node: TreeNode): TreeNode | null {
        const nameMatch = node.name.toLowerCase().includes(q);
        const childResults = node.children
          .map(filterSearch)
          .filter(Boolean) as TreeNode[];
        if (nameMatch || childResults.length > 0) {
          return { ...node, children: nameMatch ? node.children : childResults };
        }
        return null;
      }
      result = result.map(filterSearch).filter(Boolean) as TreeNode[];
    }

    return result;
  }, [trees, filter, search]);

  // Count total nodes
  const totalNodes = useMemo(() => {
    let count = 0;
    function walk(node: TreeNode) { count++; node.children.forEach(walk); }
    trees.forEach(walk);
    return count;
  }, [trees]);

  const rootCount = filteredTrees.length;

  return (
    <div>
      {/* Controls */}
      <div class="mb-6 space-y-4">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search calibers in the tree..."
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            aria-label="Search calibers"
            class="w-full border border-surface-border bg-surface-raised py-3 pl-10 pr-4 rounded-md text-base text-text-primary placeholder:text-text-muted focus:border-accent/50"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            <button
              onClick={() => setFilter(null)}
              aria-pressed={!filter}
              class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !filter
                  ? 'border border-accent/30 bg-accent/15 text-accent'
                  : 'border border-surface-border text-text-muted hover:text-text-secondary'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? null : cat)}
                aria-pressed={filter === cat}
                class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === cat
                    ? 'border border-accent/30 bg-accent/15 text-accent'
                    : 'border border-surface-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {titleCase(cat)}
              </button>
            ))}
          </div>

          <span class="font-mono text-sm text-text-muted ml-auto" aria-live="polite">
            {totalNodes} calibers · {rootCount} famil{rootCount === 1 ? 'y' : 'ies'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div class="mb-6 flex flex-wrap gap-3">
        {categories.map(cat => (
          <div key={cat} class="flex items-center gap-1.5">
            <div class={`w-3 h-3 border ${CATEGORY_COLORS[cat] || 'border-surface-border bg-surface-raised'}`} />
            <span class="text-xs text-text-muted">{titleCase(cat)}</span>
          </div>
        ))}
      </div>

      {/* Tree */}
      {filteredTrees.length === 0 ? (
        <div class="py-12 text-center" role="status">
          <div class="text-base text-text-muted">No caliber families match your search.</div>
        </div>
      ) : (
        <div class="space-y-4">
          {filteredTrees
            .sort((a, b) => countDescendants(b) - countDescendants(a))
            .map(tree => (
              <div key={tree.slug} class="border border-surface-border rounded-lg bg-surface p-4">
                <TreeNodeComponent node={tree} basePath={basePath} depth={0} />
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
