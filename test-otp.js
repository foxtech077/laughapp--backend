const { execSync, spawn } = require('child_process');
const http = require('http');

function killServer() {
  try { execSync('pkill -f "node.*dist/main" 2>/dev/null', { stdio: 'ignore' }); } catch {}
}

function curl(method, path, body) {
  return new Promise((resolve, reject) => {
    if (!body) {
      const req = http.get({ hostname: 'localhost', port: 3000, path, method: 'GET' }, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
      });
      req.on('error', reject); return;
    }
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function main() {
  killServer();
  await new Promise(r => setTimeout(r, 2000));

  // Start server
  const server = spawn('node', ['dist/main.js'], {
    cwd: '/home/mubashir/.openclaw/workspace/laughapp--backend',
    detached: true, stdio: 'ignore'
  });
  server.unref();
  await new Promise(r => setTimeout(r, 12000));

  console.log('=== TEST 0: health ===');
  try { const r0 = await curl('GET', '/api/v1/health', null); console.log(JSON.stringify(r0, null, 2)); } catch(e) { console.log('FAIL:', e.message); }

  console.log('\n=== TEST 1: send-otp ===');
  const r1 = await curl('POST', '/api/v1/auth/send-otp', { phoneNumber: '+15550019999' });
  console.log(JSON.stringify(r1, null, 2));

  console.log('\n=== TEST 2: verify-otp (signup) ===');
  const r2 = await curl('POST', '/api/v1/auth/verify-otp', { phoneNumber: '+15550019999', otp: '019999', source: { videoId: 'test-video' } });
  console.log(JSON.stringify(r2, null, 2));

  console.log('\n=== TEST 3: verify-otp (login) ===');
  const r3 = await curl('POST', '/api/v1/auth/verify-otp', { phoneNumber: '+15550019999', otp: '019999' });
  console.log(JSON.stringify(r3, null, 2));

  console.log('\n=== TEST 4: invalid OTP ===');
  const r4 = await curl('POST', '/api/v1/auth/verify-otp', { phoneNumber: '+15550019999', otp: '000000' });
  console.log(JSON.stringify(r4, null, 2));

  killServer();
}

main().catch(e => { console.error(e); killServer(); });