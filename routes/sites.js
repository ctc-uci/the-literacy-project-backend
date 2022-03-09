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

const getSites = (allSites) =>
  `SELECT site.*, to_json(contact1) as "primaryContactInfo", to_json(contact2) as "secondContactInfo"
  FROM site
    INNER JOIN general_user as contact1 ON contact1.user_id = site.primary_contact_id
    LEFT JOIN general_user as contact2 ON contact2.user_id = site.second_contact_id
  ${allSites ? '' : 'WHERE site_id = $1'}`;

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
        , active
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
      notes,
    } = req.body;
    isZipCode(addressZip, 'Zip code is invalid');
    isNumeric(areaId, 'Area Id must be a Number');
    isNumeric(primaryContactId, 'Primary Contact Id must be a Number');
    if (secondContactId) {
      isNumeric(secondContactId, 'Secondary Contact Id must be a Number');
    }
    await db.query(
      `UPDATE site
      SET site_name = $(siteName), address_street = $(addressStreet), address_city = $(addressCity),
          address_zip = $(addressZip), area_id = $(areaId), primary_contact_id = $(primaryContactId)
          ${secondContactId ? ', second_contact_id = $(secondContactId)' : ''}
          ${notes ? ', notes = $(notes)' : ''}
      WHERE site_id = $(siteId)
      RETURNING *;`,
      {
        siteName,
        addressStreet,
        addressCity,
        addressZip,
        areaId,
        primaryContactId,
        secondContactId,
        notes,
        siteId,
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

// delete site
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
