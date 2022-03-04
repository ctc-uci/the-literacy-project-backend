const isNumeric = (value, errorMessage) => {
  if (!/^\d+$/.test(value)) {
    throw new Error(errorMessage);
  }
};

const isBoolean = (value, errorMessage) => {
  if (value !== 'true' && value !== 'false') {
    throw new Error(errorMessage);
  }
};

const isZipCode = (value, errorMessage) => {
  if (!/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(value)) {
    throw new Error(errorMessage);
  }
};

const isAlphaNumeric = (value, errorMessage) => {
  if (!/^[0-9a-zA-Z]+$/.test(value)) {
    throw new Error(errorMessage);
  }
};

const isPhoneNumber = (value, errorMessage) => {
  if (!/^\d+$/.test(value) || value.length !== 9) {
    throw new Error(errorMessage);
  }
};

// const snakeToCamel = ()

module.exports = { isNumeric, isBoolean, isZipCode, isAlphaNumeric, isPhoneNumber };
