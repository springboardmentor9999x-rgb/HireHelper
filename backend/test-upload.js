/**
 * Test file upload to task API
 * This script tests the file upload functionality
 * 
 * Usage: node test-upload.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Note: In production, you would need to set the JWT token
// For this test, replace TOKEN with actual JWT token from login

const TOKEN = 'your_jwt_token_here';
const API_URL = 'http://localhost:5000';

// Create a simple test image (1x1 pixel PNG)
function createTestImage() {
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testDir = path.join(__dirname, 'test-uploads');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const imagePath = path.join(testDir, 'test-image.png');
  fs.writeFileSync(imagePath, pngBuffer);
  return imagePath;
}

// Test multipart form data
function testFileUpload() {
  const imagePath = createTestImage();
  const fileStream = fs.createReadStream(imagePath);
  const fileSize = fs.statSync(imagePath).size;

  console.log(`\n📸 Test image created: ${imagePath}`);
  console.log(`File size: ${fileSize} bytes\n`);

  // Prepare multipart form data
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';

  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="title"\r\n\r\n';
  body += 'Test Task\r\n';

  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="description"\r\n\r\n';
  body += 'This is a test task with image upload\r\n';

  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="category"\r\n\r\n';
  body += 'Other\r\n';

  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="location"\r\n\r\n';
  body += 'Test Location\r\n';

  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="start_time"\r\n\r\n';
  body += new Date().toISOString() + '\r\n';

  body += `--${boundary}\r\n`;
  body += 'Content-Disposition: form-data; name="image"; filename="test-image.png"\r\n';
  body += 'Content-Type: image/png\r\n\r\n';

  const bodyBytes = Buffer.from(body);
  const footerBytes = Buffer.from(`\r\n--${boundary}--\r\n`);
  const totalSize = bodyBytes.length + fileSize + footerBytes.length;

  console.log(`📤 Uploading test task with image...`);
  console.log(`Total payload size: ${totalSize} bytes\n`);

  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/tasks',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': totalSize,
      'Authorization': `Bearer ${TOKEN}`
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`\n✅ Response Status: ${res.statusCode}`);
      console.log(`Response Headers:`, res.headers);
      console.log(`\nResponse Body:`);
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(data);
      }

      // Cleanup
      fs.unlinkSync(imagePath);
      const testDir = path.join(__dirname, 'test-uploads');
      if (fs.readdirSync(testDir).length === 0) {
        fs.rmdirSync(testDir);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request error:', err);
  });

  req.write(bodyBytes);
  req.write(fs.readFileSync(imagePath));
  req.write(footerBytes);
  req.end();
}

if (TOKEN === 'your_jwt_token_here') {
  console.log('❌ Error: Please set a valid JWT token first');
  console.log('1. Login to get a token');
  console.log('2. Replace TOKEN variable in this script');
  console.log('3. Run again\n');
  process.exit(1);
}

testFileUpload();
