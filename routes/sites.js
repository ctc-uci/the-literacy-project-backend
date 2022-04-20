const { Router } = require('express');
const { pool, db } = require('../server/db');
const {
  isNumeric,
  isZipCode,
  keysToCamel,
  isPhoneNumber,
  addContact,
  isBoolean,
} = require('./utils');

const router = Router();

// Not sure what data yall want to display for sites now since general user has been removed.
// Kept it simple and returned everything
const getSites = (allSites) =>
  `SELECT * FROM site
  ${allSites ? '' : 'WHERE site_id = $1'}`;

const noMT = () =>
  `SELECT * FROM site
    WHERE site_id NOT IN
    (SELECT site_id FROM master_teacher_site_relation)`;

// get sites without master teacher
router.get('/noMT', async (req, res) => {
  try {
    console.log('hello');
    const s = await pool.query(noMT());
    res.status(200).send(keysToCamel(s.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get a site by id
router.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const site = await pool.query(getSites(false), [siteId]);
    res.status(200).send(keysToCamel(site.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all sites
router.get('/', async (req, res) => {
  try {
    const sites = await pool.query(getSites(true));
    res.status(200).json(keysToCamel(sites.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all sites in an area
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    isNumeric(areaId, 'Area Id must be a Number');
    const sites = await pool.query(`${getSites(true)} WHERE site.area_id = $1`, [areaId]);
    res.status(200).json(keysToCamel(sites.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a site
router.post('/', async (req, res) => {
  try {
    const {
      siteName,
      addressStreet,
      addressCity,
      addressZip,
      areaId,
      primaryContactInfo,
      secondContactInfo,
      active,
      notes,
    } = req.body;
    isZipCode(addressZip, 'Zip code is invalid');
    isNumeric(areaId, 'Area Id must be a Number');
    isPhoneNumber(primaryContactInfo.phoneNumber, 'Invalid Primary Phone Number');
    isBoolean(active, 'Active is not a boolean');
    if (secondContactInfo) {
      isPhoneNumber(secondContactInfo.phoneNumber, 'Invalid Second Phone Number');
    }

    const primaryContactId = await addContact(primaryContactInfo);
    let secondContactId = null;
    if (secondContactInfo) {
      secondContactId = await addContact(secondContactInfo);
    }

    const newSite = await db.query(
      `INSERT INTO site (
        site_name, address_street, address_city,
        address_zip, area_id, primary_contact_id
        ${secondContactId ? ', second_contact_id' : ''}
        , active
        ${notes ? ', notes' : ''})
      VALUES (
        $(siteName), $(addressStreet), $(addressCity),
        $(addressZip), $(areaId), $(primaryContactId)
        ${secondContactId ? ', $(secondContactId)' : ''}
        , $(active)
        ${notes ? ', $(notes)' : ''})
      RETURNING *`,
      {
        siteName,
        addressStreet,
        addressCity,
        addressZip,
        areaId,
        primaryContactId,
        secondContactId,
        active,
        notes,
      },
    );

    const site = await pool.query(getSites(false), [newSite[0].site_id]);
    res.status(200).send(keysToCamel(site.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a site
router.put('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const {
      siteName,
      addressStreet,
      addressCity,
      addressZip,
      areaId,
      primaryContactId,
      secondContactId,
      active,
      notes,
    } = req.body;
    if (addressZip) {
      isZipCode(addressZip, 'Zip code is invalid');
    }
    if (areaId) {
      isNumeric(areaId, 'Area Id must be a Number');
    }
    if (primaryContactId) {
      isNumeric(primaryContactId, 'Primary Contact Id must be a Number');
    }
    if (active) {
      isBoolean(active, 'Active is not a boolean');
    }
    if (secondContactId) {
      isNumeric(secondContactId, 'Secondary Contact Id must be a Number');
    }
    await db.query(
      `UPDATE site
      SET site_id = $(siteId)
      ${siteName ? ', site_name = $(siteName)' : ''}
      ${addressStreet ? ', address_street = $(addressStreet)' : ''}
      ${addressCity ? ', address_city = $(addressCity)' : ''}
      ${addressZip ? ', address_zip = $(addressZip)' : ''}
      ${areaId ? ', area_id = $(areaId)' : ''}
      ${primaryContactId ? ', primary_contact_id = $(primaryContactId)' : ''}
      ${secondContactId ? ', second_contact_id = $(secondContactId)' : ''}
      ${active != null ? `, active = '$(active)'` : ''}
      ${notes ? ', notes = $(notes)' : ''}
      WHERE site_id = $(siteId)
      RETURNING *;`,
      {
        siteId,
        siteName,
        addressStreet,
        addressCity,
        addressZip,
        areaId,
        primaryContactId,
        secondContactId,
        active,
        notes,
      },
    );
    const site = await pool.query(getSites(false), [siteId]);
    res.status(200).send(keysToCamel(site.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete site
// does not delete area, master teacher, or students from site
router.delete('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const site = await pool.query('DELETE FROM site WHERE site_id = $1 RETURNING *', [siteId]);
    res.status(200).send(keysToCamel(site.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
