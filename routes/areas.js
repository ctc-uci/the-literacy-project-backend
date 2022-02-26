const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

const isNumeric = (value) => {
  return /^-?\d+$/.test(value);
};

const isBoolean = (value) => {
  return value === 'true' || value === 'false';
};

// getting an area by id
router.get('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    if (!isNumeric(areaId)) {
      throw new Error('Area Id must be a Number');
    }
    const area = await pool.query(`SELECT * FROM area WHERE area_id = $1`, [areaId]);
    res.send({
      area: area.rows[0],
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all the areas
router.get('/', async (req, res) => {
  try {
    const areas = await pool.query('SELECT * FROM area;');
    res.send({
      sites: areas.rows,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// creating an area
router.post('/', async (req, res) => {
  try {
    const { areaName, active } = req.body;
    if (!isBoolean(active)) {
      throw new Error('Active should be a boolean value');
    }
    const newArea = await pool.query(
      'INSERT INTO area (area_name, active) VALUES($1, $2) RETURNING *',
      [areaName, active],
    );
    res.json(newArea.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// updating an area
router.put('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    if (!isNumeric(areaId)) {
      throw new Error('Area Id must be a Number');
    }
    const { areaName, active } = req.body;
    if (!isBoolean(active)) {
      throw new Error('Active should be a boolean value');
    }
    const updatedArea = await pool.query(
      `UPDATE area
      SET area_name = $1, active = $2
      WHERE area_id = $3
      RETURNING *`,
      [areaName, active, areaId],
    );
    res.send(updatedArea.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// deleting an area
router.delete('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    if (!isNumeric(areaId)) {
      throw new Error('Area Id must be a Number');
    }
    const deletedArea = await pool.query(`DELETE FROM area WHERE area_id = $1 RETURNING *`, [
      areaId,
    ]);
    res.send(deletedArea.rows[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
