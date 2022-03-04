const { Router } = require('express');
const { pool } = require('../server/db');
const { isBoolean, isNumeric, keysToCamel } = require('./utils');

const router = Router();

// get an area by id
router.get('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    isNumeric(areaId, 'Area Id must be a Number');
    const area = await pool.query(`SELECT * FROM area WHERE area_id = $1;`, [areaId]);
    res.status(200).send(keysToCamel(area.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all areas
router.get('/', async (req, res) => {
  try {
    const areas = await pool.query('SELECT * FROM area;');
    res.status(200).json(keysToCamel(areas.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create an area
router.post('/', async (req, res) => {
  try {
    const { areaName, active } = req.body;
    isBoolean(active, 'Active must be a boolean value');
    const newArea = await pool.query(
      'INSERT INTO area (area_name, active) VALUES ($1, $2) RETURNING *;',
      [areaName, active],
    );
    res.status(200).send(keysToCamel(newArea.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update an area
router.put('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    isNumeric(areaId, 'Area Id must be a Number');
    const { areaName, active } = req.body;
    isBoolean(active, 'Active must be a boolean value');
    const updatedArea = await pool.query(
      `UPDATE area
      SET area_name = $1, active = $2
      WHERE area_id = $3
      RETURNING *;`,
      [areaName, active, areaId],
    );
    res.status(200).send(keysToCamel(updatedArea.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete an area
router.delete('/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    isNumeric(areaId, 'Area Id must be a Number');
    const deletedArea = await pool.query(`DELETE FROM area WHERE area_id = $1 RETURNING *;`, [
      areaId,
    ]);
    res.status(200).send(keysToCamel(deletedArea.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
