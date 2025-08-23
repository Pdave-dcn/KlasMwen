import BaseCustomError from "./base.error";

class AvatarServiceError extends BaseCustomError {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
  }
}

export { AvatarServiceError };
