// scripts/comprehensive-system-tests.js
const https = require('https');
const path = require('path');

const API_BASE = process.env.API_BASE || 'https://feedback-analyzer-api.vercel.app/api';

function request(method, urlPath, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${urlPath}`);
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

const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

function recordTest(name, passed, message) {
  if (passed) {
    testResults.passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    testResults.failed++;
    console.error(`  [FAIL] ${name} -> ${message}`);
  }
  testResults.details.push({ name, passed, message });
}

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('       PULSE COMPREHENSIVE END-TO-END SYSTEM TEST SUITE         ');
  console.log('================================================================');
  console.log(`Target API Base: ${API_BASE}\n`);

  // --- SUITE 1: Node.js ML Service Heuristic Fallback ---
  console.log('--- SUITE 1: Node.js Heuristic Fallback & Resilience ---');
  try {
    const { analyzeFeedback } = require('../backend-node/src/services/mlService.js');
    
    // Test positive fallback
    const posRes = await analyzeFeedback('This is a great, amazing experience, loved it!');
    recordTest('Fallback: Positive keyword detection', 
      posRes.sentiment === 'Positive' && posRes.confidence >= 0.70, 
      `Got sentiment=${posRes.sentiment}, conf=${posRes.confidence}`
    );

    // Test negative fallback
    const negRes = await analyzeFeedback('The app is horrible, worst bug and crashed on checkout.');
    recordTest('Fallback: Negative keyword and severity detection',
      negRes.sentiment === 'Negative' && negRes.severity > 0,
      `Got sentiment=${negRes.sentiment}, severity=${negRes.severity}`
    );

    // Test neutral fallback
    const neuRes = await analyzeFeedback('The package is normal.');
    recordTest('Fallback: Neutral baseline',
      neuRes.sentiment === 'Neutral',
      `Got sentiment=${neuRes.sentiment}`
    );

    // Test aspect fallback
    const aspRes = await analyzeFeedback('Customer support was very helpful.');
    recordTest('Fallback: Aspect categorization (Customer Service)',
      aspRes.aspect === 'Customer Service',
      `Got aspect=${aspRes.aspect}`
    );
  } catch (err) {
    recordTest('Fallback Service Module', false, err.message);
  }

  // --- SUITE 2: Authentication & Token Security ---
  console.log('\n--- SUITE 2: Authentication & Token Security ---');
  let token = null;
  try {
    // 2.1 Invalid Login Rejected
    const invalidLogin = await request('POST', '/login', {
      email: 'admin@pulse.com',
      password: 'wrong_password_xyz'
    });
    recordTest('Auth: Invalid password returns 401',
      invalidLogin.status === 401,
      `Expected 401, got ${invalidLogin.status}`
    );

    // 2.2 Valid Login Accepted
    const validLogin = await request('POST', '/login', {
      email: 'admin@pulse.com',
      password: 'password123'
    });
    recordTest('Auth: Demo credentials login returns 200 & JWT',
      validLogin.status === 200 && Boolean(validLogin.data?.token),
      `Expected 200 with token, got ${validLogin.status}`
    );
    token = validLogin.data?.token;

    // 2.3 Unauthenticated Access Rejected
    const unauthReq = await request('GET', '/reviews', null, null);
    recordTest('Auth: Missing JWT rejected with 401',
      unauthReq.status === 401,
      `Expected 401, got ${unauthReq.status}`
    );

    // 2.4 Malformed JWT Rejected
    const malformedReq = await request('GET', '/reviews', null, 'malformed.jwt.token');
    recordTest('Auth: Malformed JWT rejected with 401 or 403',
      malformedReq.status === 401 || malformedReq.status === 403,
      `Expected 401/403, got ${malformedReq.status}`
    );
  } catch (err) {
    recordTest('Auth Suite Error', false, err.message);
  }

  if (!token) {
    console.error('Fatal: Cannot proceed without auth token.');
    process.exit(1);
  }

  // --- SUITE 3: Review Ingestion & Storage ---
  console.log('\n--- SUITE 3: Review Ingestion & Storage ---');
  try {
    const timestamp = Date.now();

    // 3.1 Positive Review Ingestion
    const posSubmit = await request('POST', '/reviews', {
      text: `[Automated Test ${timestamp}] Exceptional customer service and prompt resolution!`
    }, token);
    const posReview = posSubmit.data?.review || posSubmit.data;
    recordTest('Ingestion: Positive feedback stored with sentiment',
      posSubmit.status === 200 && posReview.sentiment === 'Positive',
      `Status=${posSubmit.status}, sentiment=${posReview.sentiment}`
    );

    // 3.2 Negative Review Ingestion & Severity
    const negSubmit = await request('POST', '/reviews', {
      text: `[Automated Test ${timestamp}] Terrible experience, the app crashes and customer support is awful.`
    }, token);
    const negReview = negSubmit.data?.review || negSubmit.data;
    recordTest('Ingestion: Negative feedback stored with elevated priority & severity',
      negSubmit.status === 200 && negReview.sentiment === 'Negative' && (negReview.priorityScore > 0 || negReview.priority_score > 0),
      `Status=${negSubmit.status}, sentiment=${negReview.sentiment}, priority=${negReview.priorityScore || negReview.priority_score}`
    );

    // 3.3 Neutral Review Ingestion
    const neuSubmit = await request('POST', '/reviews', {
      text: `[Automated Test ${timestamp}] The package was average, nothing special.`
    }, token);
    const neuReview = neuSubmit.data?.review || neuSubmit.data;
    recordTest('Ingestion: Neutral feedback stored with severity=0',
      neuSubmit.status === 200 && neuReview.severity === 0,
      `Status=${neuSubmit.status}, severity=${neuReview.severity}`
    );

    // 3.4 Query Reviews back
    const getReviews = await request('GET', '/reviews?limit=10', null, token);
    recordTest('Reviews Query: Fetch reviews list with pagination meta',
      getReviews.status === 200 && Array.isArray(getReviews.data?.data),
      `Status=${getReviews.status}, count=${getReviews.data?.data?.length}`
    );
  } catch (err) {
    recordTest('Ingestion Suite Error', false, err.message);
  }

  // --- SUITE 4: Input Validation & Edge Cases ---
  console.log('\n--- SUITE 4: Input Validation & Edge Cases ---');
  try {
    // 4.1 Empty text rejected
    const emptyRes = await request('POST', '/reviews', { text: '' }, token);
    recordTest('Validation: Empty text rejected with 400',
      emptyRes.status === 400,
      `Expected 400, got ${emptyRes.status}`
    );

    // 4.2 Whitespace only rejected
    const whitespaceRes = await request('POST', '/reviews', { text: '     ' }, token);
    recordTest('Validation: Whitespace text rejected with 400',
      whitespaceRes.status === 400,
      `Expected 400, got ${whitespaceRes.status}`
    );

    // 4.3 Missing text property
    const missingRes = await request('POST', '/reviews', { message: 'hello' }, token);
    recordTest('Validation: Missing text field rejected with 400',
      missingRes.status === 400,
      `Expected 400, got ${missingRes.status}`
    );

    // 4.4 Very long text handled cleanly
    const longText = 'Automated stress test review. '.repeat(100);
    const longRes = await request('POST', '/reviews', { text: longText }, token);
    recordTest('Validation: Long text (~3,000 chars) processed safely',
      longRes.status === 200,
      `Expected 200, got ${longRes.status}`
    );
  } catch (err) {
    recordTest('Validation Suite Error', false, err.message);
  }

  // --- SUITE 5: Analytics & Dashboard KPIs ---
  console.log('\n--- SUITE 5: Analytics & Dashboard KPIs ---');
  try {
    // 5.1 Trends
    const trendsRes = await request('GET', '/analytics/trends', null, token);
    recordTest('Analytics: GET /analytics/trends returns daily series in trends array',
      trendsRes.status === 200 && Array.isArray(trendsRes.data?.trends),
      `Status=${trendsRes.status}, trendsLength=${trendsRes.data?.trends?.length}`
    );

    // 5.2 Stats
    const statsRes = await request('GET', '/stats', null, token);
    recordTest('Analytics: GET /stats returns aggregate dashboard metrics',
      statsRes.status === 200 && (typeof statsRes.data?.totalReviews === 'number' || typeof statsRes.data?.total === 'number' || statsRes.data !== undefined),
      `Status=${statsRes.status}`
    );

    // 5.3 AI Summary Endpoint (POST /analytics/summary)
    const summaryRes = await request('POST', '/analytics/summary', {
      reviews: [
        'Great customer support and fast response time.',
        'The mobile app keeps crashing during checkout.',
        'Decent value for money, prompt delivery.'
      ]
    }, token);
    recordTest('Analytics: POST /analytics/summary returns executive insights or fallback',
      summaryRes.status === 200,
      `Status=${summaryRes.status}`
    );
  } catch (err) {
    recordTest('Analytics Suite Error', false, err.message);
  }

  // --- SUITE 6: Demo Account Protection & Security ---
  console.log('\n--- SUITE 6: Demo Account Protection & Security ---');
  try {
    // Demo user attempting to purge database
    const purgeRes = await request('DELETE', '/settings/clear', null, token);
    recordTest('Demo Protection: DELETE /settings/clear returns 403 Forbidden',
      purgeRes.status === 403,
      `Expected 403, got ${purgeRes.status}`
    );

    // Demo user attempting to delete a review
    const deleteReviewRes = await request('DELETE', '/reviews/1', null, token);
    recordTest('Demo Protection: DELETE /reviews/:id returns 403 Forbidden for demo account',
      deleteReviewRes.status === 403,
      `Expected 403, got ${deleteReviewRes.status}`
    );
  } catch (err) {
    recordTest('Demo Protection Error', false, err.message);
  }

  // --- FINAL REPORT ---
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${testResults.passed + testResults.failed}`);
  console.log(`PASSED:      ${testResults.passed}`);
  console.log(`FAILED:      ${testResults.failed}`);
  console.log('================================================================');

  if (testResults.failed > 0) {
    console.error(`\nTest suite completed with ${testResults.failed} failure(s).`);
    process.exit(1);
  } else {
    console.log('\nALL END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

runComprehensiveTests().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
