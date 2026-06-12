import { useState, useEffect } from 'react';
import { 
  getCachedSkills, 
  fetchAndCacheSkills, 
  getCachedDomains,
  fetchSkillContent, 
  Skill, 
  DomainMeta 
} from '../utils/githubFetcher';

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [domains, setDomains] = useState<DomainMeta[]>([]);
  const [status, setStatus] = useState<string>('');

  const loadSkills = async () => {
    try {
      let cachedSkills = await getCachedSkills();
      let cachedDomains = await getCachedDomains();
      
      if (cachedSkills.length === 0) {
        setStatus('Loading skills index...');
        cachedSkills = await fetchAndCacheSkills();
        cachedDomains = await getCachedDomains();
      }
      setSkills(cachedSkills);
      setDomains(cachedDomains);
      if (status.startsWith('Loading')) setStatus('');
    } catch (err: any) { 
      setStatus('Failed to load index'); 
      console.error(err);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleSkillAction = async (skillInput: string, skillOverride?: Skill) => {
    const matchedSkill = skillOverride || skills.find(s => s.command.toLowerCase() === skillInput.toLowerCase());
    if (!matchedSkill) { 
      setStatus(`Unknown command: ${skillInput}`); 
      return; 
    }

    setStatus('Copying...');
    try {
      const content = await fetchSkillContent(matchedSkill);
      await navigator.clipboard.writeText(content);
      setStatus(`✓ ${matchedSkill.name} copied!`);
      setTimeout(() => window.close(), 50);
    } catch (err: any) { 
      setStatus(`Error: ${err.message}`); 
    }
  };

  return {
    skills,
    domains,
    status,
    setStatus,
    loadSkills,
    handleSkillAction
  };
}
