import { Router } from 'express'

// Service-to-service routes for plant sites (sync, HO lookup when a site cache is empty).
// Add service authentication before mounting real handlers.
const router = Router()

export default router
