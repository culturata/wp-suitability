/**
 * Keyword-based pre-screening service
 * Fast, local content analysis before AI processing
 */

// 12 GARM Risk Categories with keyword patterns
const GARM_KEYWORDS = {
  adultContent: {
    name: 'Adult & Explicit Sexual Content',
    keywords: [
      'porn', 'xxx', 'explicit', 'nude', 'naked', 'sex', 'sexual', 'erotic',
      'nsfw', 'adult content', 'pornography', 'obscene', 'lewd'
    ]
  },
  armsAmmunition: {
    name: 'Arms & Ammunition',
    keywords: [
      'gun', 'guns', 'weapon', 'firearms', 'ammunition', 'rifle', 'pistol',
      'handgun', 'shotgun', 'assault rifle', 'bullets', 'armory', 'arsenal'
    ]
  },
  crimeHarmfulActs: {
    name: 'Crime & Harmful Acts',
    keywords: [
      'murder', 'kill', 'assault', 'robbery', 'theft', 'crime', 'criminal',
      'illegal', 'fraud', 'scam', 'vandalism', 'arson', 'kidnapping', 'rape'
    ]
  },
  deathInjuryConflict: {
    name: 'Death, Injury, or Military Conflict',
    keywords: [
      'death', 'died', 'dead', 'killed', 'fatality', 'casualty', 'war',
      'battle', 'combat', 'military', 'bombing', 'explosion', 'wounded', 'injured'
    ]
  },
  onlinePiracy: {
    name: 'Online Piracy',
    keywords: [
      'pirated', 'torrent', 'crack', 'warez', 'keygen', 'illegal download',
      'copyright infringement', 'bootleg', 'counterfeit'
    ]
  },
  hateSpeech: {
    name: 'Hate Speech & Acts of Aggression',
    keywords: [
      'hate', 'racist', 'racism', 'nazi', 'supremacist', 'bigot', 'discrimination',
      'slur', 'xenophobia', 'islamophobia', 'antisemitic', 'homophobic'
    ]
  },
  obscenityProfanity: {
    name: 'Obscenity & Profanity',
    keywords: [
      'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'piss',
      'hell', 'bloody', 'curse', 'profanity', 'swear'
    ]
  },
  drugsAlcoholTobacco: {
    name: 'Illegal Drugs/Tobacco/e-Cigarettes/Vaping/Alcohol',
    keywords: [
      'drug', 'cocaine', 'heroin', 'marijuana', 'cannabis', 'meth', 'lsd',
      'cigarette', 'tobacco', 'vape', 'vaping', 'smoking', 'alcohol', 'drunk',
      'weed', 'pot', 'high', 'stoned'
    ]
  },
  spamHarmful: {
    name: 'Spam or Harmful Content',
    keywords: [
      'spam', 'click here', 'buy now', 'limited offer', 'act now', 'free money',
      'virus', 'malware', 'phishing', 'scam', 'fake', 'clickbait'
    ]
  },
  terrorism: {
    name: 'Terrorism',
    keywords: [
      'terrorist', 'terrorism', 'isis', 'al qaeda', 'extremist', 'radicalization',
      'jihad', 'bombing', 'suicide bomber', 'attack'
    ]
  },
  debatedSocialIssues: {
    name: 'Debated Sensitive Social Issues',
    keywords: [
      'abortion', 'euthanasia', 'immigration', 'lgbtq', 'transgender', 'gay marriage',
      'climate change denial', 'vaccine', 'anti-vax', 'political', 'election fraud'
    ]
  },
  militaryConflict: {
    name: 'Military Conflict',
    keywords: [
      'war', 'warfare', 'military conflict', 'invasion', 'occupation', 'airstrike',
      'drone strike', 'soldiers', 'troops', 'battlefield', 'siege'
    ]
  }
};

/**
 * Screen content for GARM risk keywords
 * @param {string} text - Content to screen
 * @returns {Object} Keyword screening results
 */
function screenContent(text) {
  const lowerText = text.toLowerCase();
  const results = {
    flagged: false,
    categories: {},
    totalFlags: 0,
    riskLevel: 'low'
  };

  // Check each GARM category
  for (const [categoryKey, categoryData] of Object.entries(GARM_KEYWORDS)) {
    const matches = [];
    let flagCount = 0;

    // Check for keyword matches
    for (const keyword of categoryData.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const keywordMatches = lowerText.match(regex);

      if (keywordMatches) {
        matches.push({
          keyword,
          count: keywordMatches.length
        });
        flagCount += keywordMatches.length;
      }
    }

    if (matches.length > 0) {
      results.categories[categoryKey] = {
        name: categoryData.name,
        detected: true,
        matches,
        flagCount,
        confidence: Math.min(flagCount * 0.1, 0.95) // Higher flag count = higher confidence
      };
      results.totalFlags += flagCount;
      results.flagged = true;
    } else {
      results.categories[categoryKey] = {
        name: categoryData.name,
        detected: false,
        confidence: 0
      };
    }
  }

  // Determine overall risk level based on flags
  if (results.totalFlags === 0) {
    results.riskLevel = 'floor';
  } else if (results.totalFlags <= 2) {
    results.riskLevel = 'low';
  } else if (results.totalFlags <= 5) {
    results.riskLevel = 'medium';
  } else {
    results.riskLevel = 'high';
  }

  return results;
}

/**
 * Get preliminary score based on keyword screening
 * @param {Object} screeningResults - Results from screenContent
 * @returns {number} Preliminary score (0-100)
 */
function getPreliminaryScore(screeningResults) {
  if (!screeningResults.flagged) {
    return 95; // Clean content
  }

  // Deduct points based on flags
  const baseScore = 100;
  const deduction = Math.min(screeningResults.totalFlags * 10, 60); // Max deduction of 60 points

  return Math.max(baseScore - deduction, 20); // Minimum score of 20
}

/**
 * Determine if AI analysis is needed
 * @param {Object} screeningResults - Results from screenContent
 * @param {string} tier - User tier (free, pro, enterprise)
 * @returns {boolean} Whether to proceed with AI analysis
 */
function needsAIAnalysis(screeningResults, tier) {
  // Enterprise always gets AI
  if (tier === 'enterprise') {
    return true;
  }

  // Free tier only gets AI if flagged
  if (tier === 'free') {
    return screeningResults.flagged;
  }

  // Pro tier always gets AI
  return true;
}

module.exports = {
  screenContent,
  getPreliminaryScore,
  needsAIAnalysis,
  GARM_KEYWORDS
};
