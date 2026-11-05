import express from 'express'
import helmet from 'helmet'
import { errorHandler, success } from '@awb/server-core'
import apiRoutes from './routes'
import { sameOrigin } from './middlewares/auth'
import { env } from './config/env'

const app = express()
app.set('trust proxy', env.TRUST_PROXY_HOPS)

app.disable('x-powered-by')
app.use(helmet())
app.use(express.json({ limit: '64kb' }))
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})
app.use('/api', sameOrigin)

app.get('/health', (_req, res) => {
  res.json(success({ service: 'prereg-api' }))
})
app.use('/api', apiRoutes)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }))
app.use(errorHandler)

export default app
