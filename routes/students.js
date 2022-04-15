const { Router } = require('express');
const { pool, db } = require('../server/db');
const { isNumeric, keysToCamel } = require('./utils');

const router = Router();

const studentsQuery = (conditions = '') =>
  `SELECT student.*, site.site_id, site.site_name, area.area_name,
    student_group.name AS student_group_name, student_group.year, student_group.cycle
  FROM student
    LEFT JOIN student_group on student_group.group_id = student.student_group_id
    LEFT JOIN site on site.site_id = student_group.site_id
    LEFT JOIN area on area.area_id = site.area_id
  ${conditions};`;

// get a student by id
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const conditions = 'WHERE student.student_id = $1';
    const student = await pool.query(studentsQuery(conditions), [studentId]);
    res.status(200).send(keysToCamel(student.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students
router.get('/', async (req, res) => {
  try {
    const allStudents = await pool.query(studentsQuery());
    res.status(200).json(keysToCamel(allStudents.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students for a given student group
router.get('/student-group/:studentGroupId', async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const students = await pool.query(
      `SELECT student.*
      FROM student
      WHERE student.student_group_id = $1;`,
      [studentGroupId],
    );
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students for a given site
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const students = await pool.query(
      `SELECT student.*
      FROM student
        INNER JOIN (SELECT s.group_id, s.site_id
              FROM student_group AS s) AS student_group
              ON student_group.group_id = student.student_group_id
        INNER JOIN (SELECT site.site_id, site.area_id
              FROM site) AS site
              ON site.site_id = student_group.site_id
      WHERE site.site_id = $1;`,
      [siteId],
    );
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students not in a given site
router.get('/other-sites/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const students = await pool.query(
      `SELECT student.*, student_group.*
      FROM student
        INNER JOIN (SELECT s.group_id, s.site_id, s.year, s.cycle
              FROM student_group AS s) AS student_group
              ON student_group.group_id = student.student_group_id
        INNER JOIN (SELECT site.site_id, site.area_id
              FROM site) AS site
              ON site.site_id = student_group.site_id
      WHERE site.site_id != $1;`,
      [siteId],
    );
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students for a given area
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    isNumeric(areaId, 'Area Id must be a Number');
    const students = await pool.query(
      `SELECT student.*
      FROM student
        INNER JOIN (SELECT s.group_id, s.site_id
              FROM student_group AS s) AS student_group
              ON student_group.group_id = student.student_group_id
        INNER JOIN (SELECT site.site_id, site.area_id
              FROM site) AS site
              ON site.site_id = student_group.site_id
      WHERE site.area_id = $1;`,
      [areaId],
    );
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a student
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, grade, gender, homeTeacher, studentGroupId, ethnicity } = req.body;
    isNumeric(grade, 'Grade must be a Number');
    if (studentGroupId) {
      isNumeric(studentGroupId, 'Student Group Id must be a Number');
    }
    const student = await db.query(
      `INSERT INTO student (
        first_name, last_name, gender, grade,
        ${homeTeacher ? 'home_teacher, ' : ''}
        ${studentGroupId ? 'student_group_id, ' : ''}
        ethnicity)
      VALUES ($(firstName), $(lastName), $(gender), $(grade),
        ${homeTeacher ? '$(homeTeacher), ' : ''}
        ${studentGroupId ? '$(studentGroupId), ' : ''}
        $(ethnicity)::ethnicities[])
      RETURNING *;`,
      { firstName, lastName, gender, grade, homeTeacher, studentGroupId, ethnicity },
    );
    const conditions = 'WHERE student.student_id = $1';
    const newStudent = await pool.query(studentsQuery(conditions), [student.rows[0].student_id]);
    res.status(200).send(keysToCamel(newStudent.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a student's general info
router.put('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const { firstName, lastName, gender, grade, homeTeacher, studentGroupId, ethnicity } = req.body;
    isNumeric(grade, 'Grade must be a Number');
    if (studentGroupId) {
      isNumeric(studentGroupId, 'Student Group Id must be a Number');
    }
    await db.query(
      `UPDATE student
      SET
        first_name = $(firstName),
        last_name = $(lastName),
        gender = $(gender),
        grade = $(grade),
        home_teacher = $(homeTeacher),
        ${studentGroupId ? 'student_group_id = $(studentGroupId), ' : ''}
        ethnicity = $(ethnicity)::ethnicities[]
      WHERE student_id = $(studentId)
      RETURNING *;`,
      { firstName, lastName, gender, grade, homeTeacher, studentGroupId, ethnicity, studentId },
    );
    const conditions = 'WHERE student.student_id = $1';
    const updatedStudent = await pool.query(studentsQuery(conditions), [studentId]);
    res.status(200).send(keysToCamel(updatedStudent.rows[0]));
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
      [studentId],
    );
    res.status(200).send(keysToCamel(deletedStudent.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
