/**
 * AccountDashboard — unit tests
 *
 * We mock @salesforce/sdk-data so tests run without a real Salesforce org.
 * The mock data mirrors the exact GraphQL response shape so the component's
 * unwrapping code is exercised, not bypassed.
 *
 * Testing library cheat-sheet:
 *   render(<Comp />)          — mount the component in a fake DOM (jsdom)
 *   screen.findByText(...)    — async query; waits for the element to appear
 *   screen.getByText(...)     — sync query; throws immediately if not found
 *   screen.queryByText(...)   — sync query; returns null if not found (no throw)
 *   expect(...).toBeInTheDocument()  — element exists in the DOM
 *   expect(...).not.toBeInTheDocument() — element does NOT exist
 */
import { render, screen } from '@testing-library/react';
import { type Mock } from 'vitest';
import { createDataSDK } from '@salesforce/sdk-data';
import AccountDashboard from './AccountDashboard';

// ─── Mock the Salesforce SDK ─────────────────────────────────────────────────
//
// vi.mock replaces the real module with a fake for this test file only.
// createDataSDK becomes a vi.fn() we can configure per test.
// gql is just a tagged template — we stub it to return the raw string.

vi.mock('@salesforce/sdk-data', () => ({
  createDataSDK: vi.fn(),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

// ─── Mock data ───────────────────────────────────────────────────────────────
//
// This mirrors the exact shape the real UIAPI GraphQL API returns.
// Keeping it realistic means the component's mapping code is fully tested.

const SUCCESS_RESPONSE = {
  data: {
    uiapi: {
      query: {
        Account: {
          edges: [
            {
              node: {
                Id: '001xx000001',
                Name: { value: 'Acme Corp' },
                Industry: { value: 'Technology' },
                AnnualRevenue: { value: 1200000 },
                Phone: { value: '415-555-1234' },
              },
            },
            {
              node: {
                Id: '001xx000002',
                Name: { value: 'Globex Inc' },
                Industry: { value: null },       // tests the null-industry path
                AnnualRevenue: { value: null },   // tests the null-revenue path
                Phone: { value: null },           // tests the no-phone path
              },
            },
          ],
        },
      },
    },
  },
  errors: [],
};

const ERROR_RESPONSE = {
  data: null,
  errors: [{ message: 'Insufficient access rights on cross-reference id' }],
};

const EMPTY_RESPONSE = {
  data: {
    uiapi: { query: { Account: { edges: [] } } },
  },
  errors: [],
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('AccountDashboard', () => {
  const mockGraphql = vi.fn();

  // Before each test: make createDataSDK resolve with an object
  // whose .graphql property is our controllable mockGraphql function.
  beforeEach(() => {
    (createDataSDK as Mock).mockResolvedValue({ graphql: mockGraphql });
  });

  // After each test: reset all mock call history so tests don't bleed into each other.
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Test 1: loading state ──────────────────────────────────────────────────
  it('shows a loading message while data is being fetched', () => {
    // mockGraphql never resolves — simulates a slow network
    mockGraphql.mockReturnValue(new Promise(() => {}));

    render(<AccountDashboard />);

    // This is synchronous — the loading text should appear immediately
    expect(screen.getByText('Loading accounts…')).toBeInTheDocument();
  });

  // ── Test 2: success — account names appear ─────────────────────────────────
  it('renders account names after data loads', async () => {
    mockGraphql.mockResolvedValue(SUCCESS_RESPONSE);

    render(<AccountDashboard />);

    // findByText is async — it waits (up to 1 s) for the element to appear
    // after the useEffect fetch resolves and state updates trigger a re-render
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex Inc')).toBeInTheDocument();
  });

  // ── Test 3: fields are rendered correctly ─────────────────────────────────
  it('renders industry and phone for Acme Corp', async () => {
    mockGraphql.mockResolvedValue(SUCCESS_RESPONSE);

    render(<AccountDashboard />);
    await screen.findByText('Acme Corp'); // wait for load

    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('415-555-1234')).toBeInTheDocument();
  });

  // ── Test 4: null fields show a dash placeholder ────────────────────────────
  it('shows — when industry or revenue is null', async () => {
    mockGraphql.mockResolvedValue(SUCCESS_RESPONSE);

    render(<AccountDashboard />);
    await screen.findByText('Globex Inc');

    // Globex has null industry & revenue — both should render as '—'
    // getAllByText because multiple cards may show '—'
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 5: phone is omitted when null ────────────────────────────────────
  it('does not render a phone link when phone is null', async () => {
    mockGraphql.mockResolvedValue(SUCCESS_RESPONSE);

    render(<AccountDashboard />);
    await screen.findByText('Globex Inc');

    // Only Acme Corp has a phone — exactly one tel link should exist
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  // ── Test 6: GraphQL error state ───────────────────────────────────────────
  it('shows an error message when the GraphQL response contains errors', async () => {
    mockGraphql.mockResolvedValue(ERROR_RESPONSE);

    render(<AccountDashboard />);

    expect(
      await screen.findByText('Insufficient access rights on cross-reference id')
    ).toBeInTheDocument();
  });

  // ── Test 7: empty state ───────────────────────────────────────────────────
  it('shows "No accounts found" when the query returns no records', async () => {
    mockGraphql.mockResolvedValue(EMPTY_RESPONSE);

    render(<AccountDashboard />);

    expect(await screen.findByText('No accounts found.')).toBeInTheDocument();
  });
});
