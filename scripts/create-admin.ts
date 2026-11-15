import { createDatabase } from '../packages/db/src/index.ts'
import { config } from '../packages/config/src/index.ts'
import { ALL_PERMISSIONS } from '../packages/types/src/index.ts'

if (!config.database?.sql) {
  console.error('Error: Database configuration missing!')
  process.exit(1)
}

const { client } = createDatabase(config.database.sql)

async function main() {
  const args = process.argv.slice(2)
  let username = 'admin'
  let password = 'CompIT2026Admin!Secure'
  let email = 'admin@compit.internal'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--username' && args[i + 1]) username = args[++i]
    else if (args[i] === '--password' && args[i + 1]) password = args[++i]
    else if (args[i] === '--email' && args[i + 1]) email = args[++i]
  }

  const existing = await client`SELECT id FROM users WHERE name = ${username} OR email = ${email} LIMIT 1`
  const passwordHash = await Bun.password.hash(password)

  if (existing.length > 0) {
    const userId = existing[0].id
    await client`
      UPDATE users
      SET password_hash = ${passwordHash}, perms = ${ALL_PERMISSIONS}, division = 'open', banned = false
      WHERE id = ${userId}
    `
    console.log(`Updated existing user [${username}] with ALL_PERMISSIONS.`)
  } else {
    const id = crypto.randomUUID()
    await client`
      INSERT INTO users (id, name, email, password_hash, division, perms, created_at, score, banned)
      VALUES (${id}, ${username}, ${email}, ${passwordHash}, 'open', ${ALL_PERMISSIONS}, NOW(), 0, false)
    `
    console.log(`Created new admin user [${username}].`)
  }

  console.log(`\n=== ADMIN CREDENTIALS ===`)
  console.log(`Username: ${username}`)
  console.log(`Password: ${password}`)
  console.log(`Email:    ${email}`)
  console.log(`Permissions: ALL_PERMISSIONS (${ALL_PERMISSIONS})`)

  await client.end()
}

main().catch(err => {
  console.error('Fatal error in create-admin:', err)
  process.exit(1)
})
