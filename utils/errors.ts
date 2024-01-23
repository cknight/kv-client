export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class CacheInvalidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CacheInvalidationError";
  }
}