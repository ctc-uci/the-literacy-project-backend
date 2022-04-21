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

    await addContact(primaryContactInfo);
    if (secondContactInfo) {
      await addContact(secondContactInfo);
    }

    const newSite = await db.query(
      `INSERT INTO site (
        site_name, address_street, address_apt, address_city, address_state,
        address_zip, area_id, primary_contact_first_name, primary_contact_last_name,
        primary_contact_title, primary_contact_phone_number,
        ${secondContactInfo.firstName ? ', second_contact_first_name' : ''},
        ${secondContactInfo.lastName ? ', second_contact_last_name' : ''},
        ${secondContactInfo.title ? ', second_contact_title' : ''},
        ${secondContactInfo.email ? ', second_contact_email' : ''},
        ${secondContactInfo.phoneNumber ? ', second_contact_phone_number' : ''}
        , active
        ${notes ? ', notes' : ''})
      VALUES (
        $(siteName), $(addressStreet), $(addressApt), $(addressCity), $(addressState)
        $(addressZip), $(areaId), $(primaryContactInfo.firstName), $(primaryContactInfo.lastName),
        $(primaryContactInfo.title), $(primaryContactInfo.email), $(primaryContact.phoneNumber)
        ${secondContactInfo.firstName ? ', $(secondContactInfo.firstName)' : ''},
        ${secondContactInfo.lastName ? ', $(secondContactInfo.lastName)' : ''},
        ${secondContactInfo.title ? ', $(secondContactInfo.title)' : ''},
        ${secondContactInfo.email ? ', $(secondContacInfo.email)' : ''},
        ${secondContactInfo.phoneNumber ? ', $(secondContactInfo.phoneNumber)' : ''},
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
        primaryContactInfo,
        secondContactInfo,
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
      addressApt,
      addressCity,
      addressState,
      addressZip,
      areaId,
      primaryContactInfo,
      secondContactInfo,
      active,
      notes,
    } = req.body;
    if (addressZip) {
      isZipCode(addressZip, 'Zip code is invalid');
    }
    if (areaId) {
      isNumeric(areaId, 'Area Id must be a Number');
    }
    if (active) {
      isBoolean(active, 'Active is not a boolean');
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
      ${
        primaryContactInfo && primaryContactInfo.firstName
          ? ', primary_contact_first_name = $(primaryContactInfo.firstName)'
          : ''
      },
      ${
        primaryContactInfo && primaryContactInfo.lastName
          ? ', primary_contact_last_name = $(primaryContactInfo.lastName)'
          : ''
      },
      ${
        primaryContactInfo && primaryContactInfo.title
          ? ', primary_contact_title = $(primaryontactInfo.title)'
          : ''
      },
      ${
        primaryContactInfo && primaryContactInfo.email
          ? ', primary_contact_email = $(primaryContactInfo.email)'
          : ''
      },
      ${
        primaryContactInfo && primaryContactInfo.phoneNumber
          ? ', primary_contact_phone_number = $(primaryContactInfo.phoneNumber'
          : ''
      }
      ${
        secondContactInfo && secondContactInfo.firstName
          ? ', second_contact_first_name = $(secondContactInfo.firstName)'
          : ''
      },
      ${
        secondContactInfo && secondContactInfo.lastName
          ? ', second_contact_last_name = $(secondContactInfo.lastName)'
          : ''
      },
      ${
        secondContactInfo && secondContactInfo.title
          ? ', second_contact_title = $(secondContactInfo.title)'
          : ''
      },
      ${
        secondContactInfo && secondContactInfo.email
          ? ', second_contact_email = $(secondContactInfo.email)'
          : ''
      },
      ${
        secondContactInfo && secondContactInfo.phoneNumber
          ? ', second_contact_phone_number = $(secondContactInfo.phoneNumber'
          : ''
      }
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
        primaryContactInfo,
        secondContactInfo,
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
