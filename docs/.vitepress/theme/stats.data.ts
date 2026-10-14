// Build-time adoption figures. Real numbers from the npm and GitHub APIs at
// build; if either call fails the last known values below are used instead.
export interface Stats {
  downloads: number
  stars: number
  version: string
  releases: number
  since: string // ISO date of the first npm publish
}

const FALLBACK: Stats = {
  downloads: 8300,
  stars: 15,
  version: '0.7.10',
  releases: 33,
  since: '2026-02-21',
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': 'mcp-dataverse-docs' } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

export default {
  async load(): Promise<Stats> {
    const today = new Date().toISOString().slice(0, 10)
    const [dl, repo, pkg] = await Promise.allSettled([
      getJson(`https://api.npmjs.org/downloads/point/2025-01-01:${today}/mcp-dataverse`),
      getJson('https://api.github.com/repos/codeurali/mcp-dataverse'),
      getJson('https://registry.npmjs.org/mcp-dataverse'),
    ])
    return {
      downloads: dl.status === 'fulfilled' ? dl.value.downloads : FALLBACK.downloads,
      stars: repo.status === 'fulfilled' ? repo.value.stargazers_count : FALLBACK.stars,
      version: pkg.status === 'fulfilled' ? pkg.value['dist-tags'].latest : FALLBACK.version,
      releases: pkg.status === 'fulfilled' ? Object.keys(pkg.value.versions).length : FALLBACK.releases,
      since: pkg.status === 'fulfilled' ? pkg.value.time.created.slice(0, 10) : FALLBACK.since,
    }
  },
}
