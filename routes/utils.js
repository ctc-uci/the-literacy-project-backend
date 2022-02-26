const isNumeric = (value) => {
  return /^\d+$/.test(value);
};

const isBoolean = (value) => {
  return value === 'true' || value === 'false';
};

module.exports = { isNumeric, isBoolean };
