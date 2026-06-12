import { browser } from 'wxt/browser';

export interface Skill {
  id: string;
  name: string;
  command: string;
  type: 'prompt' | 'skill' | 'registry';
  domain: string;
  tags: string[];
  source: string;
}

export interface DomainMeta {
  key: string;
  name: string;
  filename: string;
  count: number;
}

export interface PromptContent {
  system: string | null;
  user: string | null;
  readme: string | null;
  markdown: string | null;
}

export interface PromptDetail {
  id: string;
  name: string;
  type: 'prompt' | 'skill' | 'registry';
  source: string;
  domain: string;
  tags: string[];
  content: PromptContent;
}

const CDN_BASE_URL = 'https://basitsameerpro.github.io/Superclipboard_jsons';
const FALLBACK_BASE_URL = 'https://raw.githubusercontent.com/BasitSameerpro/Superclipboard_jsons/main';

const SKILLS_CACHE_KEY = 'cached_skills_list';
const DOMAINS_CACHE_KEY = 'cached_domains_list';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to fetch JSON with CDN Pages -> Raw Github fallback
async function fetchJsonWithFallback(filename: string): Promise<any> {
  const cdnUrl = `${CDN_BASE_URL}/${filename}`;
  const fallbackUrl = `${FALLBACK_BASE_URL}/${filename}`;
  
  try {
    console.log(`[Agentic Clipboard] Fetching: ${cdnUrl}`);
    const res = await fetch(cdnUrl);
    if (res.ok) return await res.json();
    console.warn(`[Agentic Clipboard] CDN returned status ${res.status}. Trying fallback...`);
  } catch (err) {
    console.warn('[Agentic Clipboard] CDN fetch failed. Trying fallback...', err);
  }
  
  console.log(`[Agentic Clipboard] Fetching Fallback: ${fallbackUrl}`);
  const resFallback = await fetch(fallbackUrl);
  if (!resFallback.ok) {
    throw new Error(`Failed to fetch ${filename} from both CDN and Fallback: ${resFallback.statusText}`);
  }
  return await resFallback.json();
}

export async function fetchAndCacheSkills(): Promise<Skill[]> {
  const cacheKeyObj = await browser.storage.local.get([SKILLS_CACHE_KEY, 'skills_last_fetched']);
  const cachedSkills = cacheKeyObj[SKILLS_CACHE_KEY];
  const lastFetched = cacheKeyObj['skills_last_fetched'];

  // Clear badge text to ensure the icon remains clean and un-crowded
  try {
    await browser.action.setBadgeText({ text: '' });
  } catch (e) {
    console.warn('[Agentic Clipboard] Failed to clear badge:', e);
  }

  // If cache exists and is less than 24 hours old, return it
  if (cachedSkills && lastFetched && (Date.now() - lastFetched < CACHE_TTL_MS)) {
    console.log('[Agentic Clipboard] Using cached skills (within TTL)');
    return cachedSkills;
  }

  console.log('[Agentic Clipboard] Fetching master index.json...');
  try {
    const data = await fetchJsonWithFallback('index.json');
    
    // Map prompts metadata to Skill format
    const skills: Skill[] = data.prompts.map((p: any) => ({
      id: p.id,
      name: p.name,
      command: `/${p.id}`,
      type: p.type,
      domain: p.domain,
      tags: p.tags || [],
      source: p.source
    }));
    
    const domains: DomainMeta[] = data.domains;
    
    // Cache skills, domains and timestamp
    await browser.storage.local.set({ 
      [SKILLS_CACHE_KEY]: skills,
      [DOMAINS_CACHE_KEY]: domains,
      skills_last_fetched: Date.now()
    });
    
    return skills;
  } catch (err) {
    console.error('[Agentic Clipboard] Failed to fetch master index:', err);
    // Return cache as fallback even if expired
    if (cachedSkills) {
      console.warn('[Agentic Clipboard] Returning expired cache due to fetch failure');
      return cachedSkills;
    }
    throw err;
  }
}

export async function getCachedSkills(): Promise<Skill[]> {
  const result = await browser.storage.local.get([SKILLS_CACHE_KEY]);
  return result[SKILLS_CACHE_KEY] || [];
}

export async function getCachedDomains(): Promise<DomainMeta[]> {
  const result = await browser.storage.local.get([DOMAINS_CACHE_KEY]);
  return result[DOMAINS_CACHE_KEY] || [];
}

export async function fetchSkillContent(skill: Skill): Promise<string> {
  const promptStorageKey = `cached_prompt_${skill.id}`;
  const cacheObj = await browser.storage.local.get([promptStorageKey]);
  if (cacheObj[promptStorageKey]) {
    console.log(`[Agentic Clipboard] Cache hit for prompt: ${skill.id}`);
    return cacheObj[promptStorageKey];
  }
  
  // Need to load the domain JSON
  const domainStorageKey = `cached_domain_${skill.domain}`;
  const domainObj = await browser.storage.local.get([domainStorageKey]);
  let domainData = domainObj[domainStorageKey];
  
  if (!domainData) {
    console.log(`[Agentic Clipboard] Cache miss for domain: ${skill.domain}. Fetching...`);
    const filename = `${skill.domain.replace(/-/g, '_')}.json`;
    domainData = await fetchJsonWithFallback(filename);
    
    // Save to local storage cache
    await browser.storage.local.set({ [domainStorageKey]: domainData });
  }
  
  // Find prompt inside domain data
  const promptItem = domainData.prompts.find((p: any) => p.id === skill.id);
  if (!promptItem) {
    throw new Error(`Prompt ID ${skill.id} not found in domain ${skill.domain}`);
  }
  
  // Assemble content payload
  const content: PromptContent = promptItem.content;
  let payload = content.markdown || content.system || '';
  if (content.user) {
    payload += `\n\n# USER PROMPT\n\n${content.user}`;
  }
  
  // Cache the compiled payload for individual prompt
  await browser.storage.local.set({ [promptStorageKey]: payload });
  return payload;
}