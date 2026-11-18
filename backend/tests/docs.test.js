import { fileURLToPath } from 'node:url';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-secret-test-secret-test-secret-key';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wasteless_test';
process.env.CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

const specPath = fileURLToPath(
  new URL('../docs/openapi.yaml', import.meta.url),
);

let app;

before(async () => {
  ({ default: app } = await import('../src/app.js'));
});

describe('Dokumentasi OpenAPI', () => {
  it('spesifikasi valid dan memuat seluruh endpoint utama', async () => {
    const api = await SwaggerParser.validate(specPath);

    assert.equal(api.info.version, '0.1.0');
    assert.ok(api.paths['/auth/login']);
    assert.ok(api.paths['/foods']);
    assert.ok(api.paths['/reservations/{id}/ready']);
    assert.ok(api.paths['/distributions/{id}/verify-pickup']);
    assert.ok(api.paths['/analytics/provider']);
    assert.ok(api.paths['/analytics/receiver']);
    assert.ok(api.paths['/analytics/platform']);
    assert.ok(api.components.schemas.Distribution.properties.unit);
    assert.ok(api.components.securitySchemes.bearerAuth);
  });

  it('menyajikan Swagger UI', async () => {
    const response = await request(app).get('/api/docs/');

    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /text\/html/);
    assert.match(response.text, /id="swagger-ui"/);
    assert.match(response.text, /WasteLess API/);
  });

  it('menyajikan spesifikasi JSON', async () => {
    const response = await request(app).get('/api/docs.json');

    assert.equal(response.status, 200);
    assert.equal(response.body.openapi, '3.0.3');
    assert.ok(response.body.paths['/auth/register']);
  });
});
