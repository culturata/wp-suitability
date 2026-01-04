# Culturata Brand Suitability Platform - Feature Documentation

## Overview

Complete implementation of all requested features from the original "Velvet Rope" plan, including dual analysis methods, 12 GARM categories, actionable recommendations, and tier-based feature gating.

---

## ✅ Core Features Implemented

### 1. Dual Analysis Methods (Keyword + AI)

**How it works:**
1. **Keyword Pre-Screening**: Fast, local analysis using pattern matching across 12 GARM categories
2. **AI Analysis**: Claude 3.5 Sonnet provides deep semantic understanding and recommendations
3. **Hybrid Approach**: Combines both for optimal accuracy and cost-efficiency

**Tier-Based Logic:**
- **Free Tier**: Keyword-only for clean content, AI only when flags detected
- **Pro Tier**: Always uses hybrid (keyword + AI)
- **Enterprise Tier**: Full AI analysis with extended features

**Benefits:**
- Instant results for obviously safe content
- Cost-effective (saves AI API calls)
- Fallback if AI service is slow/unavailable

---

### 2. 12 GARM Risk Categories

Complete coverage of all Global Alliance for Responsible Media risk categories:

| Category | Description | Example Keywords |
|----------|-------------|------------------|
| **Adult Content** | Sexually explicit material, nudity | porn, xxx, explicit, nude |
| **Arms & Ammunition** | Weapons, firearms | gun, rifle, ammunition |
| **Crime & Harmful Acts** | Criminal activity, violence | murder, theft, assault |
| **Death/Injury/Conflict** | Graphic content, casualties | death, killed, wounded |
| **Online Piracy** | Copyright infringement | torrent, crack, pirated |
| **Hate Speech** | Discrimination, bigotry | racist, nazi, slur |
| **Obscenity & Profanity** | Vulgar language | fuck, shit, profanity |
| **Drugs/Alcohol/Tobacco** | Substance use/promotion | cocaine, alcohol, vaping |
| **Spam/Harmful** | Malware, phishing | virus, scam, clickbait |
| **Terrorism** | Extremism, terrorist orgs | terrorist, isis, bombing |
| **Debated Social Issues** | Controversial topics | abortion, immigration |
| **Military Conflict** | War zones, combat | war, invasion, battlefield |

**Output Format:**
```json
{
  "garmCategories": {
    "adultContent": {
      "detected": false,
      "confidence": 0.02,
      "details": null
    },
    "hateSpeech": {
      "detected": true,
      "confidence": 0.87,
      "details": "Discriminatory language detected in paragraph 3"
    }
    // ... all 12 categories
  }
}
```

---

### 3. Actionable Recommendations

**What publishers get:**
- 3-5 specific, implementable suggestions per analysis
- Exact text to change with before/after comparison
- Priority level (low/medium/high)
- Reasoning for why the change improves brand safety

**Recommendation Structure:**
```json
{
  "issue": "Violent language detected",
  "location": "Paragraph 2, line 3",
  "original": "The battle was brutal and bloody",
  "suggested": "The competition was intense and hard-fought",
  "priority": "high",
  "reasoning": "Removing violent imagery makes content suitable for more advertisers"
}
```

**Display in WordPress:**
- Collapsible sections in Gutenberg sidebar
- Color-coded by priority (red=high, orange=medium, blue=low)
- "Apply Suggestion" button for one-click implementation

---

### 4. One-Click Fix Implementation

**How it works:**
1. User clicks "Apply Suggestion" button in Gutenberg sidebar
2. Plugin automatically finds `original` text in post content
3. Replaces with `suggested` text
4. Updates post content in editor
5. Tracks implementation in database for analytics

**Tracking:**
- Which recommendations were applied
- When they were applied
- User feedback rating (1-5 stars)
- Optional comment

**Benefits:**
- Saves time (no manual find/replace)
- Ensures exact replacement
- Tracks adoption for improving future recommendations

---

### 5. Recommendation Tracking Database

**Schema:**
```sql
CREATE TABLE recommendation_tracking (
  id UUID PRIMARY KEY,
  analysis_id UUID,
  user_id UUID,
  post_id VARCHAR,
  recommendation_index INT,
  original_text TEXT,
  suggested_text TEXT,
  implemented BOOLEAN,
  implemented_at TIMESTAMP,
  feedback_rating INT (1-5),
  feedback_comment TEXT
);
```

**API Endpoints:**
- `POST /api/v1/recommendations/track` - Track implementation
- `POST /api/v1/recommendations/:id/feedback` - Submit rating/feedback
- `GET /api/v1/recommendations/stats` - Get implementation statistics
- `GET /api/v1/recommendations/analysis/:analysisId` - Get tracked recs for analysis

**Analytics Available:**
- Total recommendations given
- Implementation rate (% applied)
- Average feedback rating
- Most commonly applied recommendation types

---

### 6. Tier-Based Feature Gating

**Free Tier (10 analyses/month):**
- ✅ Keyword-based pre-screening
- ✅ Basic GARM risk scores
- ⚠️ AI analysis only for flagged content
- ❌ No recommendations
- ❌ No bulk analysis

**Pro Tier ($99/mo, 1,000 analyses/month):**
- ✅ Hybrid keyword + AI analysis
- ✅ Full 12 GARM category breakdown
- ✅ Actionable recommendations
- ✅ One-click fixes
- ✅ Recommendation tracking
- ❌ No bulk API access

**Enterprise Tier (Custom, 10,000+ analyses/month):**
- ✅ All Pro features
- ✅ Priority AI analysis (always full)
- ✅ Bulk analysis tool
- ✅ Direct API access
- ✅ Custom scoring profiles (roadmap)
- ✅ Dedicated support

