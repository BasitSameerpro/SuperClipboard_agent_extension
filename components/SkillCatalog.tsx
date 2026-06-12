import React, { useState, useMemo } from 'react';
import { Skill, DomainMeta } from '../utils/githubFetcher';

interface SkillCatalogProps {
  skills: Skill[];
  domains: DomainMeta[];
  onClose: () => void;
  onSelectSkill: (skill: Skill) => void;
  onPreviewSkill: (skill: Skill) => void;
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
}

const FRONTEND_DOMAINS = [
  { key: 'frontend-design', name: 'Frontend Design', emoji: '🎨', color: '#ec4899' },
  { key: 'backend-design', name: 'Backend Design', emoji: '⚙️', color: '#3b82f6' },
  { key: 'coding-algorithms', name: 'Coding & Algorithms', emoji: '💻', color: '#10b981' },
  { key: 'artificial-intelligence', name: 'Artificial Intelligence', emoji: '🤖', color: '#8b5cf6' },
  { key: 'ml-analytics', name: 'Machine Learning & Analytics', emoji: '📊', color: '#f59e0b' },
  { key: 'research-academics', name: 'Research & Academics', emoji: '🔬', color: '#6366f1' },
  { key: 'document-writing', name: 'Document Writing & Editing', emoji: '✍️', color: '#a855f7' },
  { key: 'security-audits', name: 'System Audits & Security', emoji: '🛡️', color: '#ef4444' },
  { key: 'data-analysis', name: 'Data Analysis & Inspection', emoji: '🔎', color: '#06b6d4' },
  { key: 'business-agile', name: 'Business & Agile Management', emoji: '📈', color: '#14b8a6' },
  { key: 'education-career', name: 'Education, Study & Career', emoji: '🎓', color: '#f97316' },
  { key: 'creative-writing', name: 'Creative Writing & Art', emoji: '🎬', color: '#f43f5e' },
  { key: 'general-utilities', name: 'General Utilities & Tools', emoji: '🔧', color: '#64748b' }
];

export function getSkillCategoryKey(p: Skill): string {
  const name = p.name.toLowerCase();
  const pid = p.id.toLowerCase();
  const tags = p.tags.map(t => t.toLowerCase());
  const source = p.source.toLowerCase();

  // 1. Artificial Intelligence
  const aiKeywords = ['agent', 'llm', 'prompt-engineer', 'prompt engineering', 'generative-ai', 'openai', 'claude', 'gpt', 'few-shot', 'zero-shot', 'synthetic-data', 'ai-model', 'world-model', 'world model', 'autonomous-agent', 'prompt-expert'];
  if (aiKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('ai') || tags.includes('generative-ai') || tags.includes('ai-and-llms') || tags.includes('claude-skill')) {
    if (!['machine learning', 'regression', 'xgboost', 'random forest'].some(ml => name.includes(ml))) {
      return 'artificial-intelligence';
    }
  }

  // 2. Machine Learning & Analytics
  const mlKeywords = ['machine-learning', 'machine learning', 'data-science', 'data science', 'analytics', 'statistics', 'prediction', 'neural-network', 'deep-learning', 'data-analysis', 'dataset', 'ml-model', 'model-evaluation', 'regression', 'xgboost', 'pandas', 'numpy', 'matplotlib', 'data-engineering', 'data_engineering'];
  if (mlKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('ai-ml') || name.includes('analytics')) {
    return 'ml-analytics';
  }

  // 3. Frontend Design
  const frontendKeywords = ['frontend', 'css', 'html', 'tailwind', 'sass', 'flexbox', 'grid', 'ui', 'ux', 'user-interface', 'user experience', 'accessibility', 'a11y', 'web-design', 'svg', 'responsive', 'animation', 'figma', 'mockup', 'frontend-design'];
  if (frontendKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('frontend') || tags.includes('design') || tags.includes('ui-ux')) {
    return 'frontend-design';
  }

  // 4. Backend Design
  const backendKeywords = ['backend', 'server', 'database', 'sql', 'postgres', 'mysql', 'redis', 'graphql', 'rest-api', 'api-design', 'docker', 'kubernetes', 'k8s', 'microservices', 'aws', 'gcp', 'cloud', 'system-design', 'architecture', 'load-balancer', 'caching', 'devops'];
  if (backendKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('backend') || tags.includes('database') || tags.includes('devops')) {
    return 'backend-design';
  }

  // 5. Coding & Algorithms
  const codingKeywords = ['coder', 'refactor', 'review', 'algorithm', 'data-structure', 'rust', 'python', 'go', 'golang', 'java', 'c++', 'typescript', 'javascript', 'compiler', 'debugging', 'testing', 'unit-test', 'git', 'pull-request', 'regex', 'programming', 'code-review', 'debugging'];
  if (codingKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('coding') || tags.includes('programming') || tags.includes('languages')) {
    return 'coding-algorithms';
  }

  // 6. Research & Academics
  const researchKeywords = ['academic', 'peer-review', 'literature', 'paper', 'citation', 'bibliography', 'thesis', 'researcher', 'patent', 'science', 'scientific', 'journal', 'abstract', 'study-guide', 'education', 'learning-designer', 'research'];
  if (researchKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('research') || tags.includes('academic')) {
    return 'research-academics';
  }

  // 7. Document Writing & Editing
  const writingKeywords = ['writing', 'copywriting', 'translation', 'translator', 'editor', 'blog', 'article', 'resume', 'cover-letter', 'email', 'copy-edit', 'content-writer', 'marketing-copy', 'summarize', 'paraphrase', 'proofread', 'author', 'markdown', 'readme'];
  if (writingKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('writing') || tags.includes('summarization') || tags.includes('translation')) {
    return 'document-writing';
  }

  // 8. System Audits & Security
  const securityKeywords = ['malware', 'security', 'vulnerability', 'incident', 'threat', 'pentest', 'forensic', 'exploit', 'audit-trail', 'firewall', 'hardening', 'compliance', 'cybersecurity', 'auditor', 'ethics', 'legal', 'governance'];
  if (securityKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw))) {
    return 'security-audits';
  }

  // 9. Data Analysis & Inspection
  const analysisKeywords = ['analyze', 'analysis', 'inspect', 'inspector', 'evaluator', 'debugger', 'audit', 'check', 'validate', 'validator', 'triage'];
  if (analysisKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || pid.startsWith('analyze-') || pid.startsWith('inspect-')) {
    return 'data-analysis';
  }

  // 10. Business, Product & Agile Management
  const businessKeywords = ['business', 'agile', 'scrum', 'kanban', 'jira', 'story-point', 'agile-lead', 'product-manager', 'product-owner', 'monetize', 'marketing', 'startup', 'finance', 'roi', 'pricing', 'strategy', 'metrics', 'roadmap', 'growth-hack', 'sales', 'company', 'monetization'];
  if (businessKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('agile') || tags.includes('product')) {
    return 'business-agile';
  }

  // 11. Education, Study & Career
  const eduKeywords = ['learn', 'tutor', 'course', 'study', 'education', 'exam', 'quiz', 'curriculum', 'career', 'resume', 'job-interview', 'career-guide', 'admissions', 'teacher', 'professor', 'classroom', 'student', 'syllabus', 'adhd', 'learning'];
  if (eduKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('education') || tags.includes('learning')) {
    return 'education-career';
  }

  // 12. Creative Writing & Art
  const creativeKeywords = ['creative', 'story', 'game-design', 'game-developer', 'music', 'art', 'artist', 'poetry', 'scriptwriting', 'screenplay', 'novel', 'lyrics', 'designer-3d', 'blender', 'unreal-engine', 'unity', 'video'];
  if (creativeKeywords.some(kw => name.includes(kw) || pid.includes(kw) || source.includes(kw)) || tags.includes('creative') || tags.includes('art') || tags.includes('game')) {
    return 'creative-writing';
  }

  // 13. Default
  return 'general-utilities';
}

