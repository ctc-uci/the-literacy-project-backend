const { Router } = require('express');
const { pool } = require('../server/db');
const { isNumeric, keysToCamel } = require('./utils');

const router = Router();

const getStudentGroups = (allGroups) =>
  `SELECT student_group.*, relation.students
    FROM student_group
        LEFT JOIN (SELECT s.student_group_id, array_agg(s.student_id ORDER BY s.student_id ASC) AS students
            FROM student AS s
            GROUP BY s.student_group_id) AS relation
        ON relation.student_group_id = student_group.group_id ${
          allGroups ? '' : ' WHERE student_group.group_id = $1'
        }`;

// get a student group by id
router.get('/:studentGroupId', async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const studentGroup = await pool.query(getStudentGroups(false), [studentGroupId]);
    res.status(200).send(keysToCamel(studentGroup.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all student groups
router.get('/', async (req, res) => {
  try {
    const studentGroup = await pool.query(getStudentGroups(true));
    res.status(200).send(keysToCamel(studentGroup.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students groups for a given site
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const studentGroup = await pool.query(
      `${getStudentGroups(true)} WHERE student_group.site_id = $1`,
      [siteId],
    );
    res.status(200).json(keysToCamel(studentGroup.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// add a student group
router.post('/', async (req, res) => {
  try {
    const { year, cycle, masterTeacherId, siteId, meetingDay, meetingTime } = req.body;
    isNumeric(year, 'Year must be a Number');
    isNumeric(masterTeacherId, 'Master teacher Id must be a Number');
    isNumeric(siteId, 'Site Id must be a Number');

    const group = await pool.query(
      `INSERT INTO student_group (year, cycle, master_teacher_id, site_id, meeting_day, meeting_time)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;`,
      [year, cycle, masterTeacherId, siteId, meetingDay, meetingTime],
    );

    const addedGroup = await pool.query(getStudentGroups(false), [group.rows[0].group_id]);
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
    const { year, cycle, masterTeacherId, siteId, meetingDay, meetingTime } = req.body;
    isNumeric(year, 'Year must be a Number');
    isNumeric(masterTeacherId, 'Master teacher Id must be a Number');
    isNumeric(siteId, 'Site Id must be a Number');
    await pool.query(
      `UPDATE student_group
        SET year = $1, cycle = $2, master_teacher_id = $3, site_id = $4, meeting_day = $5, meeting_time = $6
        WHERE group_id = $7`,
      [year, cycle, masterTeacherId, siteId, meetingDay, meetingTime, studentGroupId],
    );
    const updatedGroup = await pool.query(getStudentGroups(false), [studentGroupId]);
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
