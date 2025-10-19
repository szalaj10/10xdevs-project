# Groq Service Examples

This directory contains example code demonstrating how to use the GroqService in various scenarios.

## Prerequisites

Before running these examples, make sure you have:

1. Installed dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables in `.env.local`:
   ```env
   GROQ_API_KEY=your-api-key-here
   GROQ_MODEL=llama-3.3-70b-versatile  # Optional
   ```

## Available Examples

### 1. Basic Usage Example (`groq-usage-example.ts`)

Demonstrates:
- Basic flashcard generation
- Error handling
- Retry logic with exponential backoff
- Token usage monitoring
- Structured JSON output with schema validation

**Run it:**
```bash
npm run dev
# Then import and use the functions in your Astro components
```

## Example Usage in Astro Components

### In an Astro page:

```astro
---
// src/pages/example.astro
import { generateFlashcards } from '../../examples/groq-usage-example';

const flashcards = await generateFlashcards('Machine Learning Basics');
---

<html>
  <body>
    <h1>Generated Flashcards</h1>
    {flashcards.map(card => (
      <div>
        <h3>{card.front}</h3>
        <p>{card.back}</p>
        <div>Tags: {card.tags.join(', ')}</div>
      </div>
    ))}
  </body>
</html>
```

### In an API route:

```typescript
// src/pages/api/generate.ts
import type { APIRoute } from 'astro';
import { generateFlashcardsWithRetry } from '../../../examples/groq-usage-example';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { topic } = await request.json();
    const flashcards = await generateFlashcardsWithRetry(topic);
    
    return new Response(JSON.stringify({ flashcards }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## Common Patterns

### 1. Simple Request
```typescript
import { createGroqService } from '../src/lib/services/groqService';

const service = createGroqService();
const response = await service.send('Hello, world!');
console.log(response.data);
```

### 2. Structured Output
```typescript
const responseFormat = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'MySchema',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string' }
      },
      required: ['answer']
    }
  }
};

const response = await service.send('Question', { responseFormat });
```

### 3. Error Handling
```typescript
import { AuthenticationError, RateLimitError } from '../src/lib/errors';

try {
  const response = await service.send('...');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle auth error
  } else if (error instanceof RateLimitError) {
    // Handle rate limit
  }
}
```

## Tips

1. **Monitor Token Usage**: Always check `response.usage` to track API consumption
2. **Use Retry Logic**: Implement exponential backoff for production applications
3. **Validate Input**: Always sanitize user input before sending to the API
4. **Error Handling**: Handle specific error types appropriately
5. **Environment Variables**: Never commit API keys to version control

## Need Help?

- Check the main documentation: `GROQ_SERVICE_USAGE.md`
- Review error types: `src/lib/errors.ts`
- Check type definitions: `src/types.ts`

## Contributing

Feel free to add more examples! Follow the existing pattern:
1. Create a new `.ts` file in this directory
2. Add comprehensive comments
3. Include error handling
4. Update this README with a description

