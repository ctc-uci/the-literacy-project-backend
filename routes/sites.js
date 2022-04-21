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
  `SELECT site.site_id, site.site_name,
  site.address_street, site.address_city, site.address_zip,
  site.area_id, site.notes, site.active,
  to_json((SELECT s FROM (SELECT primary_contact_first_name AS "firstName",
						  primary_contact_last_name AS "lastName",
						  primary_contact_title AS "title",
						  primary_contact_email AS "email",
						  primary_contact_phone AS "phone") AS s)) as "primaryContactInfo",
  to_json((SELECT s FROM (SELECT second_contact_first_name AS "firstName",
						  second_contact_last_name AS "lastName",
						  second_contact_title AS "title",
						  second_contact_email AS "email",
						  second_contact_phone AS "phone") AS s)) as "secondContactInfo"
  FROM site
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
    res
      .status(200)
      .json(
        keysToCamel(
          sites.rows.map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
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
    res
      .status(200)
      .json(
        keysToCamel(
          sites.rows.map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
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
      addressApt,
      addressState,
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
        site_name, address_street, address_apt, address_city, address_state,
        address_zip, area_id, primary_contact_id
        ${secondContactId ? ', second_contact_id' : ''}
        , active
        ${notes ? ', notes' : ''})
      VALUES (
        $(siteName), $(addressStreet), $(addressApt), $(addressCity), $(addressState)
        $(addressZip), $(areaId), $(primaryContactId)
        ${secondContactId ? ', $(secondContactId)' : ''}
        , $(active)
        ${notes ? ', $(notes)' : ''})
      RETURNING *`,
      {
        siteName,
        addressStreet,
        addressApt,
        addressCity,
        addressState,
        addressZip,
        areaId,
        primaryContactId,
        secondContactId,
        active,
        notes,
      },
    );

    const site = await pool.query(getSites(false), [newSite[0].site_id]);
    res
      .status(200)
      .send(
        keysToCamel(
          [site.rows[0]].map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
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
      addressApt,
      addressCity,
      addressState,
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
      ${addressApt ? ', address_apt = $(addressApt)' : ''}
      ${addressCity ? ', address_city = $(addressCity)' : ''}
      ${addressState ? ', address_state = $(addressState)' : ''}
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
        addressApt,
        addressCity,
        addressState,
        addressZip,
        areaId,
        primaryContactId,
        secondContactId,
        active,
        notes,
      },
    );
    const site = await pool.query(getSites(false), [siteId]);
    res
      .status(200)
      .send(
        keysToCamel(
          site.rows[0].map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
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
    res
      .status(200)
      .send(
        keysToCamel(
          site.rows[0].map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
