const { Router } = require('express');
const { pool } = require('../server/db');
const { isNumeric, isAlphaNumeric, isPhoneNumber, keysToCamel } = require('./utils');

const router = Router();

const getTeachers = (allTeachers) =>
  `SELECT tlp_user.*, gen.first_name, gen.last_name, gen.phone_number, gen.email, relation.sites
  FROM tlp_user
    INNER JOIN
      (SELECT * FROM general_user ${allTeachers ? '' : 'WHERE general_user.user_id = $1'})
      AS gen ON gen.user_id = tlp_user.user_id
    LEFT JOIN (SELECT m.user_id, array_agg(m.site_id ORDER BY m.site_id ASC) AS sites
      FROM master_teacher_site_relation AS m
      GROUP BY m.user_id) AS relation ON relation.user_id = tlp_user.user_id
  WHERE position = 'master teacher';`;

// get a teacher by id
router.get('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    const teacher = await pool.query(getTeachers(false), [teacherId]);
    res.status(200).send(keysToCamel(teacher.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all teachers
router.get('/', async (req, res) => {
  try {
    const allTeachers = await pool.query(getTeachers(true));
    res.status(200).json(keysToCamel(allTeachers.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a teacher
router.post('/', async (req, res) => {
  try {
    const { firebaseId, firstName, lastName, phoneNumber, email } = req.body;
    isAlphaNumeric(firebaseId, 'Firebase Id must be alphanumberic');
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    const teacher = await pool.query(
      `INSERT INTO general_user (first_name, last_name, phone_number, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`,
      [firstName, lastName, phoneNumber, email],
    );

    await pool.query(
      `INSERT INTO tlp_user (user_id, firebase_id, position, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        teacher.rows[0].user_id,
        firebaseId, // replace with actual firebase id; unfortunately this dummy value means only one user will be able to be made for now
        'master teacher',
        'pending', // by default, master teachers will be initialized as pending since they need to activate their email
      ],
    );
    const addedTeacher = await pool.query(getTeachers(false), [teacher.rows[0].user_id]);
    res.status(200).send(keysToCamel(addedTeacher.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a teacher
router.put('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    const { firstName, lastName, phoneNumber, email, active } = req.body;
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    // Updating relevant values in general_user table
    await pool.query(
      `UPDATE general_user
      SET first_name = $1, last_name = $2, phone_number = $3, email = $4
      WHERE user_id = $5`,
      [firstName, lastName, phoneNumber, email, teacherId],
    );
    // Updating relevant values in tlp_user table
    await pool.query('UPDATE tlp_user SET active = $1 WHERE user_id = $2', [active, teacherId]);
    const updatedTeacher = await pool.query(getTeachers(false), [teacherId]);
    res.status(200).send(keysToCamel(updatedTeacher.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// add site for teacher
router.post('/add-site/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { siteId } = req.body;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    isNumeric(siteId, 'Site Id must be a Number');
    // Updating relevant values in tlp_user table
    const addedSite = await pool.query(
      `INSERT INTO master_teacher_site_relation (user_id, site_id)
        VALUES ($1, $2) RETURNING *`,
      [teacherId, siteId],
    );
    res.status(200).send(keysToCamel(addedSite.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// remove site for teacher
router.delete('/remove-site/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { siteId } = req.body;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    isNumeric(siteId, 'Site Id must be a Number');
    // Updating relevant values in tlp_user table
    const removedSite = await pool.query(
      `DELETE FROM master_teacher_site_relation
      WHERE user_id = $1 AND site_id = $2
      RETURNING *`,
      [teacherId, siteId],
    );
    res.status(200).send(keysToCamel(removedSite.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.delete('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    const deletedTeacher = await pool.query(
      'DELETE FROM general_user WHERE user_id = $1 RETURNING *;',
      [teacherId],
    );
    res.status(200).send(keysToCamel(deletedTeacher.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
