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

// get all students groups and students for a given teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    isNumeric(teacherId, 'Teacher Id must be a Number');
    const studentGroup = await pool.query(
      `SELECT student_group.*, relation.students
      FROM student_group
          LEFT JOIN (SELECT s.student_group_id, array_agg(to_json(s.*) ORDER BY s.student_id ASC) AS students
              FROM student AS s
              GROUP BY s.student_group_id) AS relation
              ON relation.student_group_id = student_group.group_id
      WHERE student_group.master_teacher_id = $1;`,
      [teacherId],
    );
    res.status(200).json(keysToCamel(studentGroup.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a student
router.post('/', async (req, res) => {
  try {
    console.log('hello');
    const { firstName, lastName, contactId, studentGroupId, ethnicity } = req.body;
    isNumeric(contactId, 'Contact Id must be a Number');
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    console.log(req.body);
    console.log(firstName);
    console.log(lastName);
    console.log(contactId);
    console.log(studentGroupId);
    console.log(ethnicity);
    const newStudent = await pool.query(
      `INSERT INTO student (first_name, last_name, contact_id, student_group_id, ethnicity)
      VALUES ($1, $2, $3, $4, ${ethnicity ? ', ethnicity = $(ethnicity)' : ''})
      RETURNING *;`,
      [firstName, lastName, contactId, studentGroupId, ethnicity],
    );
    console.log('bye');
    res.status(200).send(keysToCamel(newStudent.rows[0]));
  } catch (err) {
    console.log('err');
    res.status(400).send(err.message);
  }
});

// update a student's general contact
router.put('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const { firstName, lastName, contactId, studentGroupId, ethnicity } = req.body;
    isNumeric(contactId, 'Contact Id must be a Number');
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const updatedStudent = await db.query(
      `UPDATE student
      SET first_name = $(firstName), last_name = $(lastName),
          contact_id = $(contactId), student_group_id = $(studentGroupId),
          ${5 ? ', ethnicity = $(5)' : ''}
      WHERE student_id = $(studentId)
      RETURNING *;`,
      { firstName, lastName, contactId, studentGroupId, ethnicity, studentId },
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
