/**
 * Parser utility to convert Component[] arrays into structured report sections
 */

import { Component, TextComponent } from '../services/agentService';

export interface HealthScore {
  value: number;
  label: string;
  color: string;
}

export interface Decision {
  title: string;
  content: string;
  subSections?: {
    why?: string;
    ifExecuted?: string;
    ifIgnored?: string;
  };
}

export interface ParsedReport {
  healthScore?: HealthScore;
  summary?: string;
  decisions: Decision[];
  charts: Component[];
  watchlist?: string;
}

/**
 * Extract health score from text content
 * Looks for patterns like "84%", "health score", etc.
 */
function extractHealthScore(text: string): HealthScore | undefined {
  // Pattern 1: "84% health" or "84% health score"
  const healthPattern1 = /(\d+)%\s*(?:health|health\s*score)/i;
  const match1 = text.match(healthPattern1);
  if (match1) {
    const value = parseInt(match1[1], 10);
    if (value >= 0 && value <= 100) {
      return {
        value,
        label: `${value}%`,
        color: value >= 70 ? '#33C481' : value >= 40 ? '#C48333' : '#DC2626',
      };
    }
  }

  // Pattern 2: "health score: 84%" or "health score is 84%"
  const healthPattern2 = /health\s*score[:\s]+(\d+)%/i;
  const match2 = text.match(healthPattern2);
  if (match2) {
    const value = parseInt(match2[1], 10);
    if (value >= 0 && value <= 100) {
      return {
        value,
        label: `${value}%`,
        color: value >= 70 ? '#33C481' : value >= 40 ? '#C48333' : '#DC2626',
      };
    }
  }

  // Pattern 3: Just a percentage at the start of summary
  const percentagePattern = /^(\d+)%/;
  const match3 = text.match(percentagePattern);
  if (match3) {
    const value = parseInt(match3[1], 10);
    if (value >= 0 && value <= 100 && text.toLowerCase().includes('health')) {
      return {
        value,
        label: `${value}%`,
        color: value >= 70 ? '#33C481' : value >= 40 ? '#C48333' : '#DC2626',
      };
    }
  }

  return undefined;
}

/**
 * Check if text contains a section marker
 */
function containsSection(text: string, markers: string[]): boolean {
  const lowerText = text.toLowerCase();
  return markers.some(marker => lowerText.includes(marker.toLowerCase()));
}

/**
 * Parse components array into structured report sections
 */
export function parseComponentsToReport(components: Component[]): ParsedReport {
  const result: ParsedReport = {
    decisions: [],
    charts: [],
  };

  const textComponents: TextComponent[] = [];
  const chartComponents: Component[] = [];

  // Separate text and chart components
  components.forEach(component => {
    if (component.type === 'text') {
      textComponents.push(component as TextComponent);
    } else {
      chartComponents.push(component);
    }
  });

  // Collect all charts
  result.charts = chartComponents;

  // Extract health score from first text component
  if (textComponents.length > 0) {
    const firstText = textComponents[0].data;
    result.healthScore = extractHealthScore(firstText);
  }

  // Find sections using heuristics
  let summaryFound = false;
  let decisionsFound = false;
  let watchlistFound = false;

  // Try to find sections by keywords
  for (const textComp of textComponents) {
    const text = textComp.data;

    // Check for Summary section
    if (!summaryFound && containsSection(text, ['summary', 'executive summary'])) {
      result.summary = text;
      summaryFound = true;
      continue;
    }

    // Check for Decisions section
    if (!decisionsFound && containsSection(text, ['what to do', 'recommendations', 'decisions', 'action items'])) {
      // Parse decisions from markdown
      const decisions = parseDecisionsFromMarkdown(text);
      result.decisions = decisions;
      decisionsFound = true;
      continue;
    }

    // Check for Watchlist section
    if (!watchlistFound && containsSection(text, ['watchlist', 'watch list', 'items to watch'])) {
      result.watchlist = text;
      watchlistFound = true;
      continue;
    }
  }

  // Fallback strategy if sections not found
  if (!summaryFound && textComponents.length > 0) {
    // First text component = summary
    result.summary = textComponents[0].data;
  }

  if (!decisionsFound && textComponents.length > 1) {
    // Middle text components = decisions
    const middleTexts = textComponents.slice(1, -1);
    if (middleTexts.length > 0) {
      result.decisions = middleTexts.map((comp, idx) => ({
        title: `Decision ${idx + 1}`,
        content: comp.data,
      }));
    }
  }

  if (!watchlistFound && textComponents.length > 1) {
    // Last text component = watchlist
    result.watchlist = textComponents[textComponents.length - 1].data;
  }

  // If no decisions found at all, create placeholder
  if (result.decisions.length === 0) {
    result.decisions = [];
  }

  return result;
}

