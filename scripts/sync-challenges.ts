import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

interface ChallengeDefinition {
  id?: string
  name: string
  category: string
  author?: string
  description?: string
  points?: { min: number; max: number } | number
  value?: number
  initial?: number
  minimum?: number
  flags?: string[] | Array<{ flag?: string; content?: string }>
  flag?: string
  files?: Array<string | { name: string; path?: string; url?: string }>
  hidden?: boolean
  tiebreakEligible?: boolean
  sortWeight?: number
}

function findChallengeFiles(dir: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...findChallengeFiles(fullPath))
      }
    } else if (entry.isFile()) {
      const lower = entry.name.toLowerCase()
      if (
        lower === 'challenge.yml' ||
        lower === 'challenge.yaml' ||
        lower === 'chall.yml' ||
        lower === 'chall.yaml'
      ) {
        results.push(fullPath)
      }
    }
  }
  return results
}

function parseChallenge(filePath: string): {
  id: string
  data: any
  rawFiles: Array<string | { name: string; path?: string; url?: string }>
  challDir: string
} | null {
  const content = readFileSync(filePath, 'utf-8')
  let parsed: ChallengeDefinition
  try {
    parsed = yaml.parse(content)
  } catch (err) {
    console.error(`[!] Failed to parse YAML at ${filePath}:`, err)
    return null
  }

  if (!parsed || !parsed.name || !parsed.category) {
    console.warn(`[!] Skipping invalid challenge at ${filePath} (missing name or category)`)
    return null
  }

  const challDir = path.dirname(filePath)
  const dirName = path.basename(challDir)
  const categorySlug = parsed.category.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  const rawSlug = (dirName || parsed.name).toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  // Prefix ID with category to prevent cross-category slug collisions (e.g., web-baby vs pwn-baby)
  const id =
    parsed.id ||
    (rawSlug.startsWith(`${categorySlug}-`) ? rawSlug : `${categorySlug}-${rawSlug}`)

  // Resolve points
  let pointsMin = 100
  let pointsMax = 500
  if (typeof parsed.points === 'object' && parsed.points !== null) {
    pointsMin = parsed.points.min ?? 100
    pointsMax = parsed.points.max ?? 500
  } else if (typeof parsed.points === 'number') {
    pointsMin = parsed.points
    pointsMax = parsed.points
  } else if (typeof parsed.value === 'number') {
    pointsMin = parsed.minimum ?? Math.floor(parsed.value * 0.2)
    pointsMax = parsed.initial ?? parsed.value
  }

  // Resolve flag
  let flagStr = ''
  if (typeof parsed.flag === 'string') {
    flagStr = parsed.flag.trim()
  } else if (Array.isArray(parsed.flags) && parsed.flags.length > 0) {
    const first = parsed.flags[0]
    if (typeof first === 'string') {
      flagStr = first.trim()
    } else if (typeof first === 'object' && first !== null) {
      flagStr = (first.flag || first.content || '').trim()
    }
  }

  if (!flagStr) {
    console.warn(
      `\x1b[33m[⚠️ WARNING] Challenge "${parsed.name}" (${filePath}) HAS NO FLAG CONFIGURED! Contestants will be unable to solve it.\x1b[0m`
    )
  }

  const data = {
    name: parsed.name,
    category: parsed.category,
    author: parsed.author || 'CompIT Setter',
    description: parsed.description || '',
    points: { min: pointsMin, max: pointsMax },
    flag: flagStr,
    tiebreakEligible: parsed.tiebreakEligible ?? true,
    hidden: parsed.hidden ?? false,
    sortWeight: parsed.sortWeight ?? 0,
    files: [] as Array<{ name: string; url: string }>,
  }

  return { id, data, rawFiles: parsed.files || [], challDir }
}

