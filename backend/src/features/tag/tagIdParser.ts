/**
 * Parses a string representation of a tag ID into a positive integer.
 * Returns null if the string cannot be parsed into a valid positive integer.
 *
 * Validation rules:
 * - Must be a valid integer (no decimals, letters, or special characters)
 * - Must be a positive number (greater than 0)
 * - Leading/trailing whitespace is trimmed
 * - Leading zeros are allowed (e.g., "0001" -> 1)
 *
 * @param {string} id - The string containing the tag ID to parse.
 * @return {(number | null)} The parsed positive integer ID, or null if parsing fails.
 *
 * @example
 * parseTagId("123")      // 123
 * parseTagId("0001")     // 1
 * parseTagId(" 42 ")     // 42
 * parseTagId("")         // null
 * parseTagId("0")        // null (not positive)
 * parseTagId("-5")       // null (not positive)
 * parseTagId("1.5")      // null (not an integer)
 * parseTagId("123abc")   // null (contains non-numeric characters)
 * parseTagId("abc")      // null (not a number)
 */
const parseTagId = (id: string): number | null => {
  const trimmedId = id.trim();

  if (trimmedId === "") {
    return null;
  }

  // This regex ensures:
  // - Optional leading zeros
  // - At least one digit
  // - No decimals, letters, or special characters
  const integerPattern = /^[0-9]+$/;
  if (!integerPattern.test(trimmedId)) {
    return null;
  }

  const tagId = parseInt(trimmedId, 10);

  // Verify it's a valid positive integer
  // Catches edge cases like Number.MAX_SAFE_INTEGER overflow
  if (isNaN(tagId) || tagId <= 0 || !Number.isSafeInteger(tagId)) {
    return null;
  }

  return tagId;
};

export default parseTagId;
