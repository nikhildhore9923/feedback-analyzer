// scripts/seed-production-demo.js
// Seeds misc/sample_reviews.csv into the live production backend for the demo account
const fs = require('fs');
const https = require('https');

async function seed() {
  console.log('Seeding demo reviews into production backend...');

  const loginData = JSON.stringify({ email: 'admin@pulse.com', password: 'password123' });
  const loginReq = https.request('https://feedback-analyzer-api.vercel.app/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const loginJson = JSON.parse(d);
      if (!loginJson.token) {
        console.error('Login failed:', loginJson);
        process.exit(1);
      }
      const token = loginJson.token;
      console.log('Login successful. Uploading sample_reviews.csv...');

      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const fileData = fs.readFileSync('./misc/sample_reviews.csv');
      
      const parts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample_reviews.csv"\r\nContent-Type: text/csv\r\n\r\n`,
        fileData,
        `\r\n--${boundary}--\r\n`
      ];

      const body = Buffer.concat([
        Buffer.from(parts[0]),
        parts[1],
        Buffer.from(parts[2])
      ]);

      const uploadReq = https.request('https://feedback-analyzer-api.vercel.app/api/reviews/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        }
      }, res2 => {
        let d2 = '';
        res2.on('data', c => d2 += c);
        res2.on('end', () => {
          console.log('Upload status:', res2.statusCode);
          console.log('Upload response:', d2);
        });
      });

      uploadReq.on('error', err => console.error('Upload error:', err));
      uploadReq.write(body);
      uploadReq.end();
    });
  });

  loginReq.on('error', err => console.error('Login error:', err));
  loginReq.write(loginData);
  loginReq.end();
}

seed();
