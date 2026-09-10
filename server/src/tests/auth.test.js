/**
 * End-to-end auth flow test script.
 *
 * Usage:  node src/tests/auth.test.js
 *
 * Requires the server to be running on the configured PORT.
 * Uses the native fetch API (Node 18+).
 */

const BASE = process.env.API_URL || 'http://localhost:5000/api';

// Generate a unique email for each test run
const TEST_EMAIL = `test_${Date.now()}@ashbourne.com`;
const TEST_PASSWORD = 'TestPass123';
const TEST_NAME = 'Test User';

let accessToken = null;
let refreshCookie = null;

// ─── Helpers ───

function extractCookie(headers, name) {
  const setCookies = headers.getSetCookie?.() || [];
  for (const c of setCookies) {
    if (c.startsWith(`${name}=`)) {
      return c.split(';')[0].split('=').slice(1).join('=');
    }
  }
  return null;
}

async function test(label, fn) {
  try {
    await fn();
    console.log(`  ✅  ${label}`);
  } catch (err) {
    console.error(`  ❌  ${label}`);
    console.error(`      ${err.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ─── Tests ───

async function run() {
  console.log(`\n🧪  Auth flow tests against ${BASE}\n`);

  // 1. Register
  await test('POST /auth/register → 201 + tokens', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    assert(body.data.accessToken, 'Missing accessToken');
    assert(body.data.user.email === TEST_EMAIL, 'Email mismatch');
    accessToken = body.data.accessToken;
    refreshCookie = extractCookie(res.headers, 'refreshToken');
    assert(refreshCookie, 'Missing refreshToken cookie');
  });

  // 2. Duplicate register
  await test('POST /auth/register (duplicate) → 409', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    assert(res.status === 409, `Expected 409, got ${res.status}`);
  });

  // 3. Login
  await test('POST /auth/login → 200 + tokens', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.success === true, 'Expected success: true');
    accessToken = body.data.accessToken;
    refreshCookie = extractCookie(res.headers, 'refreshToken');
    assert(refreshCookie, 'Missing refreshToken cookie');
  });

  // 4. GET /me with valid token
  await test('GET /auth/me → 200 + user profile', async () => {
    const res = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.user.email === TEST_EMAIL, 'Email mismatch');
    assert(!body.data.user.password, 'Password should not be returned');
  });

  // 5. GET /me without token
  await test('GET /auth/me (no token) → 401', async () => {
    const res = await fetch(`${BASE}/auth/me`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 6. Refresh
  await test('POST /auth/refresh → 200 + new tokens', async () => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refreshToken=${refreshCookie}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.accessToken, 'Missing new accessToken');
    accessToken = body.data.accessToken;
    const newRefresh = extractCookie(res.headers, 'refreshToken');
    assert(newRefresh, 'Missing new refreshToken cookie');
    assert(newRefresh !== refreshCookie, 'Token should have rotated');
    refreshCookie = newRefresh;
  });

  // 7. Old refresh token should be invalid (replay detection)
  // (already deleted by rotation — but we can't easily test this without
  //  saving the old token before step 6, so we skip for now)

  // 8. Logout
  await test('POST /auth/logout → 200', async () => {
    const res = await fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `refreshToken=${refreshCookie}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 9. Refresh after logout → 401
  await test('POST /auth/refresh (after logout) → 401', async () => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refreshToken=${refreshCookie}` },
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 10. Validation: register with short password
  await test('POST /auth/register (short password) → 400', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad',
        email: 'bad@test.com',
        password: '123',
      }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // 11. Validation: login with wrong password
  await test('POST /auth/login (wrong password) → 401', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'wrongpassword123',
      }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log('\n✨  Auth tests complete\n');
}

run();
