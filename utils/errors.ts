export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class PATError extends Error {
  errorType: "missing" | "invalid";
  constructor(message: string, errorType: "missing" | "invalid") {
    super(message);
    this.errorType = errorType;
    this.name = "PATError";
  }
}
