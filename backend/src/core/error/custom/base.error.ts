abstract class BaseCustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export default BaseCustomError;
