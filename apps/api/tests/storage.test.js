import test from 'node:test';
import assert from 'node:assert/strict';
import { storeAsset, getAssetUrl, deleteAsset, getStorageStatus } from '../config/storage.js';
import storageRoutes from '../routes/storageRoutes.js';

test('📦 Cloudflare R2 / Local Storage Adapter Suite', async (t) => {
  await t.test('STOR-01: Correctly reports storage status telemetry', () => {
    const status = getStorageStatus();
    assert.ok(status);
    assert.strictEqual(typeof status.configured, 'boolean');
    assert.strictEqual(typeof status.provider, 'string');
    assert.strictEqual(status.zeroEgress, true);
    assert.ok(status.bucket);
  });

  await t.test('STOR-02: Successfully stores asset and retrieves valid URL', async () => {
    const testFileName = `test-kit-${Date.now()}.txt`;
    const testBuffer = Buffer.from('Dangling Dice Studios Sound Kit Test Payload');

    const result = await storeAsset(testFileName, testBuffer, 'text/plain');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.filename, testFileName);
    assert.strictEqual(result.sizeBytes, testBuffer.length);
    assert.ok(result.url);

    const assetUrl = await getAssetUrl(testFileName);
    assert.ok(assetUrl);

    // Clean up
    const deleteResult = await deleteAsset(testFileName);
    assert.strictEqual(deleteResult.success, true);
  });

  await t.test('STOR-03: Storage routes handle status query cleanly', async () => {
    let responseData = null;
    const req = {};
    const res = {
      json: (data) => {
        responseData = data;
        return res;
      },
    };

    // Simulate route handler for GET /status
    const statusLayer = storageRoutes.stack.find((l) => l.route && l.route.path === '/status');
    assert.ok(statusLayer, 'GET /status route must be defined');

    statusLayer.route.stack[0].handle(req, res);
    assert.ok(responseData);
    assert.strictEqual(responseData.success, true);
    assert.ok(responseData.storage);
  });

  await t.test('STOR-04: Storage download route safely rejects path traversal attempts', async () => {
    let statusCode = null;
    let responseData = null;
    const req = {
      params: { filename: '../../sensitive.env' },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
      redirect: () => {},
      sendFile: () => {},
      setHeader: () => {},
    };

    const downloadLayer = storageRoutes.stack.find((l) => l.route && l.route.path === '/download/:filename');
    assert.ok(downloadLayer, 'GET /download/:filename route must be defined');

    // path.basename('../../sensitive.env') resolves to 'sensitive.env', which doesn't exist -> 404
    await downloadLayer.route.stack[0].handle(req, res);
    assert.strictEqual(statusCode, 404);
    assert.strictEqual(responseData.success, false);
  });
});
