# Groq Service - Quick Reference

## 🚀 Quick Start

```typescript
import { createGroqService } from './lib/services/groqService';

const service = createGroqService();
const response = await service.send('Your prompt here');
console.log(response.data);
```

## 📦 Installation

Already installed! Check `package.json` for `groq-sdk`.

## 🔑 Environment Setup

Add to `.env.local`:
```env
GROQ_API_KEY=your-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile  # Optional
```

## 🎯 Common Use Cases

### 1. Simple Text Generation

```typescript
const response = await service.send('Write a haiku about coding');
console.log(response.data);
```

### 2. Structured JSON Output

```typescript
const schema = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'Answer',
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

const response = await service.send('What is 2+2?', { 
  responseFormat: schema 
});
console.log(response.data.answer); // "4"
```

### 3. Generate Flashcards

```typescript
const response = await service.send<{ flashcards: Flashcard[] }>(
  'Generate 5 flashcards about TypeScript',
  {
    systemMessage: 'You are an expert educator.',
    responseFormat: flashcardSchema,
    params: { temperature: 0.7, maxTokens: 2000 }
  }
);
```

### 4. Custom Parameters

```typescript
const response = await service.send('Be creative!', {
  params: {
    temperature: 0.9,      // More creative (0.0-1.0)
    maxTokens: 500,        // Shorter response
    topP: 0.95,            // Nucleus sampling
  }
});
```

## 🔧 API Reference

### Constructor

```typescript
new GroqService({
  apiKey: string,           // Required
  baseUrl?: string,         // Optional
  defaultModel?: string,    // Optional
  defaultParams?: ModelParams  // Optional
})
```

### Methods

#### `send<T>(message, options?)`
```typescript
await service.send<T>(
  userMessage: string,
  {
    systemMessage?: string,
    responseFormat?: ResponseFormat,
    model?: string,
    params?: ModelParams
  }
): Promise<GroqResponse<T>>
```

#### `setDefaultModel(model)`
```typescript
service.setDefaultModel('llama2-70b-4096');
```

#### `setDefaultParams(params)`
```typescript
service.setDefaultParams({
  temperature: 0.5,
  maxTokens: 1024
});
```

## 🛡️ Error Handling

```typescript
import {
  AuthenticationError,
  RateLimitError,
  ValidationError
} from './lib/errors';

try {
  const response = await service.send('...');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid API key
  } else if (error instanceof RateLimitError) {
    // Too many requests
  } else if (error instanceof ValidationError) {
    // Invalid input/output
  }
}
```

## 📊 Response Structure

```typescript
interface GroqResponse<T> {
  data: T;                    // Parsed response
  raw: Record<string, unknown>;  // Raw API response
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

## 🎨 Available Models

| Model | Context | Best For |
|-------|---------|----------|
| `llama-3.3-70b-versatile` | 128K | General purpose (default) |
| `llama2-70b-4096` | 4K | High accuracy |
| `gemma-7b-it` | varies | Fast responses |

## ⚙️ Parameters

```typescript
interface ModelParams {
  temperature?: number;        // 0.0 = deterministic, 1.0 = creative
  maxTokens?: number;          // Max response length
  topP?: number;               // Nucleus sampling (0.0-1.0)
  frequencyPenalty?: number;   // Reduce repetition (-2.0 to 2.0)
  presencePenalty?: number;    // Encourage new topics (-2.0 to 2.0)
  stop?: string[];             // Stop sequences
}
```

## 💡 Best Practices

✅ **DO:**
- Use environment variables for API keys
- Validate input before sending
- Use structured output (JSON schema) when possible
- Monitor token usage (`response.usage`)
- Implement retry logic for rate limits
- Handle errors appropriately

❌ **DON'T:**
- Hardcode API keys in code
- Send extremely long inputs without validation
- Ignore error handling
- Trust unvalidated user input
- Forget to sanitize input

## 🔄 Retry Pattern

```typescript
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (error instanceof RateLimitError) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Retry failed');
}

// Usage
const response = await withRetry(() => 
  service.send('Generate flashcards')
);
```

## 🌐 API Route Example

```typescript
// src/pages/api/generate.ts
import type { APIRoute } from 'astro';
import { createGroqService } from '../../lib/services/groqService';

export const POST: APIRoute = async ({ request }) => {
  const { topic } = await request.json();
  const service = createGroqService();
  
  const response = await service.send(`Generate flashcards: ${topic}`);
  
  return new Response(JSON.stringify(response.data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## 📚 Resources

- **Full Documentation**: `GROQ_SERVICE_USAGE.md`
- **Implementation Summary**: `GROQ_SERVICE_IMPLEMENTATION_SUMMARY.md`
- **Examples**: `examples/` directory
- **Groq Docs**: https://console.groq.com/docs

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Authentication failed" | Check `GROQ_API_KEY` in `.env.local` |
| "Rate limit exceeded" | Implement retry with backoff |
| "Invalid JSON" | Use `responseFormat` with schema |
| "Request timeout" | Reduce `maxTokens` or simplify prompt |

## 📝 Type Definitions

All types are in `src/types.ts`:
- `ModelParams`
- `ResponseFormat`
- `GroqServiceOptions`
- `GroqResponse<T>`
- `ApiMessage`

## 🔐 Security Checklist

- [ ] API key in environment variables
- [ ] Input validation and sanitization
- [ ] Error messages don't leak sensitive data
- [ ] Rate limiting implemented
- [ ] Logs don't contain API keys
- [ ] HTTPS enabled (via Groq SDK)

## 📞 Support

Need help? Check:
1. Error message and type
2. This quick reference
3. Full documentation (`GROQ_SERVICE_USAGE.md`)
4. Examples directory
5. Groq API status (https://status.groq.com)

---

**Last Updated**: 2025-10-17  
**Version**: 1.0.0

