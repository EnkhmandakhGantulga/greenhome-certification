// Script to push the repo to GitHub
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

let connectionSettings: any;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function main() {
  const repoName = process.argv[2] || 'greenhome-certification';
  const description = 'GreenHome (НогоонГэр) - Green Building Certification Platform';
  
  console.log('Getting GitHub access token...');
  const accessToken = await getAccessToken();
  
  console.log('Creating Octokit client...');
  const octokit = new Octokit({ auth: accessToken });
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  // Check if repo exists
  let repoExists = false;
  try {
    await octokit.repos.get({ owner: user.login, repo: repoName });
    repoExists = true;
    console.log(`Repository ${repoName} already exists`);
  } catch (e: any) {
    if (e.status !== 404) throw e;
  }
  
  // Create repo if it doesn't exist
  if (!repoExists) {
    console.log(`Creating repository: ${repoName}...`);
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description,
      private: false,
      auto_init: false
    });
    console.log(`Created repository: ${repoName}`);
  }
  
  const repoUrl = `https://github.com/${user.login}/${repoName}`;
  const authUrl = `https://${accessToken}@github.com/${user.login}/${repoName}.git`;
  
  console.log(`\nRepository URL: ${repoUrl}`);
  
  // Set up git remote
  console.log('\nConfiguring git remote...');
  try {
    execSync('git remote remove github 2>/dev/null || true', { stdio: 'inherit' });
  } catch {}
  
  execSync(`git remote add github "${authUrl}"`, { stdio: 'inherit' });
  
  // Push to GitHub
  console.log('\nPushing to GitHub...');
  execSync('git push -u github main --force', { stdio: 'inherit' });
  
  console.log(`\n✅ Successfully pushed to GitHub!`);
  console.log(`📂 Repository: ${repoUrl}`);
}

main().catch(console.error);
