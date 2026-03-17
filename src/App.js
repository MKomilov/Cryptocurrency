import { useState, useEffect, useRef, useCallback } from 'react';

function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handle = () => setOnline(navigator.onLine);
    window.addEventListener('online', handle);
    window.addEventListener('offline', handle);
    return () => {
      window.removeEventListener('online', handle);
      window.removeEventListener('offline', handle);
    };
  }, []);
  return online;
}

function useAutoRefresh(seconds, callback, enabled = true) {
  const [rem, setRem] = useState(seconds);
  const remRef  = useRef(seconds);
  const cbRef   = useRef(callback);
  const resetFn = useRef(null);

  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) {
      remRef.current = seconds;
      setRem(seconds);
      return;
    }

    const tick = setInterval(() => {
      remRef.current -= 1;
      setRem(remRef.current);
      if (remRef.current <= 0) {
        cbRef.current();
        remRef.current = seconds;
        setRem(seconds);
      }
    }, 1000);

    resetFn.current = () => {
      remRef.current = seconds;
      setRem(seconds);
    };

    return () => clearInterval(tick);
  }, [seconds, enabled]);

  return { rem, reset: () => resetFn.current?.() };
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [coins, setCoins] = useState([{ sym: 'DOGE', price: null, prev: null, loading: false }]);
  const [query, setQuery] = useState('');
  const [err, setErr] = useState('');

  const online = useNetworkStatus();

  const coinsRef = useRef(coins);
  useEffect(() => { coinsRef.current = coins; }, [coins]);

  const fetchPrice = useCallback(async (sym, signal) => {
    const url = `https://min-api.cryptocompare.com/data/price?fsym=${sym}&tsyms=USD&api_key=${apiKey}`;
    const res  = await fetch(url, { signal });
    const data = await res.json();
    if (data.Response === 'Error' || !data.USD) throw new Error('Not found');
    return data.USD;
  }, [apiKey]);

  const updateOne = useCallback(async (sym) => {
    const controller = new AbortController();
    setCoins(cs => cs.map(c => c.sym === sym ? { ...c, loading: true } : c));
    try {
      const price = await fetchPrice(sym, controller.signal);
      setCoins(cs => cs.map(c =>
        c.sym === sym ? { ...c, prev: c.price, price, loading: false } : c
      ));
    } catch (e) {
      if (e.name !== 'AbortError') {
        setCoins(cs => cs.map(c => c.sym === sym ? { ...c, loading: false } : c));
      }
    }
    return controller;
  }, [fetchPrice]);

  const updateAll = useCallback(() => {
    if (!apiKey) return;
    coinsRef.current.forEach(c => updateOne(c.sym));
  }, [updateOne, apiKey]);

  const { rem, reset } = useAutoRefresh(10, updateAll, !!apiKey);

  useEffect(() => {
    if (!apiKey) return;
    const controller = new AbortController();
    setCoins(cs => cs.map(c => c.sym === 'DOGE' ? { ...c, loading: true } : c));
    fetchPrice('DOGE', controller.signal)
      .then(price => {
        setCoins(cs => cs.map(c =>
          c.sym === 'DOGE' ? { ...c, prev: c.price, price, loading: false } : c
        ));
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          setCoins(cs => cs.map(c => c.sym === 'DOGE' ? { ...c, loading: false } : c));
        }
      });
    return () => controller.abort();
  }, [apiKey, fetchPrice]);

  const handleSearch = async () => {
    setErr('');
    const sym = query.trim().toUpperCase();
    if (!sym) return;
    if (!apiKey) { setErr('Save your API key first.'); return; }
    if (coins.find(c => c.sym === sym)) { setErr(`${sym} is already in the list.`); return; }
    try {
      const price = await fetchPrice(sym);
      setCoins(cs => [...cs, { sym, price, prev: null, loading: false }]);
      setQuery('');
    } catch {
      setErr(`"${sym}" not found — check the symbol and try again.`);
    }
  };

  const handleUpdateAll = () => { reset(); updateAll(); };
  const del = (sym) => setCoins(cs => cs.filter(c => c.sym !== sym));

  const fmt = (p) => {
    if (p == null) return '—';
    if (p < 0.01)  return '$' + p.toFixed(6);
    if (p < 1)     return '$' + p.toFixed(4);
    return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const dir = (c) => {
    if (c.prev == null || c.price == null) return 'na';
    if (c.price > c.prev) return 'up';
    if (c.price < c.prev) return 'dn';
    return 'na';
  };

  const pct = (c) => {
    if (!c.prev || !c.price) return null;
    return (((c.price - c.prev) / c.prev) * 100).toFixed(2);
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 6) + '••••••••' + apiKey.slice(-4)
    : null;

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    setApiKey(k);
    setKeyInput('');
  };

  return (
    <div className="page">
      <div className="card">

        <div className="top">
          <div className="wordmark">Crypto Tracker</div>
          <div className="status">
            <div className={`dot ${online ? 'on' : 'off'}`} />
            {online ? 'online' : 'offline'}
          </div>
        </div>

        <div className="key-section">
          <div className="lbl">API Key</div>
          {maskedKey ? (
            <div className="key-set">
              <code>{maskedKey}</code>
            </div>
          ) : (
            <div className="key-row">
              <input
                type="password"
                placeholder="Paste your CryptoCompare API key…"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveKey()}
              />
              <button onClick={saveKey}>Save</button>
            </div>
          )}
        </div>

        <div className="search-area">
          <div className="lbl">Add coin</div>
          <div className="search-row">
            <input
              type="text"
              className="minput"
              value={query}
              placeholder="Symbol — BTC, ETH, SOL…"
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          {err && <div className="err">{err}</div>}
        </div>

        <div className="toolbar">
          <div className="t-left">
            <span className="t-count">{coins.length} tracked · {rem}s</span>
            <div className="prog-wrap">
              <div className="prog-bar" style={{ width: `${(rem / 10) * 100}%` }} />
            </div>
          </div>
          <button className="btn-s" onClick={handleUpdateAll}>Update all</button>
        </div>

        <div className="sep" />

        {coins.length === 0 && <div className="empty">No coins tracked yet.</div>}
        {coins.map(c => {
          const d = dir(c);
          const p = pct(c);
          return (
            <div className="coin-row" key={c.sym}>
              <span className="c-sym">{c.sym}</span>
              <span className="c-price">
                {fmt(c.price)}
                {c.loading && <span className="spin" />}
              </span>
              <span className={`c-delta ${d}`}>
                {d === 'up' && `+${p}%`}
                {d === 'dn' && `${p}%`}
                {d === 'na' && '—'}
              </span>
              <div className="c-acts">
                <button className="btn-s" onClick={() => updateOne(c.sym)}>Update</button>
                <button className="btn-s btn-d" onClick={() => del(c.sym)}>Delete</button>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}

export default App;