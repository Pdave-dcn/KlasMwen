import BaseCustomError from "./base.error.js";

class FileUploadError extends BaseCustomError {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
  }
}

export default FileUploadError;
