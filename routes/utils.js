const { pool } = require('../server/db');

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
  if (!/^\d+$/.test(value) || value.length !== 10) {
    throw new Error(errorMessage);
  }
};

const toCamel = (s) => {
  return s.replace(/([-_][a-z])/g, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
};

const isArray = (a) => {
  return Array.isArray(a);
};

const isObject = (o) => {
  return o === Object(o) && !isArray(o) && typeof o !== 'function';
};

const keysToCamel = (data) => {
  if (isObject(data)) {
    const newData = {};
    Object.keys(data).forEach((key) => {
      newData[toCamel(key)] = keysToCamel(data[key]);
    });
    return newData;
  }
  if (isArray(data)) {
    return data.map((i) => {
      return keysToCamel(i);
    });
  }
  return data;
};

const addContact = async (contactInfo) => {
  const id = await pool.query(
    `INSERT INTO general_user
    (first_name, last_name, phone_number, email, title)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      contactInfo.firstName,
      contactInfo.lastName,
      contactInfo.phoneNumber,
      contactInfo.email,
      contactInfo.title,
    ],
  );
  return id.rows[0].user_id;
};

module.exports = {
  isNumeric,
  isBoolean,
  isZipCode,
  isAlphaNumeric,
  isPhoneNumber,
  keysToCamel,
  addContact,
};
