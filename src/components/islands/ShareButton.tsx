import { useState } from 'preact/hooks';

interface Props {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: Props) {
  const [copied, setCopied] = useState(false);
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  async function handleShare() {
    if (hasNativeShare) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or error — fall through to copy
      }
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label={copied ? 'Link copied' : 'Share this caliber'}
      title={copied ? 'Link copied!' : hasNativeShare ? 'Share' : 'Copy link'}
      class={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
        copied
          ? 'border-success/40 bg-success/15 text-success'
          : 'border-surface-border text-text-muted hover:border-accent/30 hover:text-accent'
      }`}
    >
      {copied ? (
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      )}
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}
