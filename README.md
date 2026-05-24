# Account Dashboard — React UIBundle on Salesforce

A standalone React app that fetches and displays Salesforce Account records via the UIAPI GraphQL endpoint, deployed to a Salesforce org as a **UIBundle**. Part of the **Salesforce Multi-Framework / Headless360** series.

---

## What It Does

Renders a responsive grid of Account cards — Name, Industry, Annual Revenue, and Phone — fetched live from Salesforce using the platform's UIAPI GraphQL endpoint. Includes a local dev mode with fake data and a full unit test suite that runs without any org connection.

---

## Architecture

```mermaid
flowchart TD
    A[Developer Machine] -->|npm run dev| B[Vite Dev Server]
    B -->|Vite alias: mode=development| C[sdk-mock.ts\nFake accounts, no org needed]

    A -->|npm run build| D[Vite Production Build\ndist/index.html + dist/assets/*.js]
    D -->|sf project deploy start| E[Salesforce Org\nUIBundle Metadata]

    E --> F[App Launcher\nAccount Dashboard]
    F -->|Real Salesforce session| G[@salesforce/sdk-data SDK]
    G -->|UIAPI GraphQL| H[Salesforce Account Records]
    H --> F

    subgraph React Component [AccountDashboard.tsx]
        I[useEffect on mount] --> J[createDataSDK + graphql query]
        J --> K{Result?}
        K -->|loading| L[Loading accounts...]
        K -->|error / GraphQL errors| M[Error message]
        K -->|empty edges| N[No accounts found.]
        K -->|success| O[Account cards grid]
    end

    F --> React Component
```

---

## Project Structure

```
force-app/main/account-dashboard/uiBundles/accountDashboard/
│
├── accountDashboard.uibundle-meta.xml   ← Salesforce metadata — registers as a UIBundle
├── ui-bundle.json                       ← Points Salesforce to dist/ and configures routing
├── index.html                           ← HTML entry point with <div id="root">
├── package.json                         ← npm scripts: dev / build / test
├── vite.config.ts                       ← Build config + SDK mock alias + Vitest config
├── tsconfig.json                        ← TypeScript config for src/
├── vitest.setup.ts                      ← Loads jest-dom matchers before each test
│
└── src/
    ├── main.tsx                         ← Mounts <AccountDashboard /> into #root
    ├── AccountDashboard.tsx             ← The component (GraphQL query, state, TSX)
    ├── AccountDashboard.test.tsx        ← 7 unit tests — no org needed
    └── sdk-mock.ts                      ← Fake SDK used only during npm run dev
```

---

## Key Concepts

| React | LWC equivalent |
|---|---|
| `useState` | `@track` |
| `useEffect(fn, [])` | `connectedCallback()` |
| `list.map(item => <div key={item.id}>)` | `<template lwc:for={list} lwc:key="id">` |
| `{flag && <div>}` | `<template if:true={flag}>` |
| Props | `@api` |

The UIAPI GraphQL response uses the Relay connection pattern — records come back as `edges[].node` and every scalar field is wrapped as `{ value }`. The component unwraps these before storing data in state.

---

## Local Development

The `@salesforce/sdk-data` SDK requires a live Salesforce session. Running locally without one causes a JSON parse error. The fix is a **Vite alias** that swaps the real SDK for `src/sdk-mock.ts` in development mode only.

```bash
cd force-app/main/account-dashboard/uiBundles/accountDashboard
npm install
npm run dev      # http://localhost:5173 — shows 6 fake account cards
```

---

## Testing

7 unit tests using **Vitest** + **React Testing Library** — no org, no browser, under 1 second.

| Test | What it covers |
|---|---|
| 1 | Loading state appears synchronously before data arrives |
| 2 | Account names render after the mock resolves |
| 3 | All fields render correctly when populated |
| 4 | Null fields show `—` instead of crashing |
| 5 | Phone `<a>` link is omitted when phone is null |
| 6 | GraphQL `errors` array triggers the error state |
| 7 | Zero edges shows "No accounts found." |

```bash
npm test               # run once
npm test -- --watch    # watch mode
```

---

## Deploying to Salesforce

**Prerequisite:** Enable **Salesforce Multi-Framework** in your org.
> Setup → Apps → React Development with Agentforce Vibes and Salesforce Multi-Framework (Beta) → Turn On

```bash
# 1. Build the production bundle
cd force-app/main/account-dashboard/uiBundles/accountDashboard
npm run build

# 2. (Optional) Dry run
cd <repo-root>
sf project deploy start \
  --source-dir force-app/main/account-dashboard \
  --target-org <your-org-alias> \
  --dry-run

# 3. Deploy
sf project deploy start \
  --source-dir force-app/main/account-dashboard \
  --target-org <your-org-alias>
```

After deploy, open **App Launcher** and search **"Account Dashboard"** to launch the app. The real SDK picks up your Salesforce session automatically.

**On every subsequent change:**
```bash
npm test            # verify nothing broke
npm run build       # create a new production bundle (new content hash)
sf project deploy start --source-dir force-app/main/account-dashboard --target-org <alias>
```

> If you see a 404 for the JS file after deploying, it means `index.html` references a hash that no longer exists. Rebuild locally, redeploy, then hard-refresh the browser (Cmd+Shift+R / Ctrl+Shift+R).

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** + `@salesforce/vite-plugin-ui-bundle`
- **Vitest** + **React Testing Library**
- **Salesforce UIAPI GraphQL** via `@salesforce/sdk-data`
- **UIBundle** metadata type (requires Salesforce Multi-Framework enabled)
