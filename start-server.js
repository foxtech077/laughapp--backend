const { spawn } = require('child_process');

const server = spawn('node', ['dist/main.js'], {
  cwd: '/home/mubashir/.openclaw/workspace/laughapp--backend'
});

server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);

server.on('error', e => { console.error('Server error:', e); process.exit(1); });

// Let server run for 60 seconds then exit
setTimeout(() => {
  server.kill();
  process.exit(0);
}, 60000);