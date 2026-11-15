import { LoginRoute } from '@rctf/types'
import { createToken, TokenKind } from '../../../../lib/tokens'
import { verifyPasswordForUser } from '../../../../services/auth'
import {
  rateLimitLoginByIp,
  rateLimitLoginByUsername,
} from '../../../../services/rate-limit'
import { getUserByName } from '../../../../services/users'
import authGroup from '../group'

authGroup.route(LoginRoute, async ({ ctx, res, body }) => {
  const ipTimeLeft = await rateLimitLoginByIp(ctx.var.redis, ctx.var.ip)
  if (ipTimeLeft) {
    return res.badRateLimit({ timeLeft: ipTimeLeft })
  }

  const userTimeLeft = await rateLimitLoginByUsername(
    ctx.var.redis,
    body.username
  )
  if (userTimeLeft) {
    return res.badRateLimit({ timeLeft: userTimeLeft })
  }

  const user = await getUserByName(ctx.var.db, body.username)
  if (!user) {
    return res.badUnknownUser()
  }

  const validPassword = await verifyPasswordForUser(
    body.password,
    user.passwordHash
  )
  if (!validPassword) {
    return res.badUnknownUser()
  }

  const authToken = await createToken(TokenKind.Auth, user.id)
  return res.goodLogin({ authToken })
})
