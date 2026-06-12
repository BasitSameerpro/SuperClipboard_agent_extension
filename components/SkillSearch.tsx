import React, { useState, useEffect, useRef } from 'react';
import { Skill } from '../utils/githubFetcher';

interface SkillSearchProps {
  skills: Skill[];
  onSelectSkill: (input: string, skillOverride?: Skill) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
}

export default function SkillSearch({
  skills,
  onSelectSkill,
  showDropdown,
  setShowDropdown
}: SkillSearchProps) {
  const [skillInput, setSkillInput] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Autocomplete
  const filteredSkills = skills.filter(skill => 
    skill.command.toLowerCase().includes(skillInput.toLowerCase()) ||
    skill.name.toLowerCase().includes(skillInput.toLowerCase())
  ).slice(0, 10);

  useEffect(() => {
    setSelectedIndex(0);
  }, [skillInput]);

  useEffect(() => {
    // Auto-focus search input on load
    setTimeout(() => searchInputRef.current?.focus(), 100);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowDropdown]);

  // Keyboard navigation scrolling fix
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { 
      if (showDropdown && filteredSkills.length > 0) {
        const skill = filteredSkills[selectedIndex];
        setSkillInput(skill.command);
        setShowDropdown(false);
        onSelectSkill(skill.command, skill);
      } else {
        onSelectSkill(skillInput); 
        setShowDropdown(false);
      }
    } 
    else if (e.key === 'Escape') { 
      setShowDropdown(false); 
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSkills.length - 1));
      setShowDropdown(true);
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      setShowDropdown(true);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <input 
        ref={searchInputRef}
        value={skillInput} 
        onChange={e => { setSkillInput(e.target.value); setShowDropdown(true); }} 
        onFocus={() => setShowDropdown(true)} 
        onKeyDown={handleKeyDown} 
        placeholder="Type / or keywords to filter prompts..." 
        style={{ 
          width: '100%', 
          padding: '12px', 
          border: '1px solid #333', 
          background: '#111', 
          color: '#fff', 
          borderRadius: '10px', 
          fontSize: '13px', 
          boxSizing: 'border-box', 
          outline: 'none', 
          marginBottom: '12px' 
        }}
      />
      
      {showDropdown && filteredSkills.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '46px', 
          left: 0, 
          right: 0, 
          background: 'rgba(10, 10, 10, 0.98)', 
          backdropFilter: 'blur(12px)', 
          border: '1px solid #333', 
          borderRadius: '10px', 
          maxHeight: '220px', 
          overflowY: 'auto', 
          zIndex: 100, 
          boxShadow: '0 12px 40px rgba(0,0,0,0.9)' 
        }}>
          {filteredSkills.map((skill, index) => (
            <div 
              key={skill.id} 
              ref={index === selectedIndex ? activeItemRef : null}
              onClick={() => { 
                setSkillInput(skill.command); 
                setShowDropdown(false); 
                onSelectSkill(skill.command, skill); 
              }} 
              style={{ 
                padding: '10px 12px', 
                cursor: 'pointer', 
                borderBottom: '1px solid #222', 
                fontSize: '13px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: index === selectedIndex ? '#222' : 'transparent' 
              }} 
              onMouseEnter={() => setSelectedIndex(index)} 
            >
              <div>
                <span style={{ color: '#fff', fontWeight: '600', marginRight: '8px' }}>{skill.command}</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>{skill.name}</span>
              </div>
              <span style={{ 
                fontSize: '10px', 
                color: '#666', 
                background: '#222', 
                padding: '2px 6px', 
                borderRadius: '8px', 
                textTransform: 'capitalize' 
              }}>{skill.type}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '12px' }}>
        <button 
          onClick={() => onSelectSkill(skillInput)} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '1px solid #444', 
            background: '#111', 
            color: '#fff', 
            cursor: 'pointer', 
            fontWeight: '600', 
            fontSize: '13px', 
            borderRadius: '10px', 
            transition: 'all 0.2s' 
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#222'}
          onMouseLeave={e => e.currentTarget.style.background = '#111'}
        >
          Copy Active Prompt
        </button>
      </div>
    </div>
  );
}