/**
 * Parse decisions from markdown text
 * Looks for numbered lists, bullet points, or section headers
 */
function parseDecisionsFromMarkdown(text: string): Decision[] {
  const decisions: Decision[] = [];
  const lines = text.split('\n');

  let currentDecision: Partial<Decision> | null = null;
  let currentSection: 'content' | 'why' | 'ifExecuted' | 'ifIgnored' = 'content';
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at the start
    if (!line && !currentDecision) {
      continue;
    }

    // Check for decision title patterns
    // Pattern 1: "1. Title" or "1) Title"
    const numberedPattern = /^(\d+)[.)]\s*\*\*(.+?)\*\*|^(\d+)[.)]\s*(.+)/;
    const numberedMatch = line.match(numberedPattern);
    
    // Pattern 2: "### Title" or "## Title"
    const headerPattern = /^#{1,3}\s*(.+)/;
    const headerMatch = line.match(headerPattern);

    // Pattern 3: "- **Title**" or "• **Title**"
    const bulletPattern = /^[-•]\s*\*\*(.+?)\*\*/;
    const bulletMatch = line.match(bulletPattern);

    if (numberedMatch || headerMatch || bulletMatch) {
      // Save previous decision if exists
      if (currentDecision) {
        currentDecision.content = currentContent.join('\n').trim();
        if (currentDecision.title && currentDecision.content) {
          decisions.push(currentDecision as Decision);
        }
      }

      // Start new decision
      const title = numberedMatch?.[2] || numberedMatch?.[4] || 
                   headerMatch?.[1] || 
                   bulletMatch?.[1] || 
                   'Untitled Decision';
      
      currentDecision = {
        title: title.trim(),
        content: '',
        subSections: {},
      };
      currentContent = [];
      currentSection = 'content';
      continue;
    }

    // Check for subsections
    if (line.toLowerCase().includes('why:')) {
      currentSection = 'why';
      if (currentDecision) {
        currentDecision.content = currentContent.join('\n').trim();
        currentContent = [];
      }
      continue;
    }

    if (line.toLowerCase().includes('if executed:') || line.toLowerCase().includes('if executed')) {
      currentSection = 'ifExecuted';
      if (currentDecision) {
        currentDecision.content = currentContent.join('\n').trim();
        if (!currentDecision.subSections) {
          currentDecision.subSections = {};
        }
        currentDecision.subSections.why = currentContent.join('\n').trim();
        currentContent = [];
      }
      continue;
    }

    if (line.toLowerCase().includes('if ignored:') || line.toLowerCase().includes('if ignored')) {
      currentSection = 'ifIgnored';
      if (currentDecision) {
        if (!currentDecision.subSections) {
          currentDecision.subSections = {};
        }
        if (currentSection === 'ifExecuted') {
          currentDecision.subSections.ifExecuted = currentContent.join('\n').trim();
        }
        currentContent = [];
      }
      continue;
    }

    // Add line to current content
    if (line && currentDecision) {
      currentContent.push(line);
    }
  }

  // Save last decision
  if (currentDecision) {
    currentDecision.content = currentContent.join('\n').trim();
    if (currentDecision.subSections) {
      if (currentSection === 'ifIgnored') {
        currentDecision.subSections.ifIgnored = currentContent.join('\n').trim();
      } else if (currentSection === 'ifExecuted') {
        currentDecision.subSections.ifExecuted = currentContent.join('\n').trim();
      }
    }
    if (currentDecision.title && currentDecision.content) {
      decisions.push(currentDecision as Decision);
    }
  }

  // If no structured decisions found, try to split by paragraphs
  if (decisions.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    decisions.push(...paragraphs.slice(0, 5).map((para, idx) => ({
      title: `Decision ${idx + 1}`,
      content: para.trim(),
    })));
  }

  return decisions;
}
