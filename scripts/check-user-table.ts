import { createDatabase } from '../packages/db/src/index.ts'
import { config } from '../packages/config/src/index.ts'

if (!config.database?.sql) {
  console.error('Error: Database configuration missing!')
  process.exit(1)
}

const { client } = createDatabase(config.database.sql)

const rows = await client`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
console.log(JSON.stringify(rows, null, 2))
await client.end()
