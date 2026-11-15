import { expect, test } from 'bun:test'
import { verifyPasswordForUser } from './auth'

test('verifyPasswordForUser accepts the correct password and rejects a wrong one', async () => {
  const hash = await Bun.password.hash('secret123')

  expect(await verifyPasswordForUser('secret123', hash)).toBe(true)
  expect(await verifyPasswordForUser('wrong-pass', hash)).toBe(false)
})
