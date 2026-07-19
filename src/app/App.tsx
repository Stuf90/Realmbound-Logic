import { useState } from 'react';
import { RoyalInquest } from '../features/royal-inquest/RoyalInquest';
import { SiegeLines } from '../features/siege-lines/SiegeLines';
import './app.css';

type View = 'ledger' | 'inquest-briefing' | 'inquest' | 'siege-briefing' | 'siege';

export function App() {
  const [view, setView] = useState<View>('ledger');
  if (view === 'inquest') return <RoyalInquest onBack={() => setView('ledger')} />;
  if (view === 'siege') return <SiegeLines onBack={() => setView('ledger')} />;
  if (view.endsWith('briefing')) {
    const inquest = view === 'inquest-briefing';
    return <main className="briefing"><button className="text-button" onClick={() => setView('ledger')}>← King’s Ledger</button><div className="briefing-sheet"><p className="eyebrow">By order of the Crown</p><h1>{inquest ? 'The Treason at Blackwood Keep' : 'The Highgate Passage'}</h1><p className="dropcap">{inquest ? 'A royal envoy lies slain inside Blackwood Keep. Six witnesses occupied six distinct rows and columns. Arrange them from their testimony, then identify the sole lord who shared the envoy’s chamber.' : 'The northern road has collapsed beneath a siege train. Rebuild one continuous passage between the two gates while satisfying the masons’ count for every line.'}</p><h2>Your charge</h2><ul>{inquest ? <><li>Place one character in every row and column.</li><li>Respect blocked scenery, chamber boundaries, and witness clues.</li><li>Use ink crosses to mark impossible cells.</li></> : <><li>Lay straight and curved road segments.</li><li>Match every connection and numbered line count.</li><li>Prevent branches, loops, and isolated road.</li></>}</ul><button className="primary" onClick={() => setView(inquest ? 'inquest' : 'siege')}>{inquest ? 'Begin the inquest' : 'Open the works'}</button></div></main>;
  }
  return <main className="ledger"><header><p className="eyebrow">His Majesty’s Office of Reason</p><h1>The King’s Ledger</h1><p>Two urgent commissions await a discerning mind.</p></header><section className="commission-grid" aria-label="Royal commissions"><article className="commission-card"><span className="card-mark">I</span><p className="eyebrow">Royal Inquest</p><h2>The Treason at Blackwood Keep</h2><p>Place six persons within the keep and expose the traitor through spatial deduction.</p><dl><div><dt>Discipline</dt><dd>Investigation</dd></div><div><dt>Board</dt><dd>6 × 6</dd></div></dl><button className="primary" onClick={() => setView('inquest-briefing')}>Read the commission</button></article><article className="commission-card blue"><span className="card-mark">II</span><p className="eyebrow">Siege Lines</p><h2>The Highgate Passage</h2><p>Restore the King’s highway as one exact route through the besieged valley.</p><dl><div><dt>Discipline</dt><dd>Architecture</dd></div><div><dt>Board</dt><dd>7 × 7</dd></div></dl><button className="primary" onClick={() => setView('siege-briefing')}>Read the commission</button></article></section><footer>Progress is kept automatically in this browser.</footer></main>;
}
