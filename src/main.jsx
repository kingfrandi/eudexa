import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const assets = [
  ['Bitcoin', 'BTC', 'Crypto', '68,420.00', '+2.4%'],
  ['Ethereum', 'ETH', 'Crypto', '3,620.00', '+1.8%'],
  ['Apple', 'AAPL', 'Stock', '218.40', '+0.6%'],
  ['NVIDIA', 'NVDA', 'Stock', '142.20', '-0.8%'],
  ['Gold', 'XAU', 'Commodity', '2,340.00', '+0.3%'],
  ['S&P 500', 'SPX', 'Index', '5,420.30', '+0.4%'],
  ['EUR/USD', 'EURUSD', 'Forex', '1.0842', '-0.1%']
];

const rates = { USD: 1, EUR: 0.92, DOP: 59.1, GBP: 0.78, JPY: 156.4, MXN: 16.9 };

function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ES');
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('DOP');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [expression, setExpression] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const result = ((Number(amount) || 0) / rates[from]) * rates[to];
  const filtered = useMemo(() => {
    const text = query.toLowerCase();
    return assets.filter((asset) => asset.join(' ').toLowerCase().includes(text));
  }, [query]);

  const swapCurrencies = () => {
    setFrom(to);
    setTo(from);
  };

  const pressCalculator = (key) => {
    if (key !== '=') {
      setExpression((value) => value + key);
      return;
    }

    try {
      const safe = expression
        .replaceAll('×', '*')
        .replaceAll('÷', '/')
        .replaceAll('−', '-');
      if (!/^[0-9+\-*/.() ]+$/.test(safe)) throw new Error('Invalid expression');
      setExpression(String(Function(`"use strict"; return (${safe})`)()));
    } catch {
      setExpression('Error');
    }
  };

  return (
    <div className="app">
      <header>
        <b className="logo">EUDEXA<span>•</span></b>
        <nav>
          <a href="#markets">{lang === 'ES' ? 'Mercados' : 'Markets'}</a>
          <a href="#converter">{lang === 'ES' ? 'Convertidor' : 'Converter'}</a>
          <a href="#education">{lang === 'ES' ? 'Educación' : 'Education'}</a>
        </nav>
        <div className="tools">
          <button onClick={() => setSearchOpen((value) => !value)}>⌕</button>
          <button onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')}>{lang}</button>
          <button onClick={() => setDark((value) => !value)}>{dark ? '☀' : '☾'}</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">FINANCIAL INTELLIGENCE</p>
            <h1>{lang === 'ES' ? 'Datos financieros globales, herramientas y educación.' : 'Global financial data, tools and education.'}</h1>
            <p className="sub">{lang === 'ES' ? 'Información clara para entender los mercados, sin recomendaciones de inversión.' : 'Clear information to understand markets, without investment recommendations.'}</p>
          </div>
          <div className="status">● DEMO DATA<br /><small>{lang === 'ES' ? 'Datos de demostración — no tiempo real' : 'Demo data — not real time'}</small></div>
        </section>

        {searchOpen && (
          <section className="search">
            <input autoFocus placeholder="Bitcoin, Apple, Gold, EUR/USD..." value={query} onChange={(event) => setQuery(event.target.value)} />
            {query.trim() && filtered.map((asset) => (
              <div className="result" key={asset[1]}>
                <b>{asset[0]}</b>
                <span>{asset[2]} · {asset[1]}</span>
                <strong>{asset[3]} <i className={asset[4].startsWith('-') ? 'neg' : ''}>{asset[4]}</i></strong>
              </div>
            ))}
          </section>
        )}

        <section id="converter" className="converter">
          <div>
            <p className="eyebrow">{lang === 'ES' ? 'HERRAMIENTA PRINCIPAL' : 'MAIN TOOL'}</p>
            <h2>{lang === 'ES' ? 'Convertidor de divisas' : 'Currency converter'}</h2>
            <p>{lang === 'ES' ? 'Convierte entre monedas internacionales.' : 'Convert between international currencies.'}</p>
          </div>
          <div className="convertbox">
            <label>{lang === 'ES' ? 'Cantidad' : 'Amount'}<input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
            <div className="selects">
              <select value={from} onChange={(event) => setFrom(event.target.value)}>{Object.keys(rates).map((currency) => <option key={currency}>{currency}</option>)}</select>
              <button className="swap" onClick={swapCurrencies}>⇄</button>
              <select value={to} onChange={(event) => setTo(event.target.value)}>{Object.keys(rates).map((currency) => <option key={currency}>{currency}</option>)}</select>
            </div>
            <div className="total">{from} → {to}<strong>{new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(result)} {to}</strong></div>
          </div>
        </section>

        <div className="ad">ADVERTISEMENT · AdSlot reserved</div>

        <Market title={lang === 'ES' ? 'Tipos de cambio' : 'Exchange rates'} data={[
          ['USD / EUR', 'EURUSD', 'Forex', '0.9200', '+0.1%'],
          ['USD / DOP', 'USDDOP', 'Forex', '59.10', '+0.2%'],
          ['GBP / USD', 'GBPUSD', 'Forex', '1.2820', '-0.1%'],
          ['USD / JPY', 'USDJPY', 'Forex', '156.40', '+0.3%']
        ]} />

        <Market title={lang === 'ES' ? 'Mercado cripto' : 'Crypto market'} data={[
          ...assets.slice(0, 2),
          ['Tether', 'USDT', 'Crypto', '1.00', '0.0%'],
          ['Solana', 'SOL', 'Crypto', '156.20', '+3.1%']
        ]} />

        <div className="ad">ADVERTISEMENT · AdSlot reserved</div>

        <section id="markets">
          <Market title={lang === 'ES' ? 'Mercados financieros' : 'Financial markets'} data={assets.filter((asset) => ['Stock', 'Index'].includes(asset[2]))} />
          <Market title={lang === 'ES' ? 'Materias primas' : 'Commodities'} data={[
            ['Gold', 'XAU', 'Commodity', '2,340.00 / oz', '+0.3%'],
            ['Silver', 'XAG', 'Commodity', '30.10 / oz', '+0.5%'],
            ['WTI Oil', 'WTI', 'Commodity', '78.20 / bbl', '-0.4%'],
            ['Natural Gas', 'NG', 'Commodity', '2.21', '+1.2%']
          ]} />
        </section>

        <section id="education" className="education">
          <p className="eyebrow">LEARN</p>
          <h2>{lang === 'ES' ? 'Educación financiera' : 'Financial education'}</h2>
          <div className="articles">
            {['¿Qué es Bitcoin?', '¿Qué es la inflación?', '¿Qué es el S&P 500?', '¿Qué son las acciones?'].map((title, index) => (
              <article key={title}>
                <span>{['CRIPTOMONEDAS', 'ECONOMÍA', 'BOLSA', 'FINANZAS'][index]}</span>
                <h3>{lang === 'EN' ? ['What is Bitcoin?', 'What is inflation?', 'What is the S&P 500?', 'What are stocks?'][index] : title}</h3>
                <p>{lang === 'ES' ? 'Guía educativa y neutral para comprender conceptos financieros.' : 'A neutral educational guide to understanding financial concepts.'}</p>
                <a href="#education">{lang === 'ES' ? 'Leer artículo →' : 'Read article →'}</a>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <b>EUDEXA</b>
        <p>Markets · Converter · Education · Privacy · Terms · Cookies · Disclaimer · Contact</p>
        <small>EUDEXA proporciona información y herramientas financieras con fines informativos y educativos. No constituye asesoramiento financiero, de inversión, fiscal o legal.</small>
        <small>© 2026 EUDEXA</small>
      </footer>

      <button className="calcb" onClick={() => setCalculatorOpen((value) => !value)}>🧮</button>

      {calculatorOpen && (
        <div className="calculator">
          <div className="calcTop">Calculator <button onClick={() => setCalculatorOpen(false)}>×</button></div>
          <input value={expression} readOnly placeholder="0" />
          {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '+', '='].map((key) => (
            <button key={key} onClick={() => pressCalculator(key)}>{key}</button>
          ))}
          <button className="clear" onClick={() => setExpression('')}>Clear</button>
        </div>
      )}
    </div>
  );
}

function Market({ title, data }) {
  return (
    <section className="market">
      <div className="sectionhead"><h2>{title}</h2><a href="#markets">View all →</a></div>
      <div className="grid">
        {data.map((asset) => (
          <div className="card" key={asset[1]}>
            <div><span>{asset[2]}</span><h3>{asset[0]}</h3><small>{asset[1]}</small></div>
            <div className="price">{asset[3]}<i className={asset[4].startsWith('-') ? 'neg' : ''}>{asset[4]}</i></div>
            <div className="spark">╱╲╱╲╱╲</div>
          </div>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
