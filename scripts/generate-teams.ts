import { randomBytes } from 'node:crypto'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createDatabase } from '../packages/db/src/index.ts'
import { config } from '../packages/config/src/index.ts'

if (!config.database?.sql) {
  console.error('Error: Database configuration missing!')
  process.exit(1)
}

const { client } = createDatabase(config.database.sql)

function generateSecurePassword(length = 10): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ!@#$'
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

interface TeamEntry {
  name: string
  username: string
  password?: string
  email?: string
}

async function main() {
  const args = process.argv.slice(2)
  let count = 10
  let prefix = 'compit-tim-'
  let inputFile: string | null = null
  let division = 'open'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) count = parseInt(args[++i], 10)
    else if (args[i] === '--prefix' && args[i + 1]) prefix = args[++i]
    else if (args[i] === '--file' && args[i + 1]) inputFile = args[++i]
    else if (args[i] === '--division' && args[i + 1]) division = args[++i]
  }

  const teamsToCreate: TeamEntry[] = []

  if (inputFile) {
    if (!existsSync(inputFile)) {
      console.error(`File ${inputFile} not found!`)
      process.exit(1)
    }
    const lines = readFileSync(inputFile, 'utf-8').split('\n').filter(l => l.trim().length > 0)
    const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
      const teamName = parts[0]
      const username = parts[1] || teamName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      teamsToCreate.push({ name: teamName, username })
    }
    console.log(`Loaded ${teamsToCreate.length} teams from ${inputFile}`)
  } else {
    for (let i = 1; i <= count; i++) {
      const numStr = String(i).padStart(2, '0')
      const name = `${prefix}${numStr}`
      teamsToCreate.push({ name, username: name })
    }
    console.log(`Generating ${teamsToCreate.length} standardized teams with prefix "${prefix}"`)
  }

  const createdRecords: Array<{ name: string; username: string; password: string; division: string }> = []

  for (const team of teamsToCreate) {
    const existing = await client`SELECT id FROM users WHERE name = ${team.name} LIMIT 1`

    if (existing.length > 0) {
      console.log(`Skipping [${team.name}] - already exists in database.`)
      continue
    }

    const plainPassword = team.password || generateSecurePassword(10)
    const passwordHash = await Bun.password.hash(plainPassword)
    const id = crypto.randomUUID()
    const email = team.email || `${team.username}@compit.internal`

    await client`
      INSERT INTO users (id, name, email, password_hash, division, perms, created_at, score, banned)
      VALUES (${id}, ${team.name}, ${email}, ${passwordHash}, ${division}, 0, NOW(), 0, false)
    `

    createdRecords.push({
      name: team.name,
      username: team.name,
      password: plainPassword,
      division,
    })
  }

  // Export CSV
  const csvHeader = 'Team Name,Username,Password,Division\n'
  const csvRows = createdRecords
    .map(r => `"${r.name}","${r.username}","${r.password}","${r.division}"`)
    .join('\n')

  const outPath = path.resolve(__dirname, 'teams-credentials.csv')
  writeFileSync(outPath, csvHeader + csvRows, 'utf-8')

  console.log(`\nSuccessfully created ${createdRecords.length} teams!`)
  console.log(`Credentials saved to: ${outPath}`)

  await client.end()
}

main().catch(err => {
  console.error('Fatal error in generate-teams:', err)
  process.exit(1)
})
