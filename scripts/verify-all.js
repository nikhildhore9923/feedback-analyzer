// scripts/verify-all.js
// Verification suite for Pulse Backend & Frontend contracts

const path = require('path');

async function runTests() {
  console.log('====================================================');
  console.log('   PULSE COMPREHENSIVE VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extraInfo = '') {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} ${extraInfo}`);
      failed++;
    }
  }

  // 1. Verify JWT Config
  try {
    const { getJwtSecret } = require('../backend-node/src/config/jwtConfig');
    const secret = getJwtSecret();
    assert('JWT Secret loaded and is non-empty string', typeof secret === 'string' && secret.length > 5);
  } catch (err) {
    assert('JWT Secret loaded', false, err.message);
  }

  // 2. Verify Mailer exports
  try {
    const mailer = require('../backend-node/src/utils/mailer');
    assert('mailer.sendTrendAlertEmail is exported as a function', typeof mailer.sendTrendAlertEmail === 'function');
    assert('mailer.sendAlertEmail is exported as a function', typeof mailer.sendAlertEmail === 'function');
  } catch (err) {
    assert('Mailer exports verified', false, err.message);
  }

  // 3. Verify Validation Middleware
  try {
    const validate = require('../backend-node/src/middleware/validate');
    assert('validateSignup middleware exists', typeof validate.validateSignup === 'function');
    assert('validateLogin middleware exists', typeof validate.validateLogin === 'function');
    assert('validateReviewSubmission middleware exists', typeof validate.validateReviewSubmission === 'function');
    assert('validateStatusUpdate middleware exists', typeof validate.validateStatusUpdate === 'function');
    assert('validateSettings middleware exists', typeof validate.validateSettings === 'function');
  } catch (err) {
    assert('Validation middleware exists', false, err.message);
  }

  // 4. Verify Rate Limiter Middleware
  try {
    const rateLimiter = require('../backend-node/src/middleware/rateLimiter');
    assert('authLimiter middleware exists', typeof rateLimiter.authLimiter === 'function');
    assert('reviewSubmitLimiter middleware exists', typeof rateLimiter.reviewSubmitLimiter === 'function');
    assert('bulkUploadLimiter middleware exists', typeof rateLimiter.bulkUploadLimiter === 'function');
    assert('summaryLimiter middleware exists', typeof rateLimiter.summaryLimiter === 'function');
  } catch (err) {
    assert('Rate limiter middleware exists', false, err.message);
  }

  // 5. Verify Auth Middleware handles missing, malformed, expired, and valid tokens
  try {
    const authMiddleware = require('../backend-node/src/middleware/authMiddleware');
    const jwt = require('../backend-node/node_modules/jsonwebtoken');
    const { getJwtSecret } = require('../backend-node/src/config/jwtConfig');
    const secret = getJwtSecret();

    // 5a. Missing token
    let resStatus = null;
    let resJson = null;
    let nextCalled = false;
    authMiddleware({ headers: {} }, { status: (s) => ({ json: (j) => { resStatus = s; resJson = j; } }) }, () => { nextCalled = true; });
    assert('authMiddleware returns 401 when Authorization header is missing', resStatus === 401);

    // 5b. Valid token
    const validToken = jwt.sign({ userId: 1, email: 'test@pulse.com', tenantId: 't-123' }, secret, { expiresIn: '1h' });
    let reqUser = null;
    let reqTenant = null;
    nextCalled = false;
    const reqWithValidToken = { headers: { authorization: `Bearer ${validToken}` } };
    authMiddleware(reqWithValidToken, { status: () => ({ json: () => {} }) }, () => {
      nextCalled = true;
      reqUser = reqWithValidToken.user;
      reqTenant = reqWithValidToken.tenantId;
    });
    assert('authMiddleware accepts valid JWT and attaches req.user and req.tenantId', nextCalled && reqUser && reqTenant === 't-123');

    // 5c. Expired token
    const expiredToken = jwt.sign({ userId: 1, email: 'test@pulse.com', tenantId: 't-123' }, secret, { expiresIn: '-10s' });
    resStatus = null;
    resJson = null;
    nextCalled = false;
    authMiddleware({ headers: { authorization: `Bearer ${expiredToken}` } }, { status: (s) => ({ json: (j) => { resStatus = s; resJson = j; } }) }, () => { nextCalled = true; });
    assert('authMiddleware returns 401 for expired token with clear session message', resStatus === 401 && resJson && (resJson.error || resJson.message).toLowerCase().includes('expired'));

    // 5d. Tampered token
    const tamperedToken = validToken.slice(0, -5) + 'xxxxx';
    resStatus = null;
    resJson = null;
    nextCalled = false;
    authMiddleware({ headers: { authorization: `Bearer ${tamperedToken}` } }, { status: (s) => ({ json: (j) => { resStatus = s; resJson = j; } }) }, () => { nextCalled = true; });
    assert('authMiddleware rejects tampered/invalid signature token with 401', resStatus === 401);

  } catch (err) {
    assert('Auth middleware unit test', false, err.message);
  }

  // 6. Test Input Validators
  try {
    const validate = require('../backend-node/src/middleware/validate');
    
    // Empty review test
    let statusSet = null;
    let jsonSent = null;
    validate.validateReviewSubmission({ body: { text: '   ' } }, { status: (s) => ({ json: (j) => { statusSet = s; jsonSent = j; } }) }, () => {});
    assert('validateReviewSubmission blocks empty text with 400', statusSet === 400);

    // Oversized review test (>5000 chars)
    statusSet = null;
    validate.validateReviewSubmission({ body: { text: 'a'.repeat(5001) } }, { status: (s) => ({ json: (j) => { statusSet = s; jsonSent = j; } }) }, () => {});
    assert('validateReviewSubmission blocks text > 5000 chars with 400', statusSet === 400);

    // Invalid status test
    statusSet = null;
    validate.validateStatusUpdate({ params: { id: '1' }, body: { status: 'Hacked' } }, { status: (s) => ({ json: (j) => { statusSet = s; jsonSent = j; } }) }, () => {});
    assert('validateStatusUpdate blocks illegal status with 400', statusSet === 400);

    // Valid status test
    let nextPassed = false;
    validate.validateStatusUpdate({ params: { id: '1' }, body: { status: 'Resolved' } }, { status: () => ({ json: () => {} }) }, () => { nextPassed = true; });
    assert('validateStatusUpdate allows valid status "Resolved"', nextPassed);

  } catch (err) {
    assert('Input validator edge cases', false, err.message);
  }

  // 7. Verify Routes file can load without throwing
  try {
    const routes = require('../backend-node/src/routes/index');
    assert('Express routes index module loads without error', typeof routes === 'function');
  } catch (err) {
    assert('Express routes index module', false, err.message);
  }

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
