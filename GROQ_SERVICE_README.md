# Groq Service Documentation

Welcome to the Groq Service implementation! This service provides a robust, type-safe interface for interacting with Groq's AI API in your Astro application.

## 📚 Documentation Index

Choose the document that best fits your needs:

### For Developers

1. **[Quick Reference](GROQ_SERVICE_QUICK_REFERENCE.md)** ⚡
   - Start here for immediate usage
   - Common patterns and code snippets
   - API reference at a glance
   - Best for: Experienced developers who want to get started quickly

2. **[Complete Usage Guide](GROQ_SERVICE_USAGE.md)** 📖
   - Comprehensive documentation
   - Detailed examples and explanations
   - Best practices and patterns
   - Troubleshooting guide
   - Best for: Learning the service in depth

3. **[Examples Directory](examples/)** 💡
   - Working code examples
   - Flashcard generation demo
   - API route integration
   - Best for: Learning by example

### For Project Management

4. **[Implementation Summary](GROQ_SERVICE_IMPLEMENTATION_SUMMARY.md)** 📋
   - What was implemented
   - How it works
   - Technical details
   - Best for: Understanding the implementation

5. **[Implementation Checklist](GROQ_IMPLEMENTATION_CHECKLIST.md)** ✅
   - Verification of completeness
   - Compliance with requirements
   - Statistics and metrics
   - Best for: Verifying implementation quality

## 🚀 Quick Start (30 seconds)

### 1. Set up environment variables

Create `.env.local`:
```env
GROQ_API_KEY=your-api-key-here
```

Get your API key at: https://console.groq.com/keys

### 2. Use in your code

```typescript
import { createGroqService } from './lib/services/groqService';

const service = createGroqService();
const response = await service.send('Write a haiku about coding');
console.log(response.data);
```

That's it! 🎉

## 📦 What's Included

### Core Files
- `src/lib/services/groqService.ts` - Main service class
- `src/lib/errors.ts` - Error classes
- `src/types.ts` - TypeScript types (extended)
- `src/env.d.ts` - Environment type definitions (extended)

### Documentation
- `GROQ_SERVICE_QUICK_REFERENCE.md` - Quick reference guide
- `GROQ_SERVICE_USAGE.md` - Complete usage documentation
- `GROQ_SERVICE_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `GROQ_IMPLEMENTATION_CHECKLIST.md` - Verification checklist
- `examples/README.md` - Examples documentation

### Examples
- `examples/groq-usage-example.ts` - Flashcard generation
- `examples/api-integration-example.ts` - API routes integration

## 🎯 Common Use Cases

### Generate Flashcards
```typescript
const response = await service.send<{ flashcards: Flashcard[] }>(
  'Generate 5 flashcards about TypeScript',
  {
    systemMessage: 'You are an expert educator.',
    responseFormat: flashcardSchema,
    params: { temperature: 0.7 }
  }
);
```

### Ask Questions
```typescript
const response = await service.send(
  'Explain quantum computing in simple terms',
  {
    params: { temperature: 0.5, maxTokens: 500 }
  }
);
```

### Structured Data
```typescript
const schema = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'Response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

const response = await service.send('Summarize...', { responseFormat: schema });
```

## 🔧 Configuration

### Environment Variables

```env
# Required
GROQ_API_KEY=your-api-key-here

# Optional
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### Available Models

| Model | Context | Best For |
|-------|---------|----------|
| `llama-3.3-70b-versatile` | 128K tokens | General purpose (default) |
| `llama2-70b-4096` | 4K tokens | High accuracy tasks |
| `gemma-7b-it` | Varies | Fast responses |

## 🛡️ Error Handling

The service provides specific error types:

```typescript
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NetworkError,
  ServerError,
  TimeoutError
} from './lib/errors';

try {
  const response = await service.send('...');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle invalid API key
  } else if (error instanceof RateLimitError) {
    // Implement retry with backoff
  } else if (error instanceof ValidationError) {
    // Handle invalid input/output
  }
}
```

## 💡 Best Practices

### ✅ DO

- Store API keys in environment variables
- Validate user input before sending
- Use structured output (JSON schema) for predictable responses
- Monitor token usage with `response.usage`
- Implement retry logic for rate limits
- Handle errors appropriately

### ❌ DON'T

- Hardcode API keys in source code
- Send unvalidated user input directly
- Ignore error handling
- Forget to check token limits
- Log sensitive data or API keys

## 🧪 Testing

### Manual Testing
```bash
npm run dev
# Navigate to test page
```

### With Examples
```typescript
import { generateFlashcards } from '../examples/groq-usage-example';

const flashcards = await generateFlashcards('Machine Learning');
console.log(flashcards);
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Authentication failed" | Check `GROQ_API_KEY` in `.env.local` |
| "Rate limit exceeded" | Implement exponential backoff retry |
| "Invalid JSON response" | Use `responseFormat` with JSON schema |
| "Request timeout" | Reduce `maxTokens` or simplify prompt |
| No response from API | Check Groq status: https://status.groq.com |

## 📊 Features

- ✅ Type-safe TypeScript implementation
- ✅ Comprehensive error handling
- ✅ Input sanitization & validation
- ✅ Structured JSON output support
- ✅ Token usage tracking
- ✅ Customizable parameters
- ✅ Multiple model support
- ✅ Production-ready
- ✅ Fully documented
- ✅ Zero dependencies (except groq-sdk)

## 🔗 Links

- **Groq Console**: https://console.groq.com
- **Groq Documentation**: https://console.groq.com/docs
- **API Status**: https://status.groq.com
- **Get API Key**: https://console.groq.com/keys

## 📄 License

This implementation follows your project's license.

## 🙋 Support

Having issues? Check:
1. Error message and type
2. [Quick Reference](GROQ_SERVICE_QUICK_REFERENCE.md)
3. [Usage Guide](GROQ_SERVICE_USAGE.md)
4. [Examples](examples/)
5. Groq API status

## 🎓 Learning Path

### Beginner
1. Read [Quick Reference](GROQ_SERVICE_QUICK_REFERENCE.md)
2. Try basic example: `examples/groq-usage-example.ts`
3. Integrate into your code

### Intermediate
1. Read [Complete Usage Guide](GROQ_SERVICE_USAGE.MD)
2. Explore API integration: `examples/api-integration-example.ts`
3. Implement error handling and retry logic

### Advanced
1. Review [Implementation Summary](GROQ_SERVICE_IMPLEMENTATION_SUMMARY.md)
2. Customize service for specific needs
3. Add monitoring and analytics

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set `GROQ_API_KEY` in production environment
- [ ] Configure rate limiting
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Implement request logging
- [ ] Test error scenarios
- [ ] Set up alerting for API failures
- [ ] Monitor token usage and costs
- [ ] Review security settings

## 📝 Changelog

### Version 1.0.0 (2025-10-17)
- Initial implementation
- Complete GroqService class
- 8 error types
- Full documentation
- Working examples
- Production-ready

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-10-17

Need help? Start with the [Quick Reference](GROQ_SERVICE_QUICK_REFERENCE.md)! 🚀

