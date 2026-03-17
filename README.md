# Crypto Tracker

A minimal React app for tracking live cryptocurrency exchange rates using the [CryptoCompare API](https://www.cryptocompare.com/).

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

The app runs at `http://localhost:3000`.

---

## Project Structure

```
src/
├── App.js          # Main component + custom hooks
├── styles.css      # All styles
└── index.js        # React root entry point
```

---

## How to Use

### Step 1 — Get a free API key

1. Go to [https://www.cryptocompare.com/](https://www.cryptocompare.com/)
2. Sign up for a free account
3. Navigate to **API** → **API Keys** and generate a key

### Step 2 — Enter your API key

When you open the app, you'll see an **API Key** input at the top. Paste your key and click **Save** (or press Enter).

> The app will not make any network requests until a key is saved. Once saved, the key is masked and the app loads prices automatically.

### Step 3 — Track coins

- **DOGE** is pre-loaded in your list by default
- Type any coin symbol into the **Add coin** field (e.g. `BTC`, `ETH`, `SOL`) and click **Search**
- If the coin exists, it gets added to your list with its current USD price

### Step 4 — Monitor prices

| Feature | Description |
|---|---|
| **Auto-refresh** | All prices update automatically every **10 seconds** |
| **Countdown bar** | A thin progress bar shows time until the next refresh |
| **▲ / ▼ arrows** | Green `+x.xx%` or red `-x.xx%` shows change since last update |
| **Update** | Force-refresh a single coin immediately |
| **Update all** | Force-refresh all coins and restart the 10-second countdown |
| **Delete** | Remove a coin from your list |

### Online / Offline indicator

A dot in the top-right corner shows your network status in real time — green when online, red when offline.

## API Reference

Prices are fetched from the CryptoCompare min-API:

```
GET https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD&api_key=YOUR_KEY
```

Response:
```json
{ "USD": 75255.22 }
```