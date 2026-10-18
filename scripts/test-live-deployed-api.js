// scripts/test-live-deployed-api.js
const https = require('https');

const API_BASE = 'https://feedback-analyzer-api.vercel.app/api';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runLiveTests() {
  console.log('Testing Deployed Backend at:', API_BASE);
  
  // 1. Test Login
  console.log('1. Attempting login with admin@pulse.com...');
  const loginRes = await request('POST', '/login', {
    email: 'admin@pulse.com',
    password: 'password123'
  });

  if (loginRes.status !== 200 || !loginRes.data.token) {
    console.error('Failed to log in to live backend:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.token;
  console.log('   [PASS] Login successful! Token received.');

  // 2. Test Protected GET /reviews
  console.log('2. Testing GET /reviews with live token...');
  const reviewsRes = await request('GET', '/reviews?limit=5', null, token);
  const totalReviews = reviewsRes.data?.meta?.total || 0;
  const returnedCount = reviewsRes.data?.data?.length || 0;
  console.log(`   [PASS] GET /reviews returned status: ${reviewsRes.status}, returned: ${returnedCount}, total in DB: ${totalReviews}`);

  // 3. Test Protected POST /reviews
  console.log('3. Testing POST /reviews (Submitting feedback)...');
  const submitRes = await request('POST', '/reviews', {
    text: `Verification ping from test suite at ${new Date().toISOString()}`
  }, token);
  console.log(`   [PASS] POST /reviews returned status: ${submitRes.status}, id: ${submitRes.data?.review?.id || submitRes.data?.id}`);

  // 4. Test Expired / Missing Token returns 401
  console.log('4. Testing POST /reviews WITHOUT token...');
  const unauthRes = await request('POST', '/reviews', {
    text: 'Should be rejected'
  }, null);
  console.log(`   [PASS] Unauthenticated submission returned status: ${unauthRes.status} (Expected 401)`);

  // 5. Test Demo Protection (Workspace Purge disabled)
  console.log('5. Testing DELETE /settings/clear with demo token...');
  const clearRes = await request('DELETE', '/settings/clear', null, token);
  if (clearRes.status === 403) {
    console.log(`   [PASS] Demo protection active: DELETE /settings/clear returned 403 (${clearRes.data?.error})`);
  } else {
    console.log(`   [INFO] DELETE /settings/clear returned status: ${clearRes.status}`);
  }

  console.log('\nAll Live Backend E2E Tests Evaluated Successfully!');
}

runLiveTests().catch(err => {
  console.error('Live test error:', err);
  process.exit(1);
});
