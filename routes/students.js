const { Router } = require('express');
const { pool, db } = require('../server/db');
const { isNumeric } = require('./utils');

const router = Router();

// get a student by id
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const area = await pool.query(`SELECT * FROM student WHERE student_id = $1;`, [studentId]);
    res.status(200).send(area.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students
router.get('/', async (req, res) => {
  try {
    const allStudents = await pool.query('SELECT * FROM student');
    res.status(200).json(allStudents.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a student
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, contactId, siteId, studentGroup } = req.body;
    isNumeric(contactId, 'Site Id must be a Number');
    isNumeric(siteId, 'Contact Id must be a Number');
    isNumeric(studentGroup, 'Contact Id must be a Number');
    const newStudent = await pool.query(
      `INSERT INTO student (first_name, last_name, contact_id, site_id, student_group)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;`,
      [firstName, lastName, contactId, siteId, studentGroup],
    );
    res.status(200).send(newStudent.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a student's general contact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    isNumeric(id, 'Student Id must be a Number');
    const { firstName, lastName, contactId, siteId, studentGroup } = req.body;
    isNumeric(contactId, 'Contact Id must be a Number');
    isNumeric(siteId, 'Site Id must be a Number');
    isNumeric(studentGroup, 'Student Group Id must be a Number');
    const updatedStudent = await db.query(
      `UPDATE student
      SET first_name = $(firstName), last_name = $(lastName), contact = $(contactId), site_id = $(siteId), student_group = $(studentGroup),
      WHERE student_id = $(id)
      RETURNING *;`,
      { firstName, lastName, contactId, siteId, studentGroup, id },
    );
    res.send(200).json(updatedStudent.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update scores for a specific student
router.post('/update-scores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    isNumeric(id, 'Student Id must be a Number');
    const { pretestR, posttestR, pretestA, posttestA } = req.body;
    const student = await db.query(
      `UPDATE student
      SET ${pretestR ? ', pretest_r = $(pretestR)' : ''}
      ${posttestR ? ', posttest_r = $(posttestR)' : ''}
      ${pretestA ? ', pretest_a = $(pretestA)' : ''}
      ${posttestA ? ', posttest_a = $(posttestA)' : ''}
      WHERE student_id = $(id)
      RETURNING *;`,
      { pretestR, posttestR, pretestA, posttestA, id },
    );
    res.status(200).send(student.rows[0]);
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
    res.status(200).send(deletedStudent.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// '/create'
// router.get('/create', async (req, res) => {
//   try {
//   } catch (err) {
//     console.error(err.message);
//   }
// });

// '/export-data'
// router.post('/export-data', async (req, res) => {});

// PUT

// router.put('/edit', async(req,res) => {
//     try{
//         //not sure if this should be parameterized for student_id
//         const newGroups= req.body.student_groups;
//         const newTeacher = req.body.home_teacher;

//     }catch(err){
//         console.error(err.message);
//     }
// });

// '/:student-id/' ...

module.exports = router;
