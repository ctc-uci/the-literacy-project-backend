const { Router } = require('express');
const { pool } = require('../server/db');
const { isNumeric, keysToCamel } = require('./utils');

const router = Router();

const getStudentGroups = (conditions = '') =>
  `SELECT student_group.*, site.site_name, site.address_street, site.address_city, site.address_zip, area.area_name, relation.students
  FROM student_group
    LEFT JOIN (SELECT s.student_group_id,
                      array_agg(json_build_object('student_id', s.student_id,
                                                  'first_name', s.first_name,
                                                  'last_name', s.last_name,
                                                  'ethnicity', s.ethnicity,
                                                  'grade', s.grade,
                                                  'home_teacher', s.home_teacher,
                                                  'gender', s.gender,                                                  'pretest_r', s.pretest_r,
                                                  'posttest_r', s.posttest_r,
                                                  'pretest_a', s.pretest_a,
                                                  'posttest_a', s.posttest_a)
                                ORDER BY s.first_name, s.last_name ASC)
          AS students
        FROM student AS s
        GROUP BY s.student_group_id) AS relation
    ON relation.student_group_id = student_group.group_id
    JOIN site
    ON site.site_id = student_group.site_id
    JOIN area
    ON site.area_id = area.area_id
  ${conditions};`;

// get a student group by id
router.get('/:studentGroupId', async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    const conditions = 'WHERE student_group.group_id = $1';
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const studentGroup = await pool.query(getStudentGroups(conditions), [studentGroupId]);
    res.status(200).send(keysToCamel(studentGroup.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all student groups
router.get('/', async (req, res) => {
  try {
    const studentGroup = await pool.query(getStudentGroups());
    res.status(200).send(keysToCamel(studentGroup.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all student groups for a given site
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const conditions = 'WHERE student_group.site_id = $1';
    const studentGroup = await pool.query(getStudentGroups(conditions), [siteId]);
    res.status(200).json(keysToCamel(studentGroup.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all student groups for a given master teacher
router.get('/master-teacher/:masterTeacherId', async (req, res) => {
  try {
    const { masterTeacherId } = req.params;
    isNumeric(masterTeacherId, 'Master Teacher Id must be a Number');
    const conditions = 'WHERE student_group.master_teacher_id = $1';
    const studentGroup = await pool.query(getStudentGroups(conditions), [masterTeacherId]);
    res.status(200).json(keysToCamel(studentGroup.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// add a student group
router.post('/', async (req, res) => {
  try {
    const { name, year, cycle, masterTeacherId, siteId, meetingDay, meetingTime } = req.body;
    isNumeric(year, 'Year must be a Number');
    isNumeric(masterTeacherId, 'Master teacher Id must be a Number');
    isNumeric(siteId, 'Site Id must be a Number');
    const group = await pool.query(
      `INSERT INTO student_group (
        name, year, cycle, master_teacher_id,
        site_id, meeting_day, meeting_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;`,
      [name, year, cycle, masterTeacherId, siteId, meetingDay, meetingTime],
    );
    const conditions = 'WHERE student_group.group_id = $1';
    const addedGroup = await pool.query(getStudentGroups(conditions), [group.rows[0].group_id]);
    res.status(200).send(keysToCamel(addedGroup.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a student group
router.put('/:studentGroupId', async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const { name, year, cycle, masterTeacherId, siteId, meetingDay, meetingTime } = req.body;
    isNumeric(year, 'Year must be a Number');
    isNumeric(masterTeacherId, 'Master teacher Id must be a Number');
    isNumeric(siteId, 'Site Id must be a Number');
    await pool.query(
      `UPDATE student_group
      SET
        name = $1, year = $2, cycle = $3,
        master_teacher_id = $4, site_id = $5,
        meeting_day = $6, meeting_time = $7
      WHERE group_id = $8;`,
      [name, year, cycle, masterTeacherId, siteId, meetingDay, meetingTime, studentGroupId],
    );
    const conditions = 'WHERE student_group.group_id = $1';
    const updatedGroup = await pool.query(getStudentGroups(conditions), [studentGroupId]);
    res.status(200).send(keysToCamel(updatedGroup.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete a student group
router.delete('/:studentGroupId', async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const deletedGroup = await pool.query(
      `DELETE FROM student_group
        WHERE group_id = $1
        RETURNING *;`,
      [studentGroupId],
    );
    res.status(200).send(keysToCamel(deletedGroup.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
