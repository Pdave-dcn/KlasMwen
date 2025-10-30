/* eslint-disable */
import { handleError } from "../index.js";

/**
 * Abstract base class for all custom application errors.
 *
 * Extends the native JavaScript Error class to provide a foundation for creating
 * domain-specific error types with associated HTTP status codes. All custom errors
 * in the application should extend this class to ensure consistent error handling
 * and proper integration with the central error handler.
 *
 * @remarks
 * This class enforces two key requirements for all custom errors:
 * 1. Every custom error must define an HTTP status code via the `statusCode` property
 * 2. Every custom error automatically sets its `name` property to the class name
 *
 * The class is abstract and cannot be instantiated directly. Instead, create concrete
 * error classes that extend it and implement the required `statusCode` property.
 *
 * Custom errors created from this base class are automatically handled by the
 * {@link handleError} function, which uses the statusCode to set the HTTP response
 * status and the message for the response body.
 *
 * @abstract
 * @class BaseCustomError
 * @extends {Error}
 *
 * @property {number} statusCode - HTTP status code to return when this error is thrown.
 *                                  Must be implemented by concrete subclasses.
 * @property {string} name - The name of the error class (automatically set to constructor name)
 * @property {string} message - Human-readable error message (inherited from Error)
 *
 * @example
 * // Creating a custom error class
 * class UserNotFoundError extends BaseCustomError {
 *   statusCode = 404;
 *
 *   constructor(userId: string) {
 *     super(`User with ID "${userId}" not found`);
 *   }
 * }
 *
 * @example
 * // Using the custom error in a controller
 * const user = await prisma.user.findUnique({ where: { id: userId } });
 * if (!user) {
 *   throw new UserNotFoundError(userId);
 * }
 *
 * @example
 * // Creating an error with dynamic status codes
 * class ValidationError extends BaseCustomError {
 *   statusCode = 400;
 *
 *   constructor(field: string, reason: string) {
 *     super(`Validation failed for ${field}: ${reason}`);
 *   }
 * }
 *
 * @see {@link handleError} for how these errors are processed
 */
abstract class BaseCustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export default BaseCustomError;
