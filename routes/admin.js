const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// to be updated with auth
// creates admin with information in both general_user and tlp_user tables
// Returns admin's info from general_user table
router.post('', async (req, res) => {
  try {
    const { firebaseId, firstName, lastName, phoneNumber, email, active } = req.body;
    const admin = await pool.query(
      'INSERT INTO general_user(first_name, last_name, phone_number, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [firstName, lastName, phoneNumber, email],
    );

    await pool.query('INSERT INTO tlp_user VALUES ($1, $2, $3, $4)', [
      admin.rows[0].user_id,
      firebaseId,
      'admin',
      active,
    ]);
    res.status(200).send(admin.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Returns all admins (user_id, first name, last name, phone number, email, active status)
router.get('', async (req, res) => {
  try {
    const allAdmins = await pool.query(
      "SELECT genUser.user_id, genUser.first_name, genUser.last_name, genUser.phone_number, genUser.email, adminUser.active FROM (SELECT * FROM tlp_user WHERE position = 'admin') AS adminUser INNER JOIN general_user AS genUser ON adminUser.user_id=genUser.user_id",
    );
    res.json(allAdmins.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// id parameter is admin's user_id
// Returns specified admin (first name, last name, phone number, email, active status)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const selectedAdmin = await pool.query(
      "SELECT genUser.first_name, genUser.last_name, genUser.phone_number, genUser.email, adminUser.active FROM (SELECT * FROM tlp_user WHERE position = 'admin' AND user_id = $1) AS adminUser INNER JOIN general_user AS genUser ON adminUser.user_id=genUser.user_id",
      [id],
    );
    res.json(selectedAdmin.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// updates the admin information in both general_user and tlp_user tables
// id parameter is admin's user_id
// Returns status 200 for successful update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, email, active } = req.body;
    await pool.query(
      'UPDATE general_user SET first_name = $1, last_name = $2, phone_number = $3, email = $4 WHERE user_id = $5',
      [firstName, lastName, phoneNumber, email, id],
    );
    await pool.query("UPDATE tlp_user SET active = $1 WHERE user_id = $2 AND position = 'admin'", [
      active,
      id,
    ]);
    res.status(200).send(`Successfully updated admin: ${id}`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// id parameter is admin's user_id
// Returns status 200 for successful deletion
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM general_user WHERE user_id = $1', [id]);
    res.status(200).send(`Successfully removed admin: ${id}`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
