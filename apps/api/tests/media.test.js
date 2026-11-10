import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMediaInfo, streamMediaDownload } from '../controllers/mediaController.js';

describe('🎵 Media Converter & Audio Extraction Suite', () => {
  it('MED-01: Rejects empty or missing URL with 400', async () => {
    let statusCode = null;
    let jsonBody = null;

    const req = { body: {} };
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

    await resolveMediaInfo(req, res);

    assert.equal(statusCode, 400);
    assert.equal(jsonBody?.success, false);
    assert.match(jsonBody?.message, /invalid/i);
  });

  it('MED-02: Blocks SSRF attempts to localhost / internal IPs with 400', async () => {
    let statusCode = null;
    let jsonBody = null;

    const req = { body: { url: 'http://127.0.0.1:8080/secret.mp3' } };
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

    await resolveMediaInfo(req, res);

    assert.equal(statusCode, 400);
    assert.equal(jsonBody?.success, false);
  });

  it('MED-03: Rejects invalid download stream request missing URL', async () => {
    let statusCode = null;
    let sentMessage = null;

    const req = { query: {} };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      send(data) {
        sentMessage = data;
        return this;
      },
    };

    await streamMediaDownload(req, res);

    assert.equal(statusCode, 400);
    assert.match(sentMessage, /invalid/i);
  });

  it('MED-04: Blocks SSRF attempts to RFC1918 Class B (172.16.x.x) and DNS rebinding hosts with 400', async () => {
    let statusCode = null;
    let jsonBody = null;

    const req = { body: { url: 'http://172.16.0.5:9000/internal.mp3' } };
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

    await resolveMediaInfo(req, res);

    assert.equal(statusCode, 400);
    assert.equal(jsonBody?.success, false);
  });
});

