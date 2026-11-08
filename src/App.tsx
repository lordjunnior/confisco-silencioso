import { useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { SuiteHero, Stat, Faq } from './SovereignKit';
import { gramPrice, accumulate, btcValueToday, parseSgs, purchasingPower } from './lib/public-radar';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pad = (n: number) => String(n).padStart(2, '0');
const sgs = (serie: number, ini: string, fim: string) => fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${ini}&dataFinal=${fim}`).then(r => { if (!r.ok) throw new Error(); return r.json(); });

type Res = { factor: number; real: number; usdNow: number; usdThen: number; btcThen: number; btcNow: number; months: number; at: string; gramBrl: number };

export default function ConfiscoSilencioso() {
  const now = new Date();
  const [amount, setAmount] = useState(10_000);
  const [year, setYear] = useState(now.getFullYear() - 10);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);
  const [err, setErr] = useState('');

  const run = async () => {
    setBusy(true); setErr(''); setRes(null);
    try {
      const ini = `01/01/${year}`, fim = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
      // SÃ©rie 1 (PTAX) sÃ³ aceita janelas de atÃ© 10 anos: pegamos inÃ­cio e fim separadamente.
      const [ipca, usdA, usdB] = await Promise.all([sgs(433, ini, fim), sgs(1, ini, `15/01/${year}`), sgs(1, (d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`)(new Date(now.getTime() - 20 * 864e5)), fim)]);
      const monthly = parseSgs(ipca);
      const usdThen = parseSgs(usdA)[0] ?? 0, usdNow = parseSgs(usdB).at(-1)!;
      const ts = Math.floor(new Date(year, 0, 2).getTime() / 1000);
      const [hist, cur, gold] = await Promise.all([fetch(`https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${ts}`).then(r => r.json()), fetch('https://mempool.space/api/v1/prices').then(r => r.json()), fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=brl').then(r => r.ok ? r.json() : null).catch(() => null)]);
      const btcUsdThen = hist.prices?.[0]?.USD ?? 0;
      const factor = accumulate(monthly);
      setRes({ factor, real: purchasingPower(amount, factor), usdNow, usdThen, btcThen: btcUsdThen * usdThen, btcNow: cur.USD * usdNow, months: monthly.length, at: new Date().toLocaleString('pt-BR'), gramBrl: gramPrice(gold?.['pax-gold']?.brl ?? 0) });
    } catch { setErr('O Banco Central ou a mempool.space nÃ£o responderam agora. Tente de novo.'); }
    setBusy(false);
  };

  const lost = res ? amount - res.real : 0;
  const inUsd = res ? (amount / res.usdThen) * res.usdNow : 0;
  const inBtc = res ? btcValueToday(amount, res.btcThen, res.btcNow) : 0;

  return <div className="ss-root">
    <SuiteHero kicker="Defesa patrimonial Â· Dados oficiais" title="Confisco" accent="Silencioso" repo="https://dadosabertos.bcb.gov.br" repoLabel="BANCO CENTRAL (SGS) Â· MEMPOOL.SPACE Â· PAX GOLD" prefix="SÃ‰RIES OFICIAIS DE"
      note="IPCA E DÃ“LAR PTAX DO BANCO CENTRAL Â· PREÃ‡O DO BITCOIN DA MEMPOOL.SPACE"
      lead="Escolha um valor e um ano. A ferramenta busca a inflaÃ§Ã£o oficial mÃªs a mÃªs e mostra quanto do seu poder de compra foi levado, comparando com o que teria acontecido se o dinheiro estivesse em dÃ³lar ou em Bitcoin." />
    <div className="ss-wrap">
      <section className="ss-plate">
        <span className="ss-tag">01 Â· PARÃ‚METROS</span>
        <h2>Seu dinheiro parado</h2>
        <div className="ss-grid even">
          <div><label className="ss-label" htmlFor="cs-v">Valor guardado (R$)</label>
            <input id="cs-v" className="ss-input" type="number" min={1} value={amount} onChange={e => setAmount(Math.max(1, Number(e.target.value) || 1))} /></div>
          <div><label className="ss-label" htmlFor="cs-y">Desde janeiro de {year}</label>
            <input id="cs-y" className="ss-range" type="range" min={2012} max={now.getFullYear() - 1} value={year} onChange={e => setYear(Number(e.target.value))} /></div>
        </div>
        <button type="button" className="ss-btn" style={{ marginTop: 18 }} disabled={busy} onClick={run}><TrendingDown size={14} />{busy ? 'Buscando sÃ©riesâ€¦' : 'Medir o confisco'}</button>
        {err && <p className="ss-warn" style={{ marginTop: 16 }}>{err}</p>}
      </section>
      {res && <section className="ss-plate" aria-live="polite">
        <span className="ss-tag">02 Â· RESULTADO</span>
        <h2>{brl(amount)} de {year} hoje compram {brl(res.real)}</h2>
        <div className="ss-stats" style={{ marginTop: 16 }}>
          <Stat value={`-${((lost / amount) * 100).toFixed(1)}%`} label="Poder de compra perdido" tone="ember" />
          <Stat value={`${((res.factor - 1) * 100).toFixed(1)}%`} label={`IPCA acumulado (${res.months} meses)`} />
          <Stat value={brl(inUsd)} label="Se tivesse virado dÃ³lar" />
          <Stat value={brl(inBtc)} label="Se tivesse virado Bitcoin" tone="hot" />
        </div>
        {res.gramBrl > 0 && <div className="ss-stats" style={{ marginTop: 12 }}>
          <Stat value={res.gramBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} label="Grama de ouro hoje (PAXG)" />
          <Stat value={`${(amount / res.gramBrl).toFixed(1)} g`} label={`${brl(amount)} em ouro hoje`} />
          <Stat value={`${(lost / res.gramBrl).toFixed(1)} g`} label="Ouro que a inflaÃ§Ã£o levou" tone="ember" />
          <Stat value={Math.round((amount / res.btcNow) * 1e8).toLocaleString('pt-BR')} label={`${brl(amount)} em satoshis hoje`} tone="hot" />
        </div>}
        <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
          {[['Real parado (valor real)', res.real], ['DÃ³lar', inUsd], ['Bitcoin', inBtc]].map(([n, v]) => { const max = Math.max(res.real, inUsd, inBtc); return <div key={n as string}><span className="ss-label">{n} Â· {brl(v as number)}</span><div className="ss-pipe" style={{ height: 12 }}><span className="out" style={{ width: `${Math.max(1, ((v as number) / max) * 100)}%` }} /></div></div>; })}
        </div>
        <p className="ss-sub" style={{ marginTop: 14 }}>Consultado em {res.at}. Fontes: IPCA (SGS 433) e dÃ³lar PTAX (SGS 1) do Banco Central; preÃ§o do Bitcoin em dÃ³lar da mempool.space; grama de ouro pelo PAX Gold (1 token = 1 onÃ§a troy) na CoinGecko, sÃ³ com preÃ§o atual, porque a sÃ©rie histÃ³rica gratuita nÃ£o cobre todos os anos. LimitaÃ§Ã£o: retorno passado nÃ£o garante retorno futuro, e o preÃ§o do Bitcoin oscila muito.</p>
      </section>}
      <Faq items={[
        { q: 'Por que confisco?', a: 'Porque a inflaÃ§Ã£o tira poder de compra de quem guarda dinheiro sem precisar de votaÃ§Ã£o, decreto ou aviso.' },
        { q: 'Os nÃºmeros sÃ£o oficiais?', a: 'IPCA e dÃ³lar vÃªm direto da API pÃºblica do Banco Central. O cÃ¡lculo Ã© feito no seu navegador.' },
      ]} />
    </div>
  </div>;
}

