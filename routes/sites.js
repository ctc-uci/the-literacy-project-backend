const { Router } = require('express');
const pool = require('../server/db');

const router = Router();
router.post('/create', async (req, res) => {
  try {
    console.log(req.params);
    const { schoolName } = req.body;
    const newSchool = await pool.query('INSERT INTO school (school_name) VALUES($1) RETURNING *', [
      schoolName,
    ]);
    res.json(newSchool.rows[0]);
    // console.log(id);
  } catch (err) {
    console.error(err.message);
  }
});
// app.get('/dashboard')

router.get('', async (req, res) => {
  try {
    console.log('hello');
    const allSchools = await pool.query('SELECT * FROM school');
    res.json(allSchools.rows);
    // const { school_id } = req.body.school_id
  } catch (err) {
    console.error(err.message);
  }
  res.json('This is the school page');
});

module.exports = router;
