const { Router } = require('express');
const pool = require('../server/db');
const { isNumeric, isAlphaNumeric } = require('./utils');

const router = Router();

// to be updated with auth
// might not be needed
// creates admin with information in both general_user and tlp_user tables
// Returns admin's info from general_user table
router.post('/', async (req, res) => {
  try {
    const { firebaseId, firstName, lastName, phoneNumber, email } = req.body;
    isAlphaNumeric(firebaseId, 'Firebase ID must be AlphaNumeric');
    const admin = await pool.query(
      `INSERT INTO general_user(first_name, last_name, phone_number, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`,
      [firstName, lastName, phoneNumber, email],
    );
    const adminId = admin.rows[0].user_id;
    await pool.query('INSERT INTO tlp_user VALUES ($1, $2, $3, $4);', [
      adminId,
      firebaseId,
      'admin',
      'pending', // admin status is pending until email is verified
    ]);

    const addedAdmin = await pool.query(
      `SELECT genUser.first_name, genUser.last_name, genUser.phone_number, genUser.email, adminUser.active
      FROM (
        SELECT * FROM tlp_user
        WHERE position = 'admin' AND user_id = $1
        ) AS adminUser
      INNER JOIN general_user AS genUser
      ON adminUser.user_id=genUser.user_id;`,
      [adminId],
    );

    res.status(200).send(addedAdmin.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Returns all admins (user_id, first name, last name, phone number, email, active status)
router.get('/', async (req, res) => {
  try {
    const allAdmins = await pool.query(
      `SELECT genUser.user_id, genUser.first_name, genUser.last_name, genUser.phone_number, genUser.email, adminUser.active
      FROM (
        SELECT * FROM tlp_user
        WHERE position = 'admin'
        ) AS adminUser
      INNER JOIN general_user AS genUser
      ON adminUser.user_id=genUser.user_id;`,
    );
    res.status(200).send(allAdmins.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// id parameter is admin's user_id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    isNumeric(id, 'Id must be a Number');
    const selectedAdmin = await pool.query(
      `SELECT genUser.first_name, genUser.last_name, genUser.phone_number, genUser.email, adminUser.active
      FROM (
        SELECT * FROM tlp_user
        WHERE position = 'admin' AND user_id = $1
        ) AS adminUser
      INNER JOIN general_user AS genUser
      ON adminUser.user_id=genUser.user_id;`,
      [id],
    );
    res.status(200).send(selectedAdmin.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// updates the admin information in both general_user and tlp_user tables
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    isNumeric(id, 'Id must be a Number');
    const { firstName, lastName, phoneNumber, email, active } = req.body;
    await pool.query(
      `UPDATE general_user
      SET first_name = $1, last_name = $2, phone_number = $3, email = $4 WHERE user_id = $5;`,
      [firstName, lastName, phoneNumber, email, id],
    );
    await pool.query(
      `UPDATE tlp_user
      SET active = $1
      WHERE user_id = $2 AND position = 'admin';`,
      [active, id],
    );
    const updatedAdmin = await pool.query(
      `SELECT *
      FROM (
        SELECT * FROM tlp_user
        WHERE user_id = $1
        ) AS tlp_admin
      INNER JOIN general_user
      ON general_user.user_id = tlp_admin.user_id;`,
      [id],
    );
    res.status(200).send(updatedAdmin.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    isNumeric(id, 'Id must be a Number');
    const deletedAdmin = await pool.query(
      `DELETE FROM general_user WHERE user_id = $1
      RETURNING *;`,
      [id],
    );
    res.status(200).send(deletedAdmin.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
