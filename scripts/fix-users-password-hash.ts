import { createDatabase } from '../packages/db/src/index.ts'
import { config } from '../packages/config/src/index.ts'

if (!config.database?.sql) {
  console.error('Error: Database configuration missing!')
  process.exit(1)
}

const { db, client } = createDatabase(config.database.sql)

await db.execute('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text')
const rows = await db.execute(
  'SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
  ['users']
)
console.log(JSON.stringify(rows.rows ?? rows, null, 2))
await client.end()
