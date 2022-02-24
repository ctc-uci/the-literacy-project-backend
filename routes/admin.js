const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// Returns all admins (first name, last name, phone number, email, active status)
router.get('', async (req, res) => {
  try {
    const allAdmins = await pool.query(
      "SELECT genUser.first_name, genUser.last_name, genUser.phone_number, genUser.email, adminUser.active FROM (SELECT * FROM tlp_user WHERE position = 'admin') AS adminUser INNER JOIN general_user AS genUser ON adminUser.user_id=genUser.user_id",
    );
    res.json(allAdmins.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// to be updated with auth
// creates admin with information in both general_user and tlp_user tables
// id parameter is admin's firebase UID
// Returns status 200 for successful creation
router.post('', async (req, res) => {
  try {
    const { firebaseId, firstName, lastName, phoneNumber, email, active } = req.body;
    // const { userId, firebaseId, active } = req.body;
    const admin = await pool.query(
      'INSERT INTO general_user(first_name, last_name, phone_number, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [firstName, lastName, phoneNumber, email],
    );

    const newAdmin = await pool.query('INSERT INTO tlp_user VALUES ($1, $2, $3, $4) RETURNING *', [
      admin.rows[0].user_id,
      firebaseId,
      'admin',
      active,
    ]);
    res.status(200).send(newAdmin.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// id parameter is admin's firebase UID
// Returns specified admin (first name, last name, phone number, email, active status)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const selectedAdmin = await pool.query(
      "SELECT genUser.first_name, genUser.last_name, genUser.phone_number, genUser.email, adminUser.active FROM (SELECT * FROM tlp_user WHERE position = 'admin' AND firebase_id = $1) AS adminUser INNER JOIN general_user AS genUser ON adminUser.user_id=genUser.user_id",
      [id],
    );
    res.json(selectedAdmin.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// updates the admin information in both general_user and tlp_user tables
// id parameter is admin's firebase UID
// Returns status 200 for successful update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, email, active } = req.body;
    const admin = await pool.query(
      "UPDATE tlp_user SET active = $2 WHERE firebase_id = $1 AND position = 'admin' RETURNING *",
      [id, active],
    );
    await pool.query(
      'UPDATE general_user SET first_name = $2, last_name = $3, phone_number = $4, email = $5 WHERE user_id = $1',
      [admin.rows[0].user_id, firstName, lastName, phoneNumber, email],
    );
    res.status(200).send(`Successfully updated admin: ${id}`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// id parameter is admin's firebase UID
// Returns status 200 for successful deletion
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await pool.query(
      "SELECT tlp_user.user_id FROM tlp_user WHERE firebase_id = $1 AND position = 'admin'",
      [id],
    );
    await pool.query('DELETE FROM general_user WHERE user_id = $1', [userId.rows[0].user_id]);
    res.status(200).send(`Successfully removed admin: ${id}`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
