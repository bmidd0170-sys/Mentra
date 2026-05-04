# AI Responsibility Documentation

## Overview

Mentra integrates OpenAI's `gpt-4o-mini` model to provide automated assignment feedback and grading rule generation. This document defines the scope, limitations, and ethical considerations of AI usage within the platform.

## AI Capabilities

### 1. Assignment Review (`/api/review`)

**Purpose**: Provide students with immediate, actionable feedback on submitted work before official grading.

**What the AI Does**:
- Evaluates submission content against instructor-defined grading rules
- Assigns a letter grade and numeric score (adapts to grading system: letter/percentage/GPA)
- Generates 4-5 specific feedback items highlighting strengths and areas for improvement
- Can process text content, DOCX files, and screenshots of submissions

**What the AI Does NOT Do**:
- Does not replace official instructor grading
- Does not modify grades in the database (read-only evaluation)
- Does not store or remember previous submissions
- Does not provide final grades for transcript or record purposes

### 2. Grading Rule Generation (`/api/generate-rules`)

**Purpose**: Assist instructors in creating measurable grading criteria for their organizations.

**What the AI Does**:
- Analyzes organization name and description (up to 500+ characters with chunking)
- Generates 5-8 clear, measurable grading rules/criteria
- Adapts rule complexity to the organization's context (academic, professional, etc.)

**What the AI Does NOT Do**:
- Does not enforce rules (instructor must review and approve)
- Does not automatically apply rules to existing assignments
- Does not consider institutional accreditation requirements

### 3. Submission Grading (`/api/gradeSubmission`)

**Purpose**: Evaluate submissions against custom rubric criteria with detailed reasoning.

**What the AI Does**:
- Assesses submissions against criterion-based rubrics
- Selects appropriate performance levels for each criterion
- Provides reasoning and improvement suggestions
- Assigns confidence scores to assessments

**What the AI Does NOT Do**:
- Does not make final grading decisions
- Does not override instructor judgment
- Does not automatically publish grades to students

## Model Configuration

| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| Model | `gpt-4o-mini` | Cost-effective for high-volume grading tasks |
| Temperature | 0.2 | Low randomness ensures consistent, fair grading |
| Max Tokens | Default | Let model determine appropriate response length |
| Response Format | JSON Schema | Enforces structured output for reliable parsing |

## Data Handling & Privacy

### Data Sent to OpenAI

**Included in API Calls**:
- Assignment name and organization context
- Grading rules/criteria defined by instructors
- Student submission content (text, DOCX content, or screenshot)
- Grading system type (letter/percentage/GPA)

**NOT Sent to OpenAI**:
- User identities (names, emails, Firebase UIDs)
- Organization IDs or database identifiers
- Student personal information beyond submission content
- Authentication tokens or credentials

### Data Retention

- **Mentra**: Stores submissions and AI feedback in PostgreSQL database
- **OpenAI**: Subject to OpenAI's data usage policies (API calls are not used for model training by default with `gpt-4o-mini`)
- **No Persistent AI Memory**: Each API call is stateless; the AI does not remember previous submissions

## Accuracy & Limitations

### Known Limitations

1. **Hallucination Risk**: AI may occasionally generate inaccurate feedback or misalign with instructor intent
2. **Context Limits**: Very long submissions may be truncated or lose nuance
3. **Subjective Assessments**: AI struggles with creative work, nuanced arguments, or context-dependent quality
4. **Bias Potential**: Model may reflect training data biases in feedback language or grading patterns
5. **File Type Support**: PDF parsing is limited; DOCX and TXT are fully supported

### Confidence Indicators

- Grading results include confidence scores (0.0 - 1.0) for rubric-based assessments
- Low confidence (< 0.6) should trigger instructor review
- Feedback is segmented to reference specific submission parts when possible

## Human Oversight Requirements

### Instructor Responsibilities

1. **Review AI-Generated Rules**: Always review and edit AI-generated grading rules before use
2. **Validate Feedback**: Spot-check AI feedback for accuracy and appropriateness
3. **Override Authority**: Instructors can (and should) override AI grades when necessary
4. **Student Support**: Be available to explain AI feedback and address student concerns
5. **Bias Monitoring**: Watch for patterns of unfair AI feedback across student groups

### Student Rights

1. **Transparency**: Students can see all AI-generated feedback and grades
2. **Appeal Process**: Students can request instructor review of AI feedback
3. **Iteration**: Students can resubmit and receive new AI feedback (each submission is independent)
4. **Context**: AI feedback is clearly labeled as "AI-generated" and not official grades

## Ethical Guidelines

### Fairness

- AI feedback must be used as a learning tool, not a punitive measure
- Grading rules should be reviewed for bias before AI application
- Students should have equal access to AI feedback regardless of submission format

### Transparency

- Users are informed when content is AI-generated (via UI indicators)
- AI limitations are documented and accessible
- The model used (`gpt-4o-mini`) is disclosed in system documentation

### Accountability

- Final grading decisions rest with human instructors, not AI
- AI errors do not absolve instructors of grading responsibility
- System logs AI API errors for monitoring and improvement

### Privacy

- Student submissions are only sent to OpenAI for processing, not stored by OpenAI
- No PII (Personally Identifiable Information) is included in AI API calls
- Students can request deletion of their submissions (which removes AI feedback)

## Cost Management

- **Model Choice**: `gpt-4o-mini` selected for cost-effectiveness (~$0.01-0.05 per review)
- **No Caching**: Each submission triggers a new API call (intentional for fresh feedback)
- **Rate Limiting**: OpenAI 429 errors are caught and returned to users with retry guidance
- **Monitoring**: Users should monitor usage via [OpenAI Dashboard](https://platform.openai.com/account/usage/overview)

## Error Handling

| Error Type | User Message | Action Required |
|------------|--------------|-----------------|
| Missing API Key | "OpenAI API key not configured" | Admin sets `OPENAI_API_KEY` |
| Auth Error (401) | "OpenAI authentication failed" | Admin verifies API key |
| Rate Limit (429) | "OpenAI rate limit reached" | User retries after brief wait |
| Server Error (5xx) | "OpenAI is currently unavailable" | User retries after short delay |
| Invalid Response | "Failed to parse AI response" | System retries or user resubmits |

## Compliance Considerations

### Educational Context

- AI feedback is **formative**, not summative assessment
- Does not replace instructor judgment or institutional grading policies
- Students should be informed that AI feedback is advisory only

### Data Protection

- Follows FERPA guidelines (US) by not sharing PII with third parties (OpenAI)
- Submission content is processed but not permanently stored by OpenAI
- Database storage follows standard PostgreSQL security practices

### Accessibility

- Feedback is text-based and compatible with screen readers
- No video/audio AI features that could create accessibility barriers
- File upload supports common formats (DOCX, TXT) for broad compatibility

## Future Improvements

1. **Confidence Thresholds**: Auto-flag low-confidence assessments for instructor review
2. **Bias Detection**: Analyze feedback patterns for potential bias indicators
3. **Feedback Explanations**: Provide more detailed reasoning for grading decisions
4. **Multi-Model Support**: Allow switching between models for different use cases
5. **Audit Logs**: Track AI usage patterns for continuous improvement

## Support & Feedback

For issues with AI functionality:
1. Check `AI_SETUP.md` for configuration troubleshooting
2. Review `AI_TESTING.md` for common scenarios and solutions
3. Monitor OpenAI API status at https://status.openai.com
4. Report persistent issues via [GitHub Issues](https://github.com/anomalyco/opencode/issues)
