const { Router } = require('express');
const { pool } = require('../server/db');
const { isBoolean, isNumeric, keysToCamel } = require('./utils');

const router = Router();

// get an area by id
router.get('/area-management', async (req, res) => {
  try {
    const areaInfo = await pool.query(`
      SELECT area.*, site.num_sites, site.site_info, mt_info.num_mts, student_info.num_students, student_info.year
      FROM area
        LEFT JOIN
          (SELECT site.area_id, COUNT(site.site_id)::int as num_sites, array_agg(json_build_object('site_id', site.site_id, 'site_name', site.site_name, 'site_state', site.address_state)) as site_info
          FROM site
          GROUP BY site.area_id)
        AS site ON site.area_id = area.area_id
        LEFT JOIN
          (SELECT site.area_id, COUNT(DISTINCT mt.user_id)::int as num_mts
          FROM master_teacher_site_relation as mt
            INNER JOIN
              (SELECT site.site_id, site.area_id FROM site)
            AS site on site.site_id = mt.site_id
          GROUP BY site.area_id)
        AS mt_info on mt_info.area_id = area.area_id
        LEFT JOIN
          (SELECT site.area_id, COUNT(*)::int as num_students, sg.year
          FROM student
            INNER JOIN
              (SELECT sg.group_id, sg.site_id, sg.year
              FROM student_group AS sg)
            AS sg ON sg.group_id = student.student_group_id
            INNER JOIN
              (SELECT site.site_id, site.area_id
              FROM site)
            AS site ON site.site_id = sg.site_id
          GROUP BY site.area_id, sg.year)
        AS student_info on student_info.area_id = area.area_id
      ORDER BY area.area_name;`);
    res.status(200).send(keysToCamel(areaInfo.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

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
    const updatedSites = await pool.query(
      `UPDATE site
      SET active = $1
      WHERE area_id = $2
      RETURNING*;`,
      [active, areaId],
    );
    res
      .status(200)
      .send({ area: keysToCamel(updatedArea.rows[0]), rows: keysToCamel(updatedSites.rows[0]) });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete an area
// *does not delete corresponding sites*
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
