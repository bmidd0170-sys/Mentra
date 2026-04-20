# AI Integration Testing Guide

## Quick Start

### 1. Set Up OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Create `app/.env.local` with:
   ```
   OPENAI_API_KEY=sk_your_actual_key_here
   ```

### 2. Start Dev Server

```bash
cd app
npm run dev
```

The app should start at `http://localhost:3000`

## Test Scenarios

### Scenario 1: AI-Generated Rules (Organization Creation)

**Steps:**
1. Log in with `rob@launchpadphilly.org` / `password123`
2. Click "Create Organization" from dashboard
3. Fill in:
   - **Name**: "Advanced Python Programming"
   - **Description**: "Course focused on advanced Python concepts including async/await, decorators, and design patterns"
   - **Grading System**: "Letter Grade (A-F)"
4. Toggle "Use AI to Generate Rules" ON
5. Click "Generate AI Rules"
6. Wait 2-5 seconds for AI to generate rules
7. Verify 5-8 rules appear (e.g., "Code efficiency and optimization", "Error handling", etc.)
8. Click "Create Organization"

**Expected Result:**
- AI generates contextual rules based on the course description
- Rules are relevant to advanced Python programming
- No errors in browser console

---

### Scenario 2: AI Assignment Review (Real Grading)

**Steps:**
1. On dashboard, navigate to an assignment (or create one)
2. Scroll to "Submit Your Work" section
3. Choose submission method:
   - **Text Tab**: Paste sample student work (see template below)
   - **Link Tab**: Paste any shareable document link
   - **Upload Tab**: Upload a PDF/DOCX (future feature)
4. Click "Submit for AI Review"
5. Wait 2-5 seconds while analyzing
6. Verify AI response:
   - Grade appears (e.g., "B+")
   - Score shown (0-100)
   - 4-5 feedback items display with icons

**Sample Student Submission (for testing):**
```
Title: The Impact of Climate Change on Ocean Ecosystems

Introduction:
Climate change is significantly altering ocean ecosystems worldwide. Rising water 
temperatures and increased acidity are disrupting marine life habitats and food chains.

Body:
1. Temperature Changes: Coral bleaching events have increased by 50% over the past 
   decade. Warm-water species are migrating to cooler regions, creating ecological imbalances.

2. Ocean Acidification: The pH of ocean water has decreased by 0.1 units since 
   industrial times, making it harder for shellfish and other organisms to form shells.

3. Species Migration: Fish populations are shifting northward as water temperatures rise, 
   affecting fishing industries and local economies.

Conclusion:
Addressing climate change requires immediate international cooperation. Reducing carbon 
emissions and protecting marine habitats are essential steps for preserving ocean ecosystems.
```

**Expected Result:**
- Receives a grade (typically B-A range for sample)
- Feedback includes both strengths and improvement areas
- Feedback items have green checkmarks (strengths) and yellow alerts (improvements)
- No API errors in console

---

### Scenario 3: Error Handling

**Test Missing API Key:**
1. Remove `OPENAI_API_KEY` from `.env.local`
2. Try to submit an assignment
3. Should see error: "OpenAI API key not configured"

**Test Invalid Submission:**
1. Leave both text and link empty
2. Submit button should be disabled
3. Try to generate rules without entering description
4. Should see alert: "Please enter both organization name and description"

---

## Expected Behavior

| Feature | Before (Mock) | After (Real AI) |
|---------|---------------|-----------------|
| Assignment Review | Random B+, 87, mock feedback | Real GPT-4 Mini grade with contextual feedback |
| Rule Generation | 5 generic rules, 1.5s delay | AI-contextual rules, 2-5s delay |
| Feedback Icons | First 2 items green, rest yellow | Smart detection based on feedback content |
| Error Messages | Silent failures | Clear error messages |

## Debugging

### Issue: "400 Bad Request"
- **Cause**: Missing or invalid API key
- **Fix**: Verify `OPENAI_API_KEY` is set in `.env.local`

### Issue: "API rate limit reached"
- **Cause**: Too many requests in short time
- **Fix**: Wait a few minutes and retry

### Issue: "Failed to parse AI response"
- **Cause**: AI returned non-JSON response
- **Fix**: Rare; usually resolves on retry

### Issue: Very slow responses (>10 seconds)
- **Cause**: OpenAI API latency
- **Fix**: Normal; usually 2-5 seconds

## API Endpoints Reference

### POST /api/review
```bash
curl -X POST http://localhost:3000/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Student submission text",
    "rules": ["Rule 1", "Rule 2"],
    "assignmentName": "Essay",
    "organizationName": "English 101"
  }'
```

### POST /api/generate-rules
```bash
curl -X POST http://localhost:3000/api/generate-rules \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Advanced Python",
    "description": "Course on advanced Python programming"
  }'
```

## Next Steps

- [ ] Implement assignment history and progression tracking
- [ ] Add streaming responses for real-time feedback
- [ ] Cache rules per organization to reduce API calls
- [ ] Add usage analytics dashboard
- [ ] Implement batch grading for multiple submissions
