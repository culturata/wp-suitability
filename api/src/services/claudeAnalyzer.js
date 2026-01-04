const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');
require('dotenv').config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Analyzes content using Claude API with structured outputs
 * @param {Object} params - Analysis parameters
 * @param {string} params.title - Content title
 * @param {string} params.content - Content body
 * @param {string} params.excerpt - Content excerpt/summary
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeContent({ title, content, excerpt = '' }) {
  const startTime = Date.now();

  // Generate content hash for caching
  const contentHash = crypto
    .createHash('sha256')
    .update(`${title}||${content}||${excerpt}`)
    .digest('hex');

  const analysisPrompt = `You are a brand suitability analyst for Culturata Labs. Analyze the following content and provide a comprehensive brand safety assessment.

Content Title: ${title}

Content Excerpt: ${excerpt}

Full Content:
${content}

Provide your analysis in the following JSON structure:
{
  "overallScore": <number 0-100, where 100 is completely safe>,
  "garmRiskLevel": <"floor" | "low" | "medium" | "high">,
  "garmCategories": {
    "adultContent": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "armsAmmunition": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "crimeHarmfulActs": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "deathInjuryConflict": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "onlinePiracy": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "hateSpeech": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "obscenityProfanity": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "drugsAlcoholTobacco": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "spamHarmful": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "terrorism": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "debatedSocialIssues": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"},
    "militaryConflict": {"detected": <boolean>, "confidence": <0-1>, "details": "<explanation if detected>"}
  },
  "iabCategories": [
    {
      "id": "<IAB category ID like IAB1>",
      "name": "<category name>",
      "confidence": <0-1>
    }
  ],
  "sentimentScore": <number -1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive>,
  "toxicityFlags": {
    "hateSpeech": <boolean>,
    "violence": <boolean>,
    "adultContent": <boolean>,
    "profanity": <boolean>,
    "controversial": <boolean>
  },
  "riskFlags": [
    {
      "type": "<risk type>",
      "severity": <"low" | "medium" | "high">,
      "description": "<explanation>"
    }
  ],
  "flaggedEntities": [
    {
      "text": "<entity name>",
      "type": "<PERSON | ORG | EVENT | etc>",
      "reason": "<why this is flagged>"
    }
  ],
  "recommendations": [
    {
      "issue": "<specific issue found>",
      "location": "<paragraph/section where issue is>",
      "original": "<exact problematic text>",
      "suggested": "<suggested replacement text>",
      "priority": <"low" | "medium" | "high">,
      "reasoning": "<why this change improves brand suitability>"
    }
  ],
  "reasoning": "<brief explanation of the score>"
}

GARM 12 Risk Categories:
1. Adult & Explicit Sexual Content - Sexually explicit material, nudity, pornography
2. Arms & Ammunition - Weapons, firearms, ammunition sales or promotion
3. Crime & Harmful Acts - Criminal activity, violence, harmful behaviors
4. Death, Injury, or Military Conflict - Graphic injuries, death, war coverage
5. Online Piracy - Copyright infringement, illegal downloads, counterfeits
6. Hate Speech & Acts of Aggression - Discrimination, bigotry, hate groups
7. Obscenity & Profanity - Excessive profanity, vulgar language
8. Illegal Drugs/Tobacco/e-Cigarettes/Vaping/Alcohol - Drug use, smoking, alcohol promotion
9. Spam or Harmful Content - Malware, phishing, misleading content
10. Terrorism - Terrorist organizations, extremism, radicalization
11. Debated Sensitive Social Issues - Abortion, immigration, controversial politics
12. Military Conflict - War zones, military operations, armed conflict

GARM Risk Level Guidelines:
- floor: No risk, completely brand safe
- low: Minimal risk, safe for most brands
- medium: Some risk, may not be suitable for all brands
- high: Significant risk, not suitable for most brands

IAB Categories (use standard IAB Content Taxonomy v3.0):
Common examples: IAB1 (Arts & Entertainment), IAB3 (Business), IAB5 (Education), IAB7 (Health & Fitness), IAB11 (Law, Government & Politics), IAB12 (News), IAB14 (Society), IAB17 (Sports), IAB19 (Technology & Computing)

IMPORTANT: Provide 3-5 actionable recommendations with specific text replacements where content could be improved for brand safety. Be specific about the location and exact text to change.

Be thorough but conservative in your assessment. When in doubt, flag potential risks.`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000, // Increased for recommendations
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ]
    });

    // Extract JSON from response
    const responseText = response.content[0].text;
    let analysisResult;

    try {
      // Try to parse the entire response as JSON
      analysisResult = JSON.parse(responseText);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/```\n([\s\S]*?)\n```/);

      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse Claude response as JSON');
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      contentHash,
      overallScore: analysisResult.overallScore,
      garmRiskLevel: analysisResult.garmRiskLevel,
      garmCategories: analysisResult.garmCategories || {},
      iabCategories: analysisResult.iabCategories || [],
      sentimentScore: analysisResult.sentimentScore,
      toxicityFlags: analysisResult.toxicityFlags,
      riskFlags: analysisResult.riskFlags || [],
      flaggedEntities: analysisResult.flaggedEntities || [],
      recommendations: analysisResult.recommendations || [],
      reasoning: analysisResult.reasoning,
      processingTimeMs: processingTime,
      modelVersion: 'claude-3-5-sonnet-20241022',
      rawResponse: analysisResult
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

/**
 * Get a simplified score summary
 */
function getScoreSummary(score) {
  if (score >= 90) return { grade: 'A', label: 'Excellent', color: 'green' };
  if (score >= 75) return { grade: 'B', label: 'Good', color: 'blue' };
  if (score >= 60) return { grade: 'C', label: 'Moderate', color: 'yellow' };
  if (score >= 40) return { grade: 'D', label: 'Risky', color: 'orange' };
  return { grade: 'F', label: 'High Risk', color: 'red' };
}

module.exports = {
  analyzeContent,
  getScoreSummary
};
