class AuthErrorHandler {
  // Handle JWT Errors
  static handleJWTError(error: Error) {
    console.error("JWT Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return {
        status: 401,
        response: {
          message: "Token has expired. Please log in again.",
        },
      };
    }
    if (error.name === "JsonWebTokenError") {
      return {
        status: 401,
        response: {
          message: "Invalid token. Please log in again.",
        },
      };
    }
    if (error.name === "NotBeforeError") {
      return {
        status: 401,
        response: {
          message: "Token not active yet.",
        },
      };
    }
    return {
      status: 401,
      response: {
        message: "Authentication failed.",
      },
    };
  }

  // Handle bcrypt errors
  static handleBcryptError(error: Error) {
    console.error("Bcrypt Error:", error.message);
    return {
      status: 500,
      response: {
        message: "Password processing error.",
      },
    };
  }
}

export default AuthErrorHandler;
