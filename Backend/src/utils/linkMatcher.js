export function processLinks(resumeText, extractedLinks = []) {
  // Extract URLs from text as well (in case they're in the text content)
  const urlPattern = /https?:\/\/[^\s\)]+/gi;
  const textLinks = [];
  let match;
  let textLinkIndex = 0;
  while ((match = urlPattern.exec(resumeText)) !== null) {
    const uri = match[0].trim();
    // Check if this link is already in extractedLinks
    const existingLink = extractedLinks.find(l => l.uri === uri);
    if (!existingLink) {
      textLinks.push({
        id: `text_parse_${textLinkIndex}_${Date.now()}`,
        uri: uri,
        source: 'text_parsing',
        page: 0,
        x: 0,
        y: 0,
        w: 0,
        h: 0
      });
      textLinkIndex++;
    }
  }
  
  // Combine extracted links and text links, preserve IDs
  const allLinks = [...extractedLinks, ...textLinks];
  
  // Deduplicate by URI but keep the first occurrence with its ID
  const linkMap = new Map();
  allLinks.forEach(link => {
    const uri = link.uri || link;
    if (!linkMap.has(uri)) {
      linkMap.set(uri, typeof link === 'string' ? { id: `dedup_${Date.now()}_${Math.random()}`, uri: link, source: 'deduplicated' } : link);
    }
  });
  const uniqueLinks = Array.from(linkMap.values());
  
  console.log('=== LINK PROCESSING ===');
  console.log(`Total unique links: ${uniqueLinks.length}`);
  uniqueLinks.forEach((link, idx) => {
    console.log(`Unique Link ${idx + 1}:`, {
      id: link.id,
      uri: link.uri,
      source: link.source
    });
  });
  
  return uniqueLinks;
}

export function matchLinksToProjects(uniqueLinks, projects) {
  if (uniqueLinks.length === 0 || projects.length === 0) {
    return projects;
  }

  console.log('=== LINK-TO-PROJECT MATCHING ===');
  console.log(`Matching ${uniqueLinks.length} links to ${projects.length} projects`);
  
  // Create a map of project names and descriptions for matching
  const projectTextMap = projects.map((proj, idx) => ({
    index: idx,
    name: proj.name.toLowerCase(),
    fullText: (proj.name + ' ' + proj.description.join(' ')).toLowerCase(),
    projectName: proj.name
  }));
  
  // Match links to projects
  uniqueLinks.forEach(linkObj => {
    const link = linkObj.uri || linkObj;
    const linkId = linkObj.id || `unknown_${Date.now()}`;
    
    // Skip contact-related links (LinkedIn, GitHub) - they're handled separately
    if (link.includes('linkedin.com') || link.includes('github.com')) {
      console.log(`[SKIP] Link ${linkId} (${link}) - Contact link, skipping project matching`);
      return;
    }
    
    // Try to find the best matching project
    let bestMatch = null;
    let bestScore = 0;
    let matchDetails = null;
    
    projectTextMap.forEach(projMap => {
      let score = 0;
      const linkLower = link.toLowerCase();
      const scoringDetails = [];
      
      // Check if link domain matches project name or description
      try {
        // Try to parse as URL
        let url;
        try {
          url = new URL(link);
        } catch (e) {
          // If URL parsing fails, try adding https://
          try {
            url = new URL('https://' + link);
          } catch (e2) {
            url = null;
          }
        }
        
        if (url) {
          const domain = url.hostname.replace('www.', '');
          const domainParts = domain.split('.');
          const mainDomain = domainParts[0];
          
          // Score based on domain matching project name
          if (projMap.name.includes(mainDomain) || mainDomain.includes(projMap.name.split(' ')[0])) {
            score += 10;
            scoringDetails.push(`domain_match: +10`);
          }
          
          // Score based on link appearing in project text
          if (projMap.fullText.includes(linkLower) || projMap.fullText.includes(mainDomain)) {
            score += 15;
            scoringDetails.push(`text_match: +15`);
          }
          
          // Check if project name appears in URL path
          const pathParts = url.pathname.split('/').filter(p => p.length > 2);
          pathParts.forEach(part => {
            if (projMap.name.includes(part) || part.includes(projMap.name.split(' ')[0])) {
              score += 5;
              scoringDetails.push(`path_match: +5`);
            }
          });
        } else {
          // If URL parsing fails, just check if link is in project text
          if (projMap.fullText.includes(linkLower)) {
            score += 10;
            scoringDetails.push(`text_fallback: +10`);
          }
        }
      } catch (e) {
        // If URL parsing fails, just check if link is in project text
        if (projMap.fullText.includes(linkLower)) {
          score += 10;
          scoringDetails.push(`text_error_fallback: +10`);
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = projMap.index;
        matchDetails = {
          projectName: projMap.projectName,
          score: score,
          details: scoringDetails
        };
      }
    });
    
    // If we found a good match, add the link to that project
    if (bestMatch !== null && bestScore > 0) {
      const project = projects[bestMatch];
      // Store link with its ID for tracking
      const linkWithId = typeof link === 'string' ? { id: linkId, uri: link, source: linkObj.source || 'matched' } : linkObj;
      
      // Check if link already exists (by URI)
      const existingLinkIndex = project.links.findIndex(l => {
        const existingUri = typeof l === 'string' ? l : l.uri;
        return existingUri === link;
      });
      
      if (existingLinkIndex === -1) {
        project.links.push(linkWithId);
        console.log(`[MATCH] Link ${linkId} (${link}) → Project "${project.name}" (Score: ${bestScore}, ${matchDetails.details.join(', ')})`);
      } else {
        console.log(`[SKIP] Link ${linkId} (${link}) already exists in project "${project.name}"`);
      }
    } else {
      // If no good match, don't add to projects automatically
      console.log(`[NO MATCH] Link ${linkId} (${link}) - No suitable project match found (best score: ${bestScore})`);
    }
  });
  
  console.log('=== FINAL PROJECT LINKS ===');
  projects.forEach((proj, idx) => {
    console.log(`Project ${idx + 1} "${proj.name}":`, {
      linkCount: proj.links.length,
      links: proj.links.map(l => ({
        id: typeof l === 'string' ? 'no_id' : (l.id || 'no_id'),
        uri: typeof l === 'string' ? l : (l.uri || 'no_uri')
      }))
    });
  });
  
  return projects;
}

export function matchContactLinks(uniqueLinks, contact) {
  if (uniqueLinks.length === 0) {
    return contact;
  }
  
  uniqueLinks.forEach(linkObj => {
    const link = linkObj.uri || linkObj;
    if (link.includes('linkedin.com') && !contact.linkedin) {
      contact.linkedin = link;
    } else if (link.includes('github.com') && !contact.github) {
      contact.github = link;
    }
  });
  
  return contact;
}

