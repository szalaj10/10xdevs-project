import Groq from "groq-sdk";
import type { GroqServiceOptions, ModelParams, ResponseFormat, GroqResponse, ApiMessage } from "../../types";
import {
  GroqError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NetworkError,
  ServerError,
  TimeoutError,
  InvalidFormatError,
} from "../errors";

/**
 * GroqService - Service for interacting with Groq API
 *
 * This service provides a clean interface for sending requests to Groq's language models,
 * with built-in error handling, response validation, and security features.
 *
 * @example
 * ```ts
 * const service = new GroqService({ apiKey: process.env.GROQ_API_KEY! });
 * const result = await service.send(
 *   'What is the meaning of life?',
 *   {
 *     systemMessage: 'You are a helpful assistant.',
 *     model: 'llama-3.3-70b-versatile',
 *     params: { temperature: 0.7, maxTokens: 150 }
 *   }
 * );
 * ```
 */
export class GroqService {
  private client: Groq;
  private defaultModel: string;
  private defaultParams: ModelParams;

  /**
   * Creates a new instance of GroqService
   *
   * @param options - Configuration options for the service
   * @throws {GroqError} If apiKey is not provided
   */
  constructor(options: GroqServiceOptions) {
    // Validate required options
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new GroqError("API key is required for GroqService");
    }

    // Initialize Groq client
    this.client = new Groq({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });

