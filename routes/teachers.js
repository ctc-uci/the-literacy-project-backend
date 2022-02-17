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

// figure out how to delete MT from other tables (tlp_user, student_group)
// Using postman doesn't complete, but it does remove it from the database!
router.delete('/remove/:master_id', async (req, res) => {
  try {
    console.log(req.params);
    const masterId = req.params.master_id;
    await pool.query('DELETE FROM master_teacher WHERE id = $1', [masterId]);
    res.json('Successfully removed teacher: ', masterId);
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
