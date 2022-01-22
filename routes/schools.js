const { Router } = require('express');

const router = Router();
router.post('/create', async (req, res) => {
  try {
    console.log(req.params);
    // const { username } = req.body.username;
    // console.log(id);
  } catch (err) {
    console.error(err.message);
  }
  res.json('School created');
});
// app.get('/dashboard')

router.get('', async (req, res) => {
  try {
    console.log('hello');
    // const allSchools = await pool.query('SELECT * FROM schools')
    // res.json(allSchools.rows)
    // const { school_id } = req.body.school_id
  } catch (err) {
    console.error(err.message);
  }
  res.json('This is the school page');
});

module.exports = router;
