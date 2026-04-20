# OpenAI API Configuration

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** (https://platform.openai.com/account/api-keys)
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again)

### 2. Add to Your Environment

#### Development (.env.local)
Create or update `app/.env.local`:
```
OPENAI_API_KEY=sk-your-api-key-here
```

#### Production
Add to your deployment platform's environment variables:
- **Vercel**: Project Settings → Environment Variables
- **Docker/Self-hosted**: Set via your deployment configuration

### 3. Verify Setup

Test that the API is working:
```bash
cd app
npm run dev
```

Navigate to an assignment and submit content for AI review. You should see real AI-generated grades and feedback instead of mock data.

## API Endpoints

### POST /api/review
Generates AI grade and feedback for a submission.

**Request:**
```json
{
  "content": "student submission text or link",
  "rules": ["rule1", "rule2", "rule3"],
  "assignmentName": "Essay on Climate Change",
  "organizationName": "Environmental Science 101"
}
```

**Response:**
```json
{
  "grade": "A-",
  "score": 92,
  "feedback": [
    "Excellent research and citations",
    "Consider strengthening the conclusion",
    "Good use of supporting evidence"
  ]
}
```

### POST /api/generate-rules
Generates grading criteria from an organization description.

**Request:**
```json
{
  "organizationName": "English Literature",
  "description": "Focus on critical analysis and essay writing skills"
}
```

**Response:**
```json
{
  "rules": [
    "Clear thesis statement",
    "Supporting evidence from text",
    "Critical analysis and interpretation",
    "Writing mechanics and grammar"
  ]
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "OpenAI API key not configured" | Check that `OPENAI_API_KEY` is set in `.env.local` |
| API requests fail | Verify your API key is valid and has usage balance |
| Slow responses | API calls may take 2-5 seconds; this is normal |
| Rate limiting (429 error) | OpenAI is rate-limiting; wait a moment and retry |

## Cost Considerations

- **Model Used**: `gpt-4o-mini` (most cost-effective for this use case)
- **Typical Cost**: ~$0.01-0.05 per submission review
- **Monitor Usage**: Check [OpenAI Usage Dashboard](https://platform.openai.com/account/usage/overview)

## Security

- Never commit `.env.local` to version control (it's in `.gitignore`)
- Rotate API keys regularly
- Monitor for unauthorized usage
