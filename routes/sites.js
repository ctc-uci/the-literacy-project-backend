const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// Works!
router.post('/create', async (req, res) => {
  try {
    console.log(req.body);
    const siteInfo = req.body;
    const newSite = await pool.query(
      'INSERT INTO site (site_name, address_street, address_city, ss_city, address_zip, area_id, p_first_name, p_last_name, p_title, p_phone_num, p_email, s_first_name, s_last_name, s_title, s_phone_num, s_email, notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16) RETURNING *',
      [
        siteInfo.site_name,
        siteInfo.address_street,
        siteInfo.address_city,
        siteInfo.address_zip,
        siteInfo.area_id,
        siteInfo.p_first_name,
        siteInfo.p_last_name,
        siteInfo.p_title,
        siteInfo.p_phone_num,
        siteInfo.p_email,
        siteInfo.s_first_name,
        siteInfo.s_last_name,
        siteInfo.s_title,
        siteInfo.s_phone_num,
        siteInfo.s_email,
        siteInfo.notes,
      ],
    );
    res.json(newSite.rows[0]);
    // console.log(id);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('', async (req, res) => {
  try {
    const allSites = await pool.query('SELECT * FROM site');
    res.json(allSites.rows);
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
