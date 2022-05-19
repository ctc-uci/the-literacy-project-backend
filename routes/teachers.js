const { Router } = require('express');
const { pool } = require('../server/db');
const { isNumeric, isPhoneNumber, keysToCamel } = require('./utils');
const firebaseAdmin = require('../firebase');

const router = Router();

const getTeachers = (allTeachers) =>
  `SELECT tlp_user.*, relation.sites
  FROM tlp_user
    LEFT JOIN (SELECT m.user_id, array_agg(m.site_id ORDER BY m.site_id ASC) AS sites
      FROM master_teacher_site_relation AS m
      GROUP BY m.user_id) AS relation ON relation.user_id = tlp_user.user_id
  WHERE ${allTeachers ? '' : 'tlp_user.user_id = $1 AND'} position = 'master teacher'`;

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

// get all teachers by site
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const teacher = await pool.query(
      `${getTeachers(
        true,
      )} AND tlp_user.user_id in (SELECT DISTINCT user_id FROM master_teacher_site_relation WHERE site_id = $1)`,
      [siteId],
    );
    res.status(200).json(keysToCamel(teacher.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a teacher
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, notes, password, siteIds } = req.body;
    // isAlphaNumeric(firebaseId, 'Firebase Id must be alphanumeric');
    // isPhoneNumber(phoneNumber, 'Invalid Phone Number');

    const newUser = await firebaseAdmin.auth().createUser({
      email,
      emailVerified: true,
      password,
    });

    const newTeacher = await pool.query(
      `INSERT INTO tlp_user
        (firebase_id, first_name, last_name,
        phone_number, email, position, active, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [newUser.uid, firstName, lastName, 1234567890, email, 'master teacher', 'pending', notes],
    );
    const userId = newTeacher.rows[0].user_id;
    if (siteIds.length > 0) {
      await pool.query(
        `INSERT INTO master_teacher_site_relation
          (user_id, site_id)
        VALUES
        ${siteIds.map((s) => `($1, ${s})`).join(', ')}
        RETURNING *;`,
        [userId],
      );
    }

    const addedTeacher = await pool.query(getTeachers(false), [userId]);
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
    const { firstName, lastName, phoneNumber, active, notes } = req.body;
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    await pool.query(
      `UPDATE tlp_user
        SET first_name = $1, last_name = $2, phone_number = $3, active = $4, notes = $5
        WHERE user_id = $6`,
      [firstName, lastName, phoneNumber, active, notes, teacherId],
    );
    const updatedTeacher = await pool.query(getTeachers(false), [teacherId]);
    res.status(200).send(keysToCamel(updatedTeacher.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a teacher's note
router.put('/update-notes/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    const { notes } = req.body;
    await pool.query(
      `UPDATE tlp_user
        SET notes = $1
        WHERE user_id = $2`,
      [notes, teacherId],
    );
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

// delete a teacher
router.delete('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    const tlpUser = await pool.query(`SELECT * FROM tlp_user WHERE user_id = $1`, [teacherId]);
    await firebaseAdmin.auth().deleteUser(tlpUser.rows[0].firebase_id);
    const deletedTeacher = await pool.query(
      'DELETE FROM tlp_user WHERE user_id = $1 RETURNING *;',
      [teacherId],
    );
    res.status(200).send(keysToCamel(deletedTeacher.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get a teachers information and their site information
router.get('/all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const allTeachers = await pool.query(
      `SELECT tlp_user.*, relation.sites
      FROM tlp_user
        LEFT JOIN (SELECT m.user_id, array_agg(to_json(site.*) ORDER BY site.site_id) AS sites
            FROM master_teacher_site_relation as m
              INNER JOIN site ON site.site_id = m.site_id
            GROUP BY m.user_id
            ) AS relation ON relation.user_id = tlp_user.user_id
      WHERE tlp_user.user_id = $1 AND position = 'master teacher';`,
      [userId],
    );
    res.status(200).json(keysToCamel(allTeachers.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
