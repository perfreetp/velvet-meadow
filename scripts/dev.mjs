// 并行启动后端 API 与前端 Vite，统一输出前缀
import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const isWin = platform() === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

function run(name, color, args, cwd) {
  const p = spawn(npm, args, { cwd, shell: false });
  const prefix = (buf) => buf.toString().split('\n').filter(Boolean)
    .map((line) => `\x1b[${color}m[${name}]\x1b[0m ${line}`).join('\n');
  p.stdout.on('data', (d) => process.stdout.write(prefix(d) + '\n'));
  p.stderr.on('data', (d) => process.stderr.write(prefix(d) + '\n'));
  p.on('exit', (code) => {
    console.log(`[${name}] exited with ${code}`);
    process.exit(code ?? 0);
  });
  return p;
}

const root = new URL('..', import.meta.url).pathname.replace(/^\//, '');
run('server', '36', ['run', 'start'], root + '/server');
run('client', '35', ['run', 'dev'], root + '/client');
