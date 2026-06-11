import { browser } from 'wxt/browser';

export interface Skill {
  command: string;
  path: string;
  name: string;
}

const GITHUB_OWNER = 'BasitSameerpro';
const GITHUB_REPO = 'superclipboard_agent_skills';
const GITHUB_BRANCH = 'main';
const SKILLS_CACHE_KEY = 'cached_skills_list';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchAndCacheSkills(): Promise<Skill[]> {
  const cacheKeyObj = await browser.storage.local.get([SKILLS_CACHE_KEY, 'skills_last_fetched']);
  const cachedSkills = cacheKeyObj[SKILLS_CACHE_KEY];
  const lastFetched = cacheKeyObj['skills_last_fetched'];

  // If cache exists and is less than 24 hours old, return it
  if (cachedSkills && lastFetched && (Date.now() - lastFetched < CACHE_TTL_MS)) {
    console.log('[Agentic Clipboard] Using cached skills (within TTL)');
    return cachedSkills;
  }

  console.log('[Agentic Clipboard] Cache expired or missing. Fetching from GitHub...');
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`
  );
  
  if (!response.ok) throw new Error(`Failed to fetch repo tree: ${response.statusText}`);
  
  const data = await response.json();
  
  const skills: Skill[] = data.tree
    .filter((item: any) => {
      return (
        item.type === 'blob' &&
        item.path.startsWith('General_Skills/') &&
        item.path.endsWith('/system.md')
      );
    })
    .map((item: any) => {
      const parts = item.path.split('/');
      const folderName = parts[parts.length - 2];
      const commandName = '/' + folderName.replace(/_/g, '-');
      
      return {
        command: commandName,
        path: item.path,
        name: folderName.replace(/_/g, '-')
      };
    })
    .sort((a: Skill, b: Skill) => a.name.localeCompare(b.name));
  
  await browser.storage.local.set({ 
    [SKILLS_CACHE_KEY]: skills,
    skills_last_fetched: Date.now()
  });
  return skills;
}

export async function getCachedSkills(): Promise<Skill[]> {
  const result = await browser.storage.local.get([SKILLS_CACHE_KEY]);
  return result[SKILLS_CACHE_KEY] || [];
}

export async function fetchSkillContent(skill: Skill): Promise<string> {
  const storageKey = `cached_prompt_${skill.path}`;
  const result = await browser.storage.local.get([storageKey]);
  
  if (result[storageKey]) return result[storageKey];
  
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${skill.path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch skill: ${response.statusText}`);
  
  const content = await response.text();
  await browser.storage.local.set({ [storageKey]: content });
  return content;
}