import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { resolveTrustProxy, CLOUDFLARE_IP_RANGES } from '../config/trustProxy.js';

/**
 * Resolves req.ip through Express's real proxy-trust logic for a given socket peer + XFF header.
 */
function resolveIp(setting, socketAddr, xff) {
  const app = express();
  if (setting !== undefined) app.set('trust proxy', setting);
  const req = Object.create(app.request);
  req.app = app;
  req.headers = xff ? { 'x-forwarded-for': xff } : {};
  req.connection = req.socket = { remoteAddress: socketAddr };
  return req.ip;
}

const RENDER_LB = '10.201.3.4'; // Render internal load balancer (private)
const CF_EDGE = '172.70.12.34'; // inside 172.64.0.0/13
const VISITOR = '73.12.45.67';
const ATTACKER = '45.33.32.156';

describe('🌐 Reverse-proxy trust (TRUST_PROXY)', () => {
  const cf = resolveTrustProxy('cloudflare');

  it('TP-01: Maps env values to Express settings', () => {
    assert.equal(resolveTrustProxy(undefined), undefined);
    assert.equal(resolveTrustProxy(''), undefined);
    assert.equal(resolveTrustProxy('1'), 1);
    assert.equal(resolveTrustProxy('2'), 2);
    assert.equal(resolveTrustProxy('false'), false);
    assert.equal(resolveTrustProxy('nonsense'), undefined);
    assert.ok(Array.isArray(cf));
    for (const range of CLOUDFLARE_IP_RANGES) assert.ok(cf.includes(range));
  });

  it('TP-02: Cloudflare mode resolves the real visitor behind Cloudflare -> Render', () => {
    assert.equal(resolveIp(cf, RENDER_LB, `${VISITOR}, ${CF_EDGE}`), VISITOR);
  });

  it('TP-03: Spoofed X-Forwarded-For sent through Cloudflare is ignored', () => {
    // Attacker pre-fills XFF; Cloudflare appends the attacker's real IP; Render appends the CF edge
    assert.equal(resolveIp(cf, RENDER_LB, `1.2.3.4, ${ATTACKER}, ${CF_EDGE}`), ATTACKER);
  });

  it('TP-04: Bypassing Cloudflare (direct to *.onrender.com) cannot spoof an IP', () => {
    // No Cloudflare hop: Render appends the attacker's real IP after the forged entry
    assert.equal(resolveIp(cf, RENDER_LB, `${VISITOR}, ${ATTACKER}`), ATTACKER);
  });

  it('TP-05: IPv6 Cloudflare edges are trusted too', () => {
    assert.equal(resolveIp(cf, RENDER_LB, `2001:db8:abcd::1, 2606:4700:10::ac43:1`), '2001:db8:abcd::1');
  });

  it('TP-06: Hop-count mode 1 only sees the Cloudflare edge (why cloudflare mode is preferred)', () => {
    assert.equal(resolveIp(1, RENDER_LB, `${VISITOR}, ${CF_EDGE}`), CF_EDGE);
  });

  it('TP-07: Unset leaves Express default (socket address only)', () => {
    assert.equal(resolveIp(undefined, RENDER_LB, `${VISITOR}, ${CF_EDGE}`), RENDER_LB);
  });
});
