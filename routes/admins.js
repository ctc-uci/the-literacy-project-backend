const { Router } = require('express');
const { pool } = require('../server/db');
const { isNumeric, isAlphaNumeric, isPhoneNumber, keysToCamel } = require('./utils');

const router = Router();

const getAdmins = (allAdmins) =>
  `SELECT tlp_user.*, gen.first_name, gen.last_name, gen.phone_number, gen.email
  FROM tlp_user
    INNER JOIN
      (SELECT * FROM general_user ${allAdmins ? '' : 'WHERE general_user.user_id = $1'})
      AS gen ON gen.user_id = tlp_user.user_id
  WHERE position = 'admin';`;

// get admin by id
router.get('/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    isNumeric(adminId, 'Admin Id must be a Number');
    const admin = await pool.query(getAdmins(false), [adminId]);
    res.status(200).send(keysToCamel(admin.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all admin
router.get('/', async (req, res) => {
  try {
    const allAdmins = await pool.query(getAdmins(true));
    res.status(200).json(keysToCamel(allAdmins.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create an admin
router.post('/', async (req, res) => {
  try {
    const { firebaseId, firstName, lastName, phoneNumber, email } = req.body;
    isAlphaNumeric(firebaseId, 'Firebase ID must be AlphaNumeric');
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    const admin = await pool.query(
      `INSERT INTO general_user (first_name, last_name, phone_number, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`,
      [firstName, lastName, phoneNumber, email],
    );
    await pool.query(
      `INSERT INTO tlp_user (user_id, firebase_id, position, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`,
      [
        admin.rows[0].user_id,
        firebaseId,
        'admin',
        'pending', // admin status is pending until email is verified
      ],
    );
    const addedAdmin = await pool.query(getAdmins(false), [admin.rows[0].user_id]);
    res.status(200).send(keysToCamel(addedAdmin.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// updates an admin
router.put('/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    isNumeric(adminId, 'Admin Id must be a Number');
    const { firstName, lastName, phoneNumber, email, active } = req.body;
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    // Updating relevant values in general_user table
    await pool.query(
      `UPDATE general_user
      SET first_name = $1, last_name = $2, phone_number = $3, email = $4
      WHERE user_id = $5`,
      [firstName, lastName, phoneNumber, email, adminId],
    );
    // Updating relevant values in tlp_user table
    await pool.query('UPDATE tlp_user SET active = $1 WHERE user_id = $2', [active, adminId]);
    const updatedTeacher = await pool.query(getAdmins(false), [adminId]);
    res.status(200).send(keysToCamel(updatedTeacher.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.delete('/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    isNumeric(adminId, 'Id must be a Number');
    const deletedAdmin = await pool.query(
      `DELETE FROM general_user WHERE user_id = $1
      RETURNING *;`,
      [adminId],
    );
    res.status(200).send(keysToCamel(deletedAdmin.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
