/**
 * Utility helper to safely parse IDs for both SQLite (integer) and MongoDB (ObjectId string)
 *
 * @param {string|number|null|undefined} val
 * @returns {string|number|null}
 */
const parseId = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  // MongoDB 24-character hexadecimal ObjectId
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return str;
  }
  // If it's a numeric integer string, parse as integer
  if (/^-?\d+$/.test(str)) {
    return parseInt(str, 10);
  }
  return str;
};

module.exports = { parseId };
