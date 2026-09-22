const request = require('supertest');
const app = require('../index');

describe('API smoke (no DB)', () => {
  it('root health returns standard envelope', async () => {
    const res = await request(app).get('/api/');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });

  it('unknown route returns JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, data: null });
  });

  it('login validates body (400) before touching DB', async () => {
    const res = await request(app).post('/api/signin').send({ email: 'bad', password: '' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
  });

  it('protected route without token returns 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false });
  });
});
