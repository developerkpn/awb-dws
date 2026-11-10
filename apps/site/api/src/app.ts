import cors from 'cors'
import express from 'express'
import { errorHandler, success } from '@awb/server-core'
import { env } from './config/env'
import { controllerStatuses } from './devices'
import apiRoutes from './routes'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json(
    success({
      service: 'site-api',
      siteId: env.SITE_ID,
      controllers: controllerStatuses(),
    }),
  )
})

app.use('/api', apiRoutes)
app.use(errorHandler)

export default app
