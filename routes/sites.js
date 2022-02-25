const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

router.post('', async (req, res) => {
  try {
    console.log(req.body);
    const siteInfo = req.body;
    const newSite = await pool.query(
      'INSERT INTO site (site_name, address_street, address_city, address_zip, area_id, primary_contact_id, second_contact_id, notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [
        siteInfo.site_name,
        siteInfo.address_street,
        siteInfo.address_city,
        siteInfo.address_zip,
        siteInfo.area_id,
        siteInfo.primary_contact_id,
        siteInfo.second_contact_id,
        siteInfo.notes,
      ],
    );
    res.json(newSite.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('', async (req, res) => {
  try {
    const allSites = await pool.query('SELECT * FROM site');
    console.log(allSites);
    res.json(allSites.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const site = await pool.query('SELECT * FROM site WHERE site_id = $1', [id]);
    console.log(site);
    res.json(site.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// not tested yet
router.get('/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const sites = await pool.query(
      'SELECT * FROM site WHERE site_id IN (SELECT DISTINCT site_id FROM student_group WHERE year = $1)',
      [year],
    );
    res.json(sites.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// not tested yet
router.get('/:year/:cycle', async (req, res) => {
  try {
    const { year, cycle } = req.params;
    const sites = await pool.query(
      'SELECT * FROM site WHERE site_id IN (SELECT DISTINCT site_id FROM student_group WHERE year = $1 AND cycle = $2)',
      [year, cycle],
    );
    res.json(sites.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
