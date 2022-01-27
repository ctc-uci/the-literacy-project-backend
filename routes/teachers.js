const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const teacherId = req.body.master_id;
    console.log(teacherId);
    const newTeacher = await pool.query(
      'INSERT INTO master_teacher (master_id) VALUES($1) RETURNING *',
      [teacherId],
    );
    res.json(newTeacher);
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

router.delete('/remove/:master_id', async (req, res) => {
  try {
    console.log(req.params);
    const masterId = req.params.master_id;
    await pool.query('DELETE FROM master_teacher WHERE master_id = masterId');
    res.json('Successfully removed teacher: ', masterId);
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