async function uploadFileViaApi(
  baseUrl: string,
  token: string,
  filePath: string,
  fileName: string
): Promise<string | null> {
  if (!existsSync(filePath)) {
    console.warn(`[!] Local file not found: ${filePath}`)
    return null
  }

  const fileBuf = readFileSync(filePath)
  const base64Data = `data:application/octet-stream;base64,${fileBuf.toString('base64')}`

  try {
    const res = await fetch(`${baseUrl}/api/v1/admin/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [{ name: fileName, data: base64Data }],
      }),
    })

    const json = (await res.json()) as any
    if (res.ok && json.kind === 'goodFilesUpload' && json.data?.length > 0) {
      return json.data[0].url
    } else {
      console.error(`[!] Upload failed for ${fileName}:`, json)
      return null
    }
  } catch (err) {
    console.error(`[!] Upload error for ${fileName}:`, err)
    return null
  }
}

async function syncViaApi(
  url: string,
  token: string,
  challs: Array<{
    id: string
    data: any
    rawFiles: Array<string | { name: string; path?: string; url?: string }>
    challDir: string
  }>
) {
  const baseUrl = url.replace(/\/+$/, '')
  console.log(`[*] Syncing ${challs.length} challenges via API: ${baseUrl}`)

  for (const { id, data, rawFiles, challDir } of challs) {
    // Process files
    const finalFiles: Array<{ name: string; url: string }> = []
    for (const f of rawFiles) {
      if (typeof f === 'string') {
        if (f.startsWith('http://') || f.startsWith('https://')) {
          finalFiles.push({ name: path.basename(f), url: f })
        } else {
          // Local file
          const localPath = path.resolve(challDir, f)
          const fileName = path.basename(f)
          console.log(`    Uploading local file: ${f}...`)
          const uploadedUrl = await uploadFileViaApi(baseUrl, token, localPath, fileName)
          if (uploadedUrl) {
            finalFiles.push({ name: fileName, url: uploadedUrl })
          }
        }
      } else if (typeof f === 'object' && f !== null) {
        if (f.url) {
          finalFiles.push({ name: f.name || path.basename(f.url), url: f.url })
        } else if (f.path) {
          const localPath = path.resolve(challDir, f.path)
          const fileName = f.name || path.basename(f.path)
          console.log(`    Uploading local file: ${f.path}...`)
          const uploadedUrl = await uploadFileViaApi(baseUrl, token, localPath, fileName)
          if (uploadedUrl) {
            finalFiles.push({ name: fileName, url: uploadedUrl })
          }
        }
      }
    }

    data.files = finalFiles

    const putUrl = `${baseUrl}/api/v1/admin/challs/${encodeURIComponent(id)}`
    const res = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    })

    const json = (await res.json()) as any
    if (res.ok && json.kind === 'goodChallengeUpdate') {
      console.log(`[✓] Synced [${data.category}] ${data.name} (id: ${id}, files: ${finalFiles.length})`)
    } else {
      console.error(`[✗] Failed to sync ${id}:`, json.message || json)
    }
  }
}

async function syncViaDirectDb(
  challs: Array<{
    id: string
    data: any
    rawFiles: Array<string | { name: string; path?: string; url?: string }>
    challDir: string
  }>
) {
  const { config } = await import('../packages/config/src/index.ts')
  const { createDatabase } = await import('../packages/db/src/index.ts')

  if (!config.database?.sql) {
    console.error('Error: Database configuration missing!')
    process.exit(1)
  }

  const { client } = createDatabase(config.database.sql)
  console.log(`[*] Syncing ${challs.length} challenges directly to PostgreSQL database...`)

  for (const { id, data, rawFiles, challDir } of challs) {
    const finalFiles: Array<{ name: string; url: string }> = []
    for (const f of rawFiles) {
      if (typeof f === 'string') {
        if (f.startsWith('http://') || f.startsWith('https://')) {
          finalFiles.push({ name: path.basename(f), url: f })
        } else {
          // Local file in direct DB mode: copy to uploads folder
          const localPath = path.resolve(challDir, f)
          const fileName = path.basename(f)
          if (existsSync(localPath)) {
            const buf = readFileSync(localPath)
            const hash = new Bun.SHA256().update(buf).digest('hex')
            const uploadDir = path.resolve(process.cwd(), 'uploads', hash)
            if (!existsSync(uploadDir)) {
              require('node:fs').mkdirSync(uploadDir, { recursive: true })
            }
            require('node:fs').copyFileSync(localPath, path.join(uploadDir, fileName))
            finalFiles.push({ name: fileName, url: `/uploads/${hash}/${fileName}` })
          }
        }
      } else if (typeof f === 'object' && f !== null && f.url) {
        finalFiles.push({ name: f.name || path.basename(f.url), url: f.url })
      }
    }

    data.files = finalFiles

    const flags = data.flag
      ? [{ provider: undefined, config: { flag: data.flag } }]
      : []

    const challengePayload = {
      name: data.name,
      category: data.category,
      author: data.author,
      description: data.description,
      points: data.points,
      flags,
      files: data.files,
      tiebreakEligible: data.tiebreakEligible,
      hidden: data.hidden,
      sortWeight: data.sortWeight,
    }

    const payloadJson = JSON.stringify(challengePayload)

    await client`
      INSERT INTO challenges (id, data, score, solve_count)
      VALUES (${id}, ${payloadJson}::jsonb, ${data.points.max}, 0)
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data
    `

    console.log(`[✓] Synced [${data.category}] ${data.name} (id: ${id}, files: ${finalFiles.length})`)
  }

  await client.end()

  // Invalidate Redis cache & notify leaderboard worker of updates
  try {
    const Redis = (await import('ioredis')).default
    const redisConfig =
      typeof config.database?.redis === 'string'
        ? config.database.redis
        : {
            host: config.database?.redis?.host ?? '127.0.0.1',
            port: config.database?.redis?.port ?? 6379,
            password: config.database?.redis?.password,
            lazyConnect: true,
            connectTimeout: 3000,
          }
    const redis = new Redis(redisConfig as any)
    await redis.connect()
    await redis.publish(
      'leaderboard:recompute-challenge',
      JSON.stringify({ scope: 'all', source: 'algo-change' })
    )
    await redis.publish('leaderboard:force-update', '1')
    console.log('[✓] Emitted Redis cache invalidation and leaderboard recompute signals.')
    await redis.quit()
  } catch (err) {
    console.warn('[!] Redis notification skipped (Redis offline or unreachable):', (err as Error).message)
  }
}

async function main() {
  const args = process.argv.slice(2)
  let targetDir = './challenges'
  let apiUrl: string | null = null
  let apiToken: string | null = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) targetDir = args[++i]
    else if (args[i] === '--url' && args[i + 1]) apiUrl = args[++i]
    else if (args[i] === '--token' && args[i + 1]) apiToken = args[++i]
  }

  const resolvedDir = path.resolve(process.cwd(), targetDir)
  console.log(`[*] Scanning for challenges in: ${resolvedDir}`)

  const files = findChallengeFiles(resolvedDir)
  if (files.length === 0) {
    console.log(`[i] No challenge.yml or chall.yaml files found in ${resolvedDir}.`)
    console.log(`[i] Make sure challenge folders contain challenge.yml`)
    return
  }

  console.log(`[*] Found ${files.length} challenge definition file(s).`)
  const parsedChallenges: Array<{
    id: string
    data: any
    rawFiles: Array<string | { name: string; path?: string; url?: string }>
    challDir: string
  }> = []

  for (const f of files) {
    const chall = parseChallenge(f)
    if (chall) parsedChallenges.push(chall)
  }

  if (apiUrl && apiToken) {
    await syncViaApi(apiUrl, apiToken, parsedChallenges)
  } else {
    await syncViaDirectDb(parsedChallenges)
  }

  console.log(`\n[✓] All challenges successfully synced!`)
}

main().catch(err => {
  console.error('Fatal error in sync-challenges:', err)
  process.exit(1)
})
