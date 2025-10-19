/**
 * Base error class for Groq service errors
 */
export class GroqError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "GroqError";
    Object.setPrototypeOf(this, GroqError.prototype);
  }
}

/**
 * Error thrown when authentication fails (401)
 */
export class AuthenticationError extends GroqError {
  constructor(message = "Authentication failed. Please check your API key.", originalError?: unknown) {
    super(message, 401, originalError);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when rate limit is exceeded (429)
 */
export class RateLimitError extends GroqError {
  constructor(message = "Rate limit exceeded. Please try again later.", originalError?: unknown) {
    super(message, 429, originalError);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error thrown when response validation fails
 */
export class ValidationError extends GroqError {
  constructor(
    message = "Response validation failed.",
    public readonly validationErrors?: unknown[],
    originalError?: unknown
  ) {
    super(message, undefined, originalError);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends GroqError {
  constructor(message = "Network request failed. Please check your connection.", originalError?: unknown) {
    super(message, undefined, originalError);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown when API returns a server error (5xx)
 */
export class ServerError extends GroqError {
  constructor(
    message = "Server error occurred. Please try again later.",
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message, statusCode, originalError);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error thrown when request times out
 */
export class TimeoutError extends GroqError {
  constructor(message = "Request timed out. Please try again.", originalError?: unknown) {
    super(message, 408, originalError);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when response format is invalid
 */
export class InvalidFormatError extends GroqError {
  constructor(message = "Invalid response format.", originalError?: unknown) {
    super(message, undefined, originalError);
    this.name = "InvalidFormatError";
    Object.setPrototypeOf(this, InvalidFormatError.prototype);
  }
}

/**
 * Generic API error with HTTP status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
