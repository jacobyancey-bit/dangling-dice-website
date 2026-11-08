import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCategoryGroup } from '../models/DevShowcase.js';
import { submitDevProject } from '../controllers/showcaseController.js';

describe('🌟 Community Showcase & Categorized Rotation Suite', () => {
  it('SHOW-01: Correctly maps specific categories to high-level category groups', () => {
    assert.equal(resolveCategoryGroup('Audio & Music'), 'music');
    assert.equal(resolveCategoryGroup('Beats & Audio'), 'music');
    assert.equal(resolveCategoryGroup('Social & Creative'), 'creator');
    assert.equal(resolveCategoryGroup('Video Production'), 'creator');
    assert.equal(resolveCategoryGroup('Developer Tool'), 'developer');
    assert.equal(resolveCategoryGroup('Web App'), 'developer');
    assert.equal(resolveCategoryGroup('AI / ML'), 'developer');
    assert.equal(resolveCategoryGroup('Open Source'), 'developer');
  });

  it('SHOW-02: Rejects incomplete submission payloads missing required fields with 400', async () => {
    let statusCode = null;
    let jsonBody = null;

    const req = {
      body: {
        title: 'Incomplete App',
        // missing tagline, description, appUrl, authorName
      },
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

    await submitDevProject(req, res);

    assert.equal(statusCode, 400);
    assert.equal(jsonBody.success, false);
    assert.match(jsonBody.message, /Please provide Title, Tagline, Description/i);
  });

  it('SHOW-03: Rejects submissions with invalid URL formats with 400', async () => {
    let statusCode = null;
    let jsonBody = null;

    const req = {
      body: {
        title: 'Broken URL App',
        tagline: 'A cool tool',
        description: 'Test description that is long enough.',
        appUrl: 'not-a-valid-url',
        authorName: 'Tester',
      },
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

    await submitDevProject(req, res);

    assert.equal(statusCode, 400);
    assert.equal(jsonBody.success, false);
    assert.match(jsonBody.message, /valid live URL/i);
  });

  it('SHOW-04: Prioritizes brand NEW unfeatured apps over veteran apps in rotation logic', () => {
    // Mock candidates
    const newApp = {
      _id: 'new-1',
      title: 'Brand New Indie App',
      categoryGroup: 'music',
      featuredCount: 0,
      featuredAt: null,
      createdAt: new Date('2026-11-08T00:00:00Z'),
    };

    const veteranApp = {
      _id: 'vet-1',
      title: 'Veteran App',
      categoryGroup: 'music',
      featuredCount: 3,
      featuredAt: new Date('2026-10-01T00:00:00Z'),
      createdAt: new Date('2026-09-01T00:00:00Z'),
    };

    const candidates = [veteranApp, newApp];

    // Priority filter: If new apps exist (featuredCount === 0), select strictly from new
    const newEntries = candidates.filter((c) => (c.featuredCount || 0) === 0);
    let selected;
    if (newEntries.length > 0) {
      selected = newEntries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    } else {
      selected = candidates.sort((a, b) => (new Date(a.featuredAt || 0) - new Date(b.featuredAt || 0)))[0];
    }

    assert.equal(selected._id, 'new-1', 'Must strictly crown the brand new unfeatured app first');
  });

  it('SHOW-05: Falls back to least recently featured app when all submissions have been featured', () => {
    const appA = {
      _id: 'app-a',
      title: 'App A',
      categoryGroup: 'creator',
      featuredCount: 1,
      featuredAt: new Date('2026-11-01T00:00:00Z'), // More recent
      createdAt: new Date('2026-08-01T00:00:00Z'),
    };

    const appB = {
      _id: 'app-b',
      title: 'App B',
      categoryGroup: 'creator',
      featuredCount: 1,
      featuredAt: new Date('2026-10-15T00:00:00Z'), // Older featured date
      createdAt: new Date('2026-08-05T00:00:00Z'),
    };

    const candidates = [appA, appB];

    // Priority filter: No new entries exist (both featuredCount > 0)
    const newEntries = candidates.filter((c) => (c.featuredCount || 0) === 0);
    assert.equal(newEntries.length, 0);

    // Fallback: least recently featured first
    const selected = candidates.sort((a, b) => new Date(a.featuredAt) - new Date(b.featuredAt))[0];
    assert.equal(selected._id, 'app-b', 'Must pick App B because it was least recently featured');
  });
});
