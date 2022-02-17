const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// works
router.post('/create', async (req, res) => {
  try {
    const areaInfo = req.body;
    console.log(areaInfo);
    const newArea = await pool.query(
      'INSERT INTO area (area_name, active) VALUES($1,$2) RETURNING *',
      [areaInfo.area_name, areaInfo.active],
    );
    res.json(newArea.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Works!
router.get('/:id', async (req, res) => {
  try {
    const areaId = req.params.id;
    console.log(areaId);
    const area = await pool.query('SELECT * FROM area WHERE id = $1', [areaId]);
    res.json(area.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
  // res.json('This is the school page');
});

module.exports = router;
