/**
 * Local dev mock for @salesforce/sdk-data.
 *
 * The real SDK tries to reach a Salesforce backend on startup.
 * In local dev there is no backend, so we return hardcoded fake accounts
 * that mirror the exact shape the real UIAPI GraphQL API returns.
 *
 * Vite swaps this file in place of the real SDK only when you run `npm run dev`.
 * The production build and tests are unaffected.
 */

const FAKE_RESPONSE = {
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
                Phone: { value: '415-555-0101' },
              },
            },
            {
              node: {
                Id: '001xx000002',
                Name: { value: 'Globex Inc' },
                Industry: { value: 'Manufacturing' },
                AnnualRevenue: { value: 800000 },
                Phone: { value: '212-555-0102' },
              },
            },
            {
              node: {
                Id: '001xx000003',
                Name: { value: 'Initech' },
                Industry: { value: 'Finance' },
                AnnualRevenue: { value: 2100000 },
                Phone: { value: null },
              },
            },
            {
              node: {
                Id: '001xx000004',
                Name: { value: 'Umbrella Corp' },
                Industry: { value: 'Biotechnology' },
                AnnualRevenue: { value: 5000000 },
                Phone: { value: '503-555-0104' },
              },
            },
            {
              node: {
                Id: '001xx000005',
                Name: { value: 'Hooli' },
                Industry: { value: 'Technology' },
                AnnualRevenue: { value: null },
                Phone: { value: '650-555-0105' },
              },
            },
            {
              node: {
                Id: '001xx000006',
                Name: { value: 'Pied Piper' },
                Industry: { value: null },
                AnnualRevenue: { value: 300000 },
                Phone: { value: null },
              },
            },
          ],
        },
      },
    },
  },
  errors: [],
};

export function gql(strings: TemplateStringsArray) {
  return strings.join('');
}

export async function createDataSDK() {
  return {
    graphql: async (_opts: unknown) => FAKE_RESPONSE,
  };
}
