const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const schoolDistrictName = req.body.district_name;
    console.log(schoolDistrictName);
    const newSchoolDistrict = await pool.query(
      'INSERT INTO school_district (district_name) VALUES($1) RETURNING *',
      [schoolDistrictName],
    );
    res.json(newSchoolDistrict);
    // console.log(id);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('', async (req, res) => {
  try {
    console.log('hello');
    const allSchools = await pool.query('SELECT * FROM school_district');
    res.json(allSchools.rows);
    // const { school_id } = req.body.school_id
  } catch (err) {
    console.error(err.message);
  }
  // res.json('This is the school page');
});

module.exports = router;
