import test from 'node:test';
import assert from 'node:assert/strict';
import { storeAsset, getAssetUrl, deleteAsset, getStorageStatus } from '../config/storage.js';

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
});
