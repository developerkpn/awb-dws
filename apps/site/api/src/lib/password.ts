import bcrypt from 'bcrypt'
import { env } from '../config/env'

export const hashPassword = (password: string) => bcrypt.hash(password, env.BCRYPT_ROUNDS)

export const verifyPassword = (password: string, hash: string) =>
  /^\$2[aby]\$/.test(hash) ? bcrypt.compare(password, hash) : Promise.resolve(false)
