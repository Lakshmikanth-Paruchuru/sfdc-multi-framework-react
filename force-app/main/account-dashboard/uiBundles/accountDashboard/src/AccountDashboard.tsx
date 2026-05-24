/**
 * AccountDashboard
 *
 * Fetches Salesforce Accounts via UIAPI GraphQL and renders each one
 * as a card showing Name, Industry, Annual Revenue, and Phone.
 *
 * React concepts demonstrated:
 *   useState  — holds data, loading flag, and error message
 *   useEffect — fires the fetch once when the component mounts
 *   .map()    — turns the accounts array into JSX cards
 *   key prop  — stable identity for each list item (record Id)
 */
import { useEffect, useState } from 'react';
import { createDataSDK, gql } from '@salesforce/sdk-data';

// ─── 1. GraphQL query ────────────────────────────────────────────────────────
//
//  Every Salesforce UIAPI query is wrapped under  uiapi.query.<Object>.
//  Records come back as  edges[].node  (the Relay connection pattern).
//  Every field value is an object:  { value: "Acme" }  — must be unwrapped.
//  @optional  means "don't error if this field is null on a record".

const QUERY = gql`
  query AccountDashboard {
    uiapi {
      query {
        Account(first: 6, orderBy: { Name: { order: ASC } }) {
          edges {
            node {
              Id
              Name @optional {
                value
              }
              Industry @optional {
                value
              }
              AnnualRevenue @optional {
                value
              }
              Phone @optional {
                value
              }
            }
          }
        }
      }
    }
  }
`;

// ─── 2. TypeScript interfaces ────────────────────────────────────────────────
//
//  QueryResponse  mirrors the raw GraphQL response (nested, with { value }).
//  AccountFields  is the flat shape we store in state — easier to use in JSX.

interface QueryResponse {
  uiapi: {
    query: {
      Account: {
        edges: Array<{
          node: {
            Id: string;
            Name: { value: string | null };
            Industry: { value: string | null };
            AnnualRevenue: { value: number | null };
            Phone: { value: string | null };
          };
        }>;
      };
    };
  };
}

interface AccountFields {
  id: string;
  name: string;
  industry: string | null;
  annualRevenue: number | null;
  phone: string | null;
}

// ─── 3. Helper ───────────────────────────────────────────────────────────────

function formatRevenue(value: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

// ─── 4. Component ────────────────────────────────────────────────────────────

export default function AccountDashboard() {
  // useState declares reactive local variables.
  // Each call returns [currentValue, setterFunction].
  const [accounts, setAccounts] = useState<AccountFields[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // useEffect with [] fires once after the first render (on mount).
  // This is where you kick off any data fetching.
  useEffect(() => {
    const fetchAccounts = async () => {
      const sdk = await createDataSDK();
      const result = await sdk.graphql?.<QueryResponse>({ query: QUERY });

      // GraphQL errors don't throw — they live in result.errors
      if (result?.errors?.length) {
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join('; ')
        );
      }

      // Unwrap the Relay connection: edges → node → flat AccountFields
      const edges = result?.data?.uiapi?.query?.Account?.edges ?? [];
      setAccounts(
        edges
          .map(edge => edge?.node)
          .filter(Boolean)        // remove any null nodes
          .map(node => ({
            id:            node.Id,
            name:          node.Name?.value          ?? 'Unknown',
            industry:      node.Industry?.value       ?? null,
            annualRevenue: node.AnnualRevenue?.value  ?? null,
            phone:         node.Phone?.value          ?? null,
          }))
      );
    };

    fetchAccounts()
      .catch(err => setError(err instanceof Error ? err.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []); // empty array = run once on mount only

  // ── Render states ──────────────────────────────────────────────────────────
  // Return early for each non-data state so the main render below stays clean.

  if (loading) {
    return <p style={styles.muted}>Loading accounts…</p>;
  }

  if (error) {
    return <p style={styles.error}>{error}</p>;
  }

  if (!accounts?.length) {
    return <p style={styles.muted}>No accounts found.</p>;
  }

  // ── Main render ────────────────────────────────────────────────────────────
  // .map() turns the accounts array into an array of card <div> elements.
  // The key prop on each card must be unique and stable — record Id is ideal.

  return (
    <div>
      <h1 style={styles.heading}>Account Dashboard</h1>
      <p style={styles.subheading}>{accounts.length} accounts loaded</p>

      <div style={styles.grid}>
        {accounts.map(account => (
          <div key={account.id} style={styles.card}>

            {/* Card header — account name */}
            <p style={styles.cardName}>{account.name}</p>
            <hr style={styles.divider} />

            {/* Card body — field rows */}
            <div style={styles.field}>
              <span style={styles.label}>Industry</span>
              <span style={styles.value}>{account.industry ?? '—'}</span>
            </div>

            <div style={styles.field}>
              <span style={styles.label}>Annual Revenue</span>
              <span style={styles.value}>{formatRevenue(account.annualRevenue)}</span>
            </div>

            {/* Phone is optional — only render if present */}
            {account.phone && (
              <div style={styles.field}>
                <span style={styles.label}>Phone</span>
                <a href={`tel:${account.phone}`} style={styles.link}>
                  {account.phone}
                </a>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Inline styles ────────────────────────────────────────────────────────
//
//  Plain CSS-in-JS objects — no Tailwind, no external library.
//  Keeping styles here makes this file fully self-contained and easy to follow.

const styles: Record<string, React.CSSProperties> = {
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '4px',
    color: '#032d60',
  },
  subheading: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  },
  muted: {
    fontSize: '14px',
    color: '#888',
  },
  error: {
    fontSize: '14px',
    color: '#c23934',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#fff',
    border: '1px solid #d8dde6',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  cardName: {
    fontSize: '16px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#032d60',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e8e8e8',
    margin: '0 0 10px',
  },
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '6px',
  },
  label: {
    color: '#706e6b',
  },
  value: {
    fontWeight: 600,
    color: '#1a1a2e',
  },
  link: {
    color: '#0176d3',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
