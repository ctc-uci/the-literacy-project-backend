const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// Works!
router.post('/create', async (req, res) => {
  try {
    console.log(req.body);
    const siteInfo = req.body;
    const newSite = await pool.query(
      'INSERT INTO site (site_name, address_street, address_city, address_zip, area_id, p_first_name, p_last_name, p_title, p_phone_num, p_email, s_first_name, s_last_name, s_title, s_phone_num, s_email, notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *',
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

// const siteRouter = Router();

// // get a site by id
// siteRouter.get('/:siteId', async (req, res) => {
//   try {
//     const { siteId } = req.params;
//     if (!Number.isInteger(siteId)) {
//       throw new Error('Site ID must be an Integer');
//     }
//     const site = await pool.query(`SELECT * FROM site WHERE site_id = $1`, [siteId]);
//     res.send({
//       site: site.rows[0],
//     });
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// });

// // get all the sites
// siteRouter.get('/', async (req, res) => {
//   try {
//     const sites = await pool.query('SELECT * FROM site;');
//     res.send({
//       sites: sites.rows,
//     });
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// });

// // create a new site
// siteRouter.post('/create', async (req, res) => {
//   try {
//     const {
//       siteName,
//       addressStreet,
//       addressCity,
//       addressZip,
//       areaId,
//       primaryContactId,
//       secondContactId,
//       notes,
//     } = req.body;
//     const newSite = await pool.query(
//       `INSERT INTO site (
//         site_name,
//         address_street,
//         address_city,
//         address_zip,
//         area_id,
//         primary_contact_id,
//         ${secondContactId ? 'secondary_contact_id,' : ''},
//         notes)
//       VALUES (
//         $(siteName), $(addressStreet), $(addressCity),
//         $(addressZip), $(areaId), $(primaryContactId),
//         ${secondContactId ? ' $(secondContactId),' : ''} $(notes))
//       RETURNING *`,
//       {
//         siteName,
//         addressStreet,
//         addressCity,
//         addressZip,
//         areaId,
//         primaryContactId,
//         secondContactId,
//         notes,
//       },
//     );
//     res.send(newSite.rows);
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// });

module.exports = router;
