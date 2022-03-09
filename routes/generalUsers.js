const { Router } = require('express');
const { pool } = require('../server/db');
const { isNumeric, keysToCamel } = require('./utils');

const router = Router();

// get a general user by id
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    isNumeric(userId, 'User Id must be a Number');
    const user = await pool.query(`SELECT * FROM general_user WHERE user_id = $1;`, [userId]);
    res.status(200).send(keysToCamel(user.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all general users
router.get('/', async (req, res) => {
  try {
    const user = await pool.query(`SELECT * FROM general_user;`);
    res.status(200).json(keysToCamel(user.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// add a general user
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, title } = req.body;
    isNumeric(phoneNumber, 'Invalid Phone Number');
    const newUser = await pool.query(
      `INSERT INTO general_user (first_name, last_name, phone_number, email, title)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;`,
      [firstName, lastName, phoneNumber, email, title],
    );
    res.status(200).send(keysToCamel(newUser.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a general user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    isNumeric(userId, 'User Id must be a Number');
    const { firstName, lastName, phoneNumber, email, title } = req.body;
    isNumeric(phoneNumber, 'Invalid Phone Number');
    const updatedUser = await pool.query(
      `UPDATE general_user
      SET first_name = $1, last_name = $2,
          phone_number = $3, email = $4, title = $5
      WHERE user_id = $6
      RETURNING *;`,
      [firstName, lastName, phoneNumber, email, title, userId],
    );
    res.status(200).send(keysToCamel(updatedUser.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete a general user
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    isNumeric(userId, 'User Id must be a Number');
    const deletedUser = await pool.query(
      `DELETE FROM general_user WHERE user_id = $1 RETURNING *;`,
      [userId],
    );
    res.status(200).send(keysToCamel(deletedUser.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
