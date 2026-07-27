// Pulls the account's Pinned Repositories, in the exact order they are
// pinned on github.com, and writes them to projects.json at the repo
// root. Run by .github/workflows/update-projects.yml.
//
// Why GraphQL + a workflow instead of calling this from the browser?
// Reading pin order requires an authenticated GraphQL call. That token
// must never be shipped to client-side JS, so the fetch happens here,
// server-side in CI, and the site only ever reads the plain JSON output.

import { writeFile } from 'node:fs/promises';

const USER = 'lo-oxll';

const query = `
  query {
    user(login: "${USER}") {
      pinnedItems(first: 12, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            homepageUrl
            hasPagesEnabled
            isFork
            isArchived
            primaryLanguage { name }
          }
        }
      }
    }
  }
`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Authorization: `bearer ${process.env.GH_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': `${USER}-site-build`
  },
  body: JSON.stringify({ query })
});

if (!res.ok) {
  console.error('GitHub GraphQL request failed:', res.status, await res.text());
  process.exit(1);
}

const json = await res.json();

if (json.errors) {
  console.error(json.errors);
  process.exit(1);
}

const repos = json.data.user.pinnedItems.nodes
  .filter((r) => !r.isFork && !r.isArchived)
  .map((r) => ({
    name: r.name,
    description: r.description,
    language: r.primaryLanguage ? r.primaryLanguage.name : null,
    homepage: r.homepageUrl || null,
    html_url: r.url,
    has_pages: r.hasPagesEnabled
  }));

await writeFile('projects.json', JSON.stringify(repos, null, 2) + '\n');
console.log(`Wrote projects.json with ${repos.length} pinned repos.`);
