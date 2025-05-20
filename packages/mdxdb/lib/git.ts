import simpleGit from 'simple-git'

const git = simpleGit()

async function getUpstreamUrl() {
  const remotes = await git.getRemotes(true)
  const upstream = remotes.find(r => r.name === 'upstream' || r.name === 'origin')
  return upstream?.refs.fetch
}

getUpstreamUrl().then(console.log)