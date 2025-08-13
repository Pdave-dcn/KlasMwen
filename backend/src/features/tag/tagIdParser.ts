/**
 * Parses a string representation of a tag ID into a number.
 * Returns null if the string cannot be parsed into a valid integer.
 * @param {string} id - The string containing the tag ID to parse.
 * @return {(number | null)} The parsed integer ID, or null if parsing fails.
 */
const parseTagId = (id: string): number | null => {
  const tagId = parseInt(id);
  return isNaN(tagId) ? null : tagId;
};

export default parseTagId;
