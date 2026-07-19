import { useState } from 'react';

type AppView = 'ledger' | 'briefing' | 'play';

export function App() {
  const [view, setView] = useState<AppView>('ledger');

  if (view === 'play') {
    return (
      <main>
        <h1>The Treason at Blackwood Keep</h1>
        <p>The inquest has begun.</p>
      </main>
    );
  }

  if (view === 'briefing') {
    return (
      <main>
        <h1>The Treason at Blackwood Keep</h1>
        <button type="button" onClick={() => setView('play')}>
          Begin the inquest
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>The King's Ledger</h1>
      <button type="button" onClick={() => setView('briefing')}>
        The Treason at Blackwood Keep
      </button>
    </main>
  );
}
