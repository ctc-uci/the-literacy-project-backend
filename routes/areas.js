const { Router } = require('express');
const pool = require('../server/db');

const siteRouter = Router();

// get a site by id
siteRouter.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    if (!Number.isInteger(siteId)) {
      throw new Error('Site ID must be an Integer');
    }
    const site = await pool.query(`SELECT * FROM site WHERE site_id = $1`, [siteId]);
    res.send({
      site: site.rows[0],
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all the sites
siteRouter.get('/', async (req, res) => {
  try {
    const sites = await pool.query('SELECT * FROM site;');
    res.send({
      sites: sites.rows,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a new site
siteRouter.post('/create', async (req, res) => {
  try {
    const {
      siteName,
      addressStreet,
      addressCity,
      addressZip,
      areaId,
      primaryContactId,
      secondContactId,
      notes,
    } = req.body;
    const newSite = await pool.query(
      `INSERT INTO site (
        site_name,
        address_street,
        address_city,
        address_zip,
        area_id,
        primary_contact_id,
        ${secondContactId ? 'secondary_contact_id,' : ''},
        notes)
      VALUES (
        $(siteName), $(addressStreet), $(addressCity),
        $(addressZip), $(areaId), $(primaryContactId),
        ${secondContactId ? ' $(secondContactId),' : ''} $(notes))
      RETURNING *`,
      {
        siteName,
        addressStreet,
        addressCity,
        addressZip,
        areaId,
        primaryContactId,
        secondContactId,
        notes,
      },
    );
    res.send(newSite.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a site

// delete a site by id
// siteRouter.delete('/:siteId', async (req, res) => {
//   try {

//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// })

// works
// router.post('/create', async (req, res) => {
//   try {
//     const areaInfo = req.body;
//     console.log(areaInfo);
//     const newArea = await pool.query(
//       'INSERT INTO area (area_name, active) VALUES($1,$2) RETURNING *',
//       [areaInfo.area_name, areaInfo.active],
//     );
//     res.json(newArea.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//   }
// });

// // Works!
// router.get('/:id', async (req, res) => {
//   try {
//     const areaId = req.params.id;
//     console.log(areaId);
//     const area = await pool.query('SELECT * FROM area WHERE id = $1', [areaId]);
//     res.json(area.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//   }
//   // res.json('This is the school page');
// });

// router.post('/', async (req, res) => {
//   try{

//   } catch (err) {
//     console.log(err.message);
//   }
// });

module.exports = siteRouter;