export default function SkillCatalog({
  skills,
  onClose,
  onSelectSkill,
  onPreviewSkill,
  selectedDomain,
  setSelectedDomain
}: SkillCatalogProps) {
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Compute prompt counts dynamically for each domain
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FRONTEND_DOMAINS.forEach(d => { counts[d.key] = 0; });
    skills.forEach(s => {
      const catKey = getSkillCategoryKey(s);
      if (counts[catKey] !== undefined) {
        counts[catKey]++;
      } else {
        counts['general-utilities'] = (counts['general-utilities'] || 0) + 1;
      }
    });
    return counts;
  }, [skills]);

  // Filter Catalog Cards
  const catalogFilteredSkills = skills.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          p.command.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(catalogSearch.toLowerCase()));
    const matchesDomain = selectedDomain === 'view-all' || getSkillCategoryKey(p) === selectedDomain;
    const matchesTag = selectedTag === 'all' || p.tags.includes(selectedTag);
    return matchesSearch && matchesDomain && matchesTag;
  });

  // Extract unique tag list from filtered domain skills to display as pills
  const uniqueTags = useMemo(() => {
    const domainSkills = skills.filter(p => selectedDomain === 'view-all' || getSkillCategoryKey(p) === selectedDomain);
    const tags = new Set<string>();
    domainSkills.forEach(p => {
      p.tags.forEach(t => {
        if (!['awesome-prompt', 'awesome2', 'general-skill', 'claude-skill', 'openclaw-registry'].includes(t.toLowerCase())) {
          tags.add(t);
        }
      });
    });
    return Array.from(tags).sort();
  }, [skills, selectedDomain]);

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: '#0a0a0a', 
      padding: '16px', 
      zIndex: 150, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px', 
      overflowY: 'hidden' 
    }}>
      
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '8px' }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '15px', 
          fontWeight: '700', 
          background: 'linear-gradient(90deg, #fff 0%, #888 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>Explore Catalog</h3>
        <button 
          onClick={() => {
            if (selectedDomain !== 'all') {
              setSelectedDomain('all');
            } else {
              onClose();
            }
          }} 
          style={{ 
            background: '#222', 
            color: '#fff', 
            border: '1px solid #333', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontWeight: '600', 
            fontSize: '11px' 
          }}
        >
          {selectedDomain !== 'all' ? '⬅ Back' : 'Close'}
        </button>
      </div>
      
      {/* LEVEL 1: Domain Cards Screen */}
      {selectedDomain === 'all' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select a Domain to Explore</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {FRONTEND_DOMAINS.map(d => {
              return (
                <div 
                  key={d.key}
                  onClick={() => { setSelectedDomain(d.key); setSelectedTag('all'); setCatalogSearch(''); }}
                  style={{
                    background: 'rgba(15, 15, 15, 0.6)',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = d.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = 'rgba(25, 25, 25, 0.8)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#222';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'rgba(15, 15, 15, 0.6)';
                  }}
                >
                  <div style={{ fontSize: '24px' }}>{d.emoji}</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '12px', lineHeight: '1.2' }}>{d.name}</div>
                    <div style={{ color: '#555', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>{domainCounts[d.key] || 0} templates</div>
                  </div>
                </div>
              );
            })}
            
            {/* Unified Browse All Card */}
            <div 
              onClick={() => { setSelectedDomain('view-all'); setSelectedTag('all'); setCatalogSearch(''); }}
              style={{
                background: 'rgba(15, 15, 15, 0.6)',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100px',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
                gridColumn: 'span 2'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#aaa';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(25, 25, 25, 0.8)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#222';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(15, 15, 15, 0.6)';
              }}
            >
              <div style={{ fontSize: '24px' }}>🌐</div>
              <div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '12px', lineHeight: '1.2' }}>Browse All Prompts</div>
                <div style={{ color: '#555', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>{skills.length} total prompts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 2: Drill-down Prompt Listing */}
      {selectedDomain !== 'all' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'hidden' }}>
          
          {/* Category Title */}
          <div style={{ fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Domain: {selectedDomain === 'view-all' ? 'All Prompts' : FRONTEND_DOMAINS.find(d => d.key === selectedDomain)?.name}</span>
            <span>{catalogFilteredSkills.length} matches</span>
          </div>

          {/* Subcategory Tag Pill Filters */}
          {uniqueTags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button 
                onClick={() => setSelectedTag('all')} 
                style={{ 
                  padding: '4px 10px', 
                  fontSize: '10px', 
                  background: selectedTag === 'all' ? '#333' : 'transparent', 
                  color: selectedTag === 'all' ? '#fff' : '#666', 
                  border: 'none', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontWeight: '600', 
                  whiteSpace: 'nowrap' 
                }}
              >
                #all
              </button>
              {uniqueTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSelectedTag(tag)} 
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '10px', 
                    background: selectedTag === tag ? '#4ade80' : 'transparent', 
                    color: selectedTag === tag ? '#000' : '#888', 
                    border: 'none', 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    fontWeight: '600', 
                    whiteSpace: 'nowrap' 
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Catalog Search Filter */}
          <input 
            value={catalogSearch}
            onChange={e => setCatalogSearch(e.target.value)}
            placeholder="Search templates by command, title, or tag..."
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: '1px solid #222', 
              background: '#111', 
              color: '#fff', 
              borderRadius: '10px', 
              fontSize: '12px', 
              boxSizing: 'border-box', 
              outline: 'none' 
            }}
          />

          {/* Prompt Cards Grid container */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gridAutoRows: 'max-content', 
            gap: '8px', 
            paddingRight: '4px' 
          }}>
            {catalogFilteredSkills.length === 0 ? (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', color: '#555', padding: '40px 0' }}>No templates found matching filters.</div>
            ) : (
              catalogFilteredSkills.map(skill => (
                <div 
                  key={skill.id}
                  style={{ 
                    background: '#111', 
                    border: '1px solid #222', 
                    borderRadius: '12px', 
                    padding: '10px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    minHeight: '95px', 
                    boxSizing: 'border-box' 
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '12px' }}>{skill.name}</span>
                      <span style={{ 
                        fontSize: '9px', 
                        color: '#666', 
                        padding: '1px 4px', 
                        borderRadius: '8px', 
                        background: '#222', 
                        textTransform: 'capitalize' 
                      }}>{skill.type}</span>
                    </div>
                    <div style={{ color: '#555', fontSize: '11px', fontFamily: 'monospace', marginTop: '2px' }}>{skill.command}</div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '3px', overflow: 'hidden', maxWidth: '145px' }}>
                      {skill.tags.slice(0, 2).map(t => (
                        <span key={t} style={{ fontSize: '9px', color: '#777' }}>#{t}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => onPreviewSkill(skill)} 
                        style={{ 
                          padding: '4px 6px', 
                          background: 'transparent', 
                          border: '1px solid #333', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontSize: '11px', 
                          color: '#aaa', 
                          display: 'flex', 
                          alignItems: 'center' 
                        }}
                        title="Preview template"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => onSelectSkill(skill)} 
                        style={{ 
                          padding: '4px 8px', 
                          background: '#fff', 
                          color: '#000', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontSize: '11px', 
                          fontWeight: '600' 
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
