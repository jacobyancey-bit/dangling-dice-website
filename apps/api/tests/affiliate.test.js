import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redirectPartner, getPartnerDirectory } from '../controllers/affiliateController.js';

describe('🛡️ Partner Attribution & Privacy Redirect Suite', () => {
  it('AFF-01: Successfully redirects /go/atlas with 302 and safe tracking UTMs', () => {
    let statusCode = null;
    let redirectLocation = null;
    const headers = {};

    const req = {
      params: { slug: 'atlas' },
      query: { src: 'mongo_tool' },
    };

    const res = {
      setHeader(name, value) {
        headers[name] = value;
      },
      redirect(code, location) {
        statusCode = code;
        redirectLocation = location;
      },
    };

    redirectPartner(req, res);

    assert.equal(statusCode, 302, 'Should issue a 302 temporary redirect');
    assert.ok(redirectLocation, 'Must provide redirect Location header');
    assert.match(redirectLocation, /mongodb\.com/i, 'Location must point to verified partner domain');
    assert.match(redirectLocation, /utm_source=danglingdice/i, 'Must attach safe attribution utm_source');
    assert.match(redirectLocation, /utm_campaign=mongo_tool/i, 'Must attach sanitized subID');
    assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
    assert.equal(headers['Cache-Control'], 'no-store, max-age=0');
  });

  it('AFF-01b: Successfully redirects /go/media with 302 to media subdomain', () => {
    let statusCode = null;
    let redirectLocation = null;

    const req = {
      params: { slug: 'media' },
      query: { src: 'main_hub' },
    };

    const res = {
      setHeader() {},
      redirect(code, location) {
        statusCode = code;
        redirectLocation = location;
      },
    };

    redirectPartner(req, res);

    assert.equal(statusCode, 302);
    assert.match(redirectLocation, /media\.dangling-dice-studios\.com/i);
    assert.match(redirectLocation, /utm_source=danglingdice/i);
  });

  it('AFF-02: Returns 404 for unrecognized partner slug', () => {
    let statusCode = null;
    let jsonBody = null;

    const req = {
      params: { slug: 'unrecognized_partner_xyz' },
      query: {},
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      },
    };

    redirectPartner(req, res);

    assert.equal(statusCode, 404);
    assert.equal(jsonBody?.success, false);
  });

  it('AFF-03: Returns active partner directory at /api/affiliates with enriched metadata', () => {
    let statusCode = null;
    let jsonBody = null;

    const req = {};
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      },
    };

    getPartnerDirectory(req, res);

    assert.equal(statusCode, 200);
    assert.equal(jsonBody?.success, true);
    assert.ok(Array.isArray(jsonBody?.data));
    assert.ok(jsonBody.data.length >= 5, 'Should return at least 5 studio partners');
    assert.ok(jsonBody.data.some((p) => p.slug === 'atlas'));
    assert.ok(
      jsonBody.data.every((p) => typeof p.description === 'string' && typeof p.perkBadge === 'string' && typeof p.icon === 'string'),
      'Each partner must contain description, perkBadge, and icon'
    );
  });
});
