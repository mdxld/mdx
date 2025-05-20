import simpleGit from 'simple-git'
import { relative } from 'path'

const git = simpleGit()

export async function getUpstreamUrl() {
  const remotes = await git.getRemotes(true)
  const upstream = remotes.find(r => r.name === 'upstream' || r.name === 'origin')
  return upstream?.refs.fetch
}

export async function getGitHubUrlForFile(filePath: string) {
  const repoRoot = await git.revparse(['--show-toplevel'])
  const relativePath = relative(repoRoot.trim(), filePath)

  const remotes = await git.getRemotes(true)
  const remote = remotes.find(r => r.name === 'origin' || r.name === 'upstream')
  const remoteUrl = remote?.refs.fetch

  if (!remoteUrl) return null

  // Convert SSH or HTTPS to raw GitHub URL base
  const githubBase = remoteUrl
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^https:\/\/github\.com\//, 'https://github.com/')
    .replace(/\.git$/, '')

  const branch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim()

  return `${githubBase}/blob/${branch}/${relativePath}`
}

// getUpstreamUrl().then(console.log)