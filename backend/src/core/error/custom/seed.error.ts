import BaseCustomError from "./base.error.js";

interface SeedingMetadata {
  [key: string]: unknown;
}

class SeedingError extends BaseCustomError {
  statusCode = 500;

  constructor(
    message: string,
    public phase: string | null = null,
    public metadata: SeedingMetadata = {}
  ) {
    super(message);
  }

  withPhase(phase: string | null): this {
    this.phase = phase;
    return this;
  }

  withMetadata(metadata: SeedingMetadata): this {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      phase: this.phase,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

export default SeedingError;