    // Set defaults
    this.defaultModel = options.defaultModel || "llama-3.3-70b-versatile";
    this.defaultParams = options.defaultParams || {
      temperature: 0.7,
      maxTokens: 2048,
    };
  }

  /**
   * Send a message to the Groq API
   *
   * @param userMessage - The user's message/prompt
   * @param options - Optional configuration for this request
   * @returns Promise resolving to the formatted response
   * @throws {AuthenticationError} When API key is invalid
   * @throws {RateLimitError} When rate limit is exceeded
   * @throws {ValidationError} When response validation fails
   * @throws {NetworkError} When network request fails
   * @throws {ServerError} When server returns 5xx error
   * @throws {TimeoutError} When request times out
   */
  async send<T = Record<string, unknown>>(
    userMessage: string,
    options?: {
      systemMessage?: string;
      responseFormat?: ResponseFormat;
      model?: string;
      params?: ModelParams;
    }
  ): Promise<GroqResponse<T>> {
    // Validate input
    if (!userMessage || userMessage.trim() === "") {
      throw new ValidationError("User message cannot be empty");
    }

    // Sanitize input to prevent injection attacks
    const sanitizedUserMessage = this.sanitizeInput(userMessage);
    const sanitizedSystemMessage = options?.systemMessage ? this.sanitizeInput(options.systemMessage) : undefined;

    try {
      // Build messages array
      const messages = this.buildMessages(sanitizedSystemMessage, sanitizedUserMessage);

      // Merge parameters with defaults
      const model = options?.model || this.defaultModel;
      const params = { ...this.defaultParams, ...options?.params };

      // Prepare request parameters
      const requestParams: Record<string, unknown> = {
        model,
        messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stop: params.stop,
      };

      // Add response format if specified
      if (options?.responseFormat) {
        this.validateResponseFormat(options.responseFormat);
        // For json_schema type, send the full schema structure
        if (options.responseFormat.type === "json_schema") {
          requestParams.response_format = {
            type: "json_schema",
            json_schema: options.responseFormat.json_schema,
          };
        } else {
          requestParams.response_format = {
            type: "json_object",
          };
        }
      }

      // Send request to Groq API
      const completion = await this.client.chat.completions.create(requestParams);

      // Format and validate response
      const response = await this.formatResponse<T>(completion, options?.responseFormat);

      return response;
    } catch (error) {
      // Handle and rethrow with appropriate error type
      this.handleError(error);
    }
  }

  /**
   * Set the default model for future requests
   *
   * @param model - The model identifier
   */
  setDefaultModel(model: string): void {
    if (!model || model.trim() === "") {
      throw new ValidationError("Model cannot be empty");
    }
    this.defaultModel = model;
  }

  /**
   * Set default parameters for future requests
   *
   * @param params - The default parameters
   */
  setDefaultParams(params: ModelParams): void {
    this.defaultParams = { ...this.defaultParams, ...params };
  }

  /**
   * Build messages array from system and user messages
   *
   * @private
   * @param systemMessage - Optional system message
   * @param userMessage - User message
   * @returns Array of formatted messages
   */
  private buildMessages(systemMessage: string | undefined, userMessage: string): ApiMessage[] {
    const messages: ApiMessage[] = [];

    // Add system message if provided
    if (systemMessage && systemMessage.trim() !== "") {
      messages.push({
        role: "system",
        content: systemMessage,
      });
    }

    // Add user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    return messages;
  }

  /**
   * Format and validate API response
   *
   * @private
   * @param raw - Raw response from Groq API
   * @param format - Optional response format for validation
   * @returns Formatted response
   * @throws {ValidationError} When response validation fails
   * @throws {InvalidFormatError} When response format is invalid
   */
  private async formatResponse<T>(raw: Record<string, unknown>, format?: ResponseFormat): Promise<GroqResponse<T>> {
    // Validate raw response structure
    if (!raw || !raw.choices || !Array.isArray(raw.choices) || raw.choices.length === 0) {
      throw new InvalidFormatError("Invalid response structure from API");
    }

    const choice = raw.choices[0] as Record<string, unknown>;
    const message = choice.message as Record<string, unknown>;
    if (!message || !message.content) {
      throw new InvalidFormatError("Missing message content in API response");
    }

    const content = message.content as string;

    // If response format is specified, parse and validate JSON
    let data: T;
    if (format) {
      try {
        data = JSON.parse(content) as T;

        // Validate against schema if strict mode is enabled (only for json_schema type)
        if (format.type === "json_schema" && format.json_schema.strict) {
          this.validateAgainstSchema(data, format.json_schema.schema);
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new InvalidFormatError("Response is not valid JSON", error);
        }
        throw error;
      }
    } else {
      // Return content as-is if no format specified
      data = content as T;
    }

    // Extract usage information
    const usageData = raw.usage as Record<string, unknown> | undefined;
    const usage = usageData
      ? {
          promptTokens: (usageData.prompt_tokens as number) || 0,
          completionTokens: (usageData.completion_tokens as number) || 0,
          totalTokens: (usageData.total_tokens as number) || 0,
        }
      : undefined;

    return {
      data,
      raw,
      usage,
    };
  }

  /**
   * Validate response format structure
   *
   * @private
   * @param format - Response format to validate
   * @throws {ValidationError} When format is invalid
   */
  private validateResponseFormat(format: ResponseFormat): void {
    if (!format || !format.type) {
      throw new ValidationError("Invalid response format: type is required");
    }

    if (format.type !== "json_schema" && format.type !== "json_object") {
      throw new ValidationError('Invalid response format: type must be "json_schema" or "json_object"');
    }

    // Validate json_schema specific fields
    if (format.type === "json_schema") {
      if (!format.json_schema) {
        throw new ValidationError("Invalid response format: json_schema is required");
      }

      if (!format.json_schema.name || typeof format.json_schema.name !== "string") {
        throw new ValidationError("Invalid response format: json_schema.name is required and must be a string");
      }

      if (typeof format.json_schema.strict !== "boolean") {
        throw new ValidationError("Invalid response format: json_schema.strict is required and must be a boolean");
      }

      if (!format.json_schema.schema || typeof format.json_schema.schema !== "object") {
        throw new ValidationError("Invalid response format: json_schema.schema is required and must be an object");
      }
    }
  }

  /**
   * Validate data against JSON schema
   *
   * @private
   * @param data - Data to validate
   * @param schema - JSON schema
   * @throws {ValidationError} When validation fails
   */
  private validateAgainstSchema(data: unknown, schema: object): void {
    // Basic schema validation (can be enhanced with Ajv or similar library)
    if (!data || typeof data !== "object") {
      throw new ValidationError("Response data does not match expected schema: must be an object");
    }

    // Get expected properties from schema
    const schemaObj = schema as Record<string, unknown>;
    if (schemaObj.required && Array.isArray(schemaObj.required)) {
      const dataObj = data as Record<string, unknown>;
      const missingProps = schemaObj.required.filter((prop: unknown) => {
        if (typeof prop === "string") {
          return !(prop in dataObj);
        }
        return false;
      });
      if (missingProps.length > 0) {
        throw new ValidationError(
          `Response data does not match expected schema: missing required properties: ${missingProps.join(", ")}`
        );
      }
    }
  }

  /**
   * Sanitize user input to prevent injection attacks
   *
   * @private
   * @param input - Input string to sanitize
   * @returns Sanitized input
   */
  private sanitizeInput(input: string): string {
    // Remove control characters except newlines and tabs
    // eslint-disable-next-line no-control-regex
    let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

    // Limit maximum length to prevent abuse
    const maxLength = 50000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Handle errors and throw appropriate error types
   *
   * @private
   * @param error - Original error
   * @throws Appropriate error type based on error details
   */
  private handleError(error: unknown): never {
    // If already a GroqError, just rethrow
    if (error instanceof GroqError) {
      throw error;
    }

    // Type guard for error objects
    const errorObj = error as Record<string, unknown>;

    // Handle Groq SDK errors
    if (errorObj?.status || errorObj?.statusCode) {
      const status = (errorObj.status || errorObj.statusCode) as number;
      const errorDetails = errorObj.error as Record<string, unknown> | undefined;
      const message = (errorObj?.message as string) || (errorDetails?.message as string) || "An error occurred";

      switch (status) {
        case 401:
        case 403:
          throw new AuthenticationError(message, error);
        case 429:
          throw new RateLimitError(message, error);
        case 408:
          throw new TimeoutError(message, error);
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServerError(message, status, error);
        default:
          throw new GroqError(message, status, error);
      }
    }

    // Handle network errors
    if (errorObj?.code === "ECONNREFUSED" || errorObj?.code === "ENOTFOUND" || errorObj?.code === "ETIMEDOUT") {
      throw new NetworkError("Network connection failed. Please check your internet connection.", error);
    }

    // Handle timeout errors
    if (errorObj?.code === "ETIMEDOUT" || errorObj?.name === "TimeoutError") {
      throw new TimeoutError("Request timed out. Please try again.", error);
    }

    // Default error
    const message = (errorObj?.message as string) || "An unexpected error occurred";
    throw new GroqError(message, undefined, error);
  }
}

/**
 * Create a GroqService instance with environment variables
 *
 * @returns GroqService instance
 * @throws {GroqError} If required environment variables are missing
 */
export function createGroqService(): GroqService {
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new GroqError("GROQ_API_KEY environment variable is required");
  }

  return new GroqService({
    apiKey,
    defaultModel: import.meta.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    defaultParams: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  });
}
