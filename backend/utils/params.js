function parseBoundedInt(value, { defaultValue, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

module.exports = { parseBoundedInt };

