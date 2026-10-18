const https = require('https');

https.get('https://feedback-analyzer-beta.vercel.app', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const jsMatch = body.match(/src="(\/assets\/index-[^"]+\.js)"/);
    console.log('Status:', res.statusCode);
    console.log('Deployed JS bundle:', jsMatch ? jsMatch[1] : 'NOT FOUND');
  });
}).on('error', (e) => console.error('Fetch error:', e.message));
