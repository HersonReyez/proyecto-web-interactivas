import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'

const directory = dirname(fileURLToPath(import.meta.url))
const backend = resolve(directory, '../../tienda-anime')
const runtime = resolve(directory, '.runtime')
mkdirSync(runtime, { recursive: true })
const database = resolve(runtime, 'e2e-' + randomUUID() + '.sqlite')
writeFileSync(database, '')
const env = {
  ...process.env,
  APP_ENV: 'e2e',
  APP_DEBUG: 'false',
  APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
  APP_URL: 'http://127.0.0.1:8011',
  APP_CONFIG_CACHE: resolve(runtime, 'unused-config.php'),
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: database,
  DB_URL: '',
  SESSION_DRIVER: 'database',
  SESSION_COOKIE: 'anime_store_e2e_session',
  SESSION_DOMAIN: '',
  SESSION_SECURE_COOKIE: 'false',
  SANCTUM_STATEFUL_DOMAINS: '127.0.0.1:4173,localhost:4173',
  CACHE_STORE: 'array',
  QUEUE_CONNECTION: 'sync',
  BCRYPT_ROUNDS: '4',
}
const migrate = spawnSync('php', ['artisan', 'migrate', '--seed', '--force', '--no-interaction'], { cwd: backend, env, stdio: 'inherit', windowsHide: true })
if (migrate.status !== 0) process.exit(migrate.status || 1)
const server = spawn('php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8011', '--no-reload'], { cwd: backend, env, stdio: 'inherit', windowsHide: true })
function cleanUp() {
  server.kill()
  try { unlinkSync(database) } catch {}
}
process.on('SIGTERM', () => { cleanUp(); process.exit(0) })
process.on('SIGINT', () => { cleanUp(); process.exit(0) })
server.on('exit', code => { cleanUp(); process.exit(code || 0) })
