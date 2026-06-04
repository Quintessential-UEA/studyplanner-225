// server/middleware/auth.js
import jwt from 'jsonwebtoken'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return secret
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  )
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? ''

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.slice(7).trim()

  try {
    const payload = jwt.verify(token, getJwtSecret())

    if (!payload?.userId || !payload?.email) {
      return res.status(401).json({ error: 'Invalid token payload' })
    }

    req.userId = Number(payload.userId)
    req.userEmail = String(payload.email)

    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}