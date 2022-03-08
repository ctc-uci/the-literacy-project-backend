const { Router } = require('express');
const { pool, db } = require('../server/db');
const { isNumeric, keysToCamel } = require('./utils');

const router = Router();

// get a student by id
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const area = await pool.query(`SELECT * FROM student WHERE student_id = $1;`, [studentId]);
    res.status(200).send(keysToCamel(area.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students
router.get('/', async (req, res) => {
  try {
    const allStudents = await pool.query('SELECT * FROM student');
    res.status(200).json(keysToCamel(allStudents.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a student
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, contactId, studentGroupId } = req.body;
    isNumeric(contactId, 'Contact Id must be a Number');
    isNumeric(studentGroupId, 'Contact Id must be a Number');
    const newStudent = await pool.query(
      `INSERT INTO student (first_name, last_name, contact_id, student_group_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`,
      [firstName, lastName, contactId, studentGroupId],
    );
    res.status(200).send(keysToCamel(newStudent.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a student's general contact
router.put('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const { firstName, lastName, contactId, studentGroupId } = req.body;
    isNumeric(contactId, 'Contact Id must be a Number');
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const updatedStudent = await db.query(
      `UPDATE student
      SET first_name = $(firstName), last_name = $(lastName),
          contact_id = $(contactId), student_group_id = $(studentGroupId)
      WHERE student_id = $(studentId)
      RETURNING *;`,
      { firstName, lastName, contactId, studentGroupId, studentId },
    );
    res.status(200).send(keysToCamel(updatedStudent[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update scores for a specific student
router.put('/update-scores/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const { pretestR, posttestR, pretestA, posttestA } = req.body;
    const student = await db.query(
      `UPDATE student
      SET student_id = $(studentId)
          ${pretestR ? ', pretest_r = $(pretestR)' : ''}
          ${posttestR ? ', posttest_r = $(posttestR)' : ''}
          ${pretestA ? ', pretest_a = $(pretestA)' : ''}
          ${posttestA ? ', posttest_a = $(posttestA)' : ''}
      WHERE student_id = $(studentId)
      RETURNING *;`,
      { pretestR, posttestR, pretestA, posttestA, studentId },
    );
    res.status(200).send(keysToCamel(student[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete a student
router.delete('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const deletedStudent = await pool.query(
      `DELETE FROM student WHERE student_id = $1 RETURNING *;`,
      studentId,
    );
    res.status(200).send(keysToCamel(deletedStudent.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
