import { describe, expect, test } from 'bun:test'
import { config } from '@rctf/config'
import { verifyPasswordForUser } from '@rctf/api/src/services/auth'
import { buildSeedData, DEFAULT_ADMIN_PASSWORD } from './data'

describe('seed admin credentials', () => {
  test('seeded admin has a usable password hash', async () => {
    const admin = buildSeedData(config).admin

    expect(admin.passwordHash).toBeTruthy()
    expect(await verifyPasswordForUser(DEFAULT_ADMIN_PASSWORD, admin.passwordHash)).toBe(true)
  })
})