**Implementation:**
```javascript
// In API
if (userTier === 'free' && !keywordScreening.flagged) {
  // Keyword-only analysis
  return keywordBasedResult;
} else if (userTier === 'pro' || userTier === 'enterprise') {
  // Full AI + recommendations
  return await analyzeWithClaude();
}
```

---

## 🎨 WordPress UI Enhancements

### Gutenberg Sidebar Panel

**Displays:**
1. **Overall Score** - Large number with color-coded grade (A-F)
2. **GARM Risk Level** - Floor/Low/Medium/High badge
3. **Analysis Method Badge** - Shows if keyword-only or hybrid
4. **GARM Categories (Collapsible)**
   - Only shows detected categories
   - Confidence percentage
   - Details/explanation
5. **Recommendations (Collapsible)**
   - Priority-coded cards
   - Before/after text preview
   - "Apply Suggestion" button
   - Reasoning explanation
6. **Risk Flags** - Legacy toxicity flags
7. **IAB Categories** - Content classification tags
8. **Analysis Summary** - AI-generated reasoning

**Interactions:**
- Click category/recommendation headers to expand/collapse
- Click "Apply Suggestion" to auto-replace text
- Re-analyze button to get fresh analysis

---

## 📊 Database Schema Additions

### Analysis Table (Updated)
```sql
ALTER TABLE analyses ADD COLUMN garm_categories JSONB;
ALTER TABLE analyses ADD COLUMN recommendations JSONB;
ALTER TABLE analyses ADD COLUMN keyword_flags JSONB;
ALTER TABLE analyses ADD COLUMN analysis_method ENUM('keyword_only', 'ai_only', 'hybrid');
```

### Recommendation Tracking Table (New)
```sql
CREATE TABLE recommendation_tracking (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id),
  user_id UUID REFERENCES users(id),
  post_id VARCHAR,
  recommendation_index INT,
  original_text TEXT,
  suggested_text TEXT,
  implemented BOOLEAN DEFAULT false,
  implemented_at TIMESTAMP,
  feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚀 Performance Optimizations

### Keyword Screening Benefits
- **Speed**: < 10ms vs 2-5s for AI
- **Cost**: $0 vs ~$0.001-0.005 per analysis
- **Reliability**: No external API dependency

### When AI is Skipped (Free Tier)
- Content with zero keyword flags
- Estimated API cost savings: 60-70%
- User still gets valid brand safety score

### Caching Strategy
- Redis caches full AI results for 24 hours
- Content hash prevents duplicate AI calls
- Keyword results not cached (too fast to matter)

---

## 📈 Analytics & Insights

### For Publishers
- Implementation rate of recommendations
- Most common risk categories flagged
- Average brand safety score over time
- Trending issues

### For Culturata (Platform Owner)
- Feature usage by tier
- Recommendation acceptance rates
- Most effective recommendation types
- Tier upgrade triggers

---

## 🔐 Security & Privacy

### Data Handling
- Content sent to Claude API for analysis
- Full text NOT stored permanently
- Only analysis results retained
- Content hash used for cache lookup

### GDPR Compliance
- No PII collected from visitors
- Only admin users trigger analysis
- Data processing agreement available
- Right to deletion supported

---

## 🎯 Future Enhancements (Roadmap)

### Phase 1 - Completed ✅
- [x] 12 GARM categories
- [x] Keyword pre-screening
- [x] Actionable recommendations
- [x] One-click fixes
- [x] Recommendation tracking
- [x] Tier-based gating

### Phase 2 - Planned 🎫
- [ ] A/B testing different recommendations
- [ ] Machine learning on recommendation acceptance
- [ ] Custom brand safety profiles per advertiser
- [ ] Historical trend analysis dashboard
- [ ] WordPress block validation (flag risky blocks)
- [ ] Real-time analysis while typing

### Phase 3 - Future 🔮
- [ ] Image/video content analysis
- [ ] Multi-language support
- [ ] Integration with ad servers
- [ ] Automated content improvement (AI rewrites)
- [ ] Publisher certification program
- [ ] Advertiser preference API

---

## 💡 Usage Examples

### Example 1: Free Tier User (Clean Content)
```
Input: "5 Tips for Better Email Marketing"
→ Keyword screening: No flags detected
→ Result: Keyword-only analysis
→ Score: 95/100 (Floor risk)
→ Time: < 100ms
→ Cost: $0
```

### Example 2: Pro Tier User (Flagged Content)
```
Input: "The Political Battle Over Immigration Reform"
→ Keyword screening: "political", "battle" flagged
→ Triggers: Full AI analysis
→ GARM Categories: debatedSocialIssues (0.78), militaryConflict (0.32)
→ Recommendations:
  1. Change "battle" → "debate" (high priority)
  2. Soften "controversial" → "discussed" (medium priority)
→ Score: 68/100 (Medium risk)
→ Time: 3.2s
→ Cost: ~$0.003
```

### Example 3: Enterprise Tier (Bulk Analysis)
```
Input: 100 blog posts
→ All get full AI analysis
→ 23 flagged for review
→ 47 recommendations total
→ Average score: 82/100
→ Time: ~2 minutes
→ Cost: ~$0.30
```

---

## 📞 Support

For questions about specific features:
- **Documentation**: [docs.culturata.com](https://docs.culturata.com)
- **API Reference**: [api.culturata.com/docs](https://api.culturata.com/docs)
- **Support**: support@culturata.com

---

**Version**: 2.0.0
**Last Updated**: 2024-01-15
**Status**: Production Ready ✅
