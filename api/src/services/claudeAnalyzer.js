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
  "reasoning": "<brief explanation of the score>"
}

GARM Risk Level Guidelines:
- floor: No risk, completely brand safe
- low: Minimal risk, safe for most brands
- medium: Some risk, may not be suitable for all brands
- high: Significant risk, not suitable for most brands

IAB Categories (use standard IAB Content Taxonomy v3.0):
Common examples: IAB1 (Arts & Entertainment), IAB3 (Business), IAB5 (Education), IAB7 (Health & Fitness), IAB11 (Law, Government & Politics), IAB12 (News), IAB14 (Society), IAB17 (Sports), IAB19 (Technology & Computing)

Be thorough but conservative in your assessment. When in doubt, flag potential risks.`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
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
      iabCategories: analysisResult.iabCategories || [],
      sentimentScore: analysisResult.sentimentScore,
      toxicityFlags: analysisResult.toxicityFlags,
      riskFlags: analysisResult.riskFlags || [],
      flaggedEntities: analysisResult.flaggedEntities || [],
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
