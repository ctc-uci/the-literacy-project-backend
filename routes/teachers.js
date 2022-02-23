const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const teacherInfo = req.body;
    console.log(teacherInfo);
    const newTeacher = await pool.query(
      'INSERT INTO master_teacher (id, area,sites) VALUES($1,$2,$3) RETURNING *',
      [teacherInfo.id, teacherInfo.area, teacherInfo.sites],
    );
    res.json(newTeacher.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('', async (req, res) => {
  try {
    const allTeachers = await pool.query('SELECT * FROM master_teacher');
    res.json(allTeachers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const allTeachers = await pool.query('SELECT * FROM master_teacher WHERE id = $1', [id]);
    res.json(allTeachers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('/:site', async (req, res) => {
  const { site } = req.params;
  try {
    const allTeachers = await pool.query(
      'SELECT * from master_teacher WHERE sites @> ARRAY[$1]::int[]',
      [site],
    );
    res.json(allTeachers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.put('/:id', async (req, res) => {
  const { firstName, lastName, active, phoneNumber, id, sites } = req.params;
  try {
    await pool.query('UPDATE master_teacher SET sites = $1 WHERE id = $2', [sites, id]);
    await pool.query(
      'UPDATE tlp_user SET first_name = $1, last_name = $2, phone_number = $3, active = $4 WHERE id = $5',
      [firstName, lastName, phoneNumber, active, id],
    );
    // Status 200 = request OK
    res.status(200);
  } catch (err) {
    console.error(err.message);
  }
});

// figure out how to delete MT from other tables (tlp_user, student_group)
// Using postman doesn't complete, but it does remove it from the database!
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM master_teacher WHERE id = $1', [id]);
    res.json('Successfully removed teacher: ', id);
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
