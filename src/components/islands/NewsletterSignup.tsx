import { useState } from 'preact/hooks';

const STORAGE_KEY = 'cc-newsletter-subscribed';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'subscribed'>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true' ? 'subscribed' : 'idle';
    } catch {
      return 'idle';
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    // Store subscription intent locally
    // When connected to an email service (Buttondown, Mailchimp, etc.),
    // replace this with an API call to the service endpoint
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('cc-newsletter-email', email);
    } catch {
      // localStorage not available
    }
    setStatus('subscribed');
  }

  if (status === 'subscribed') {
    return (
      <div class="text-center">
        <div class="inline-flex items-center gap-2 text-sm text-success">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          You're on the list. We'll be in touch.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
      <input
        type="email"
        value={email}
        onInput={e => setEmail((e.target as HTMLInputElement).value)}
        placeholder="your@email.com"
        required
        class="flex-1 rounded-md border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        class="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-bright whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  );
}
