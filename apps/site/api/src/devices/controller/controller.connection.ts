import { EventEmitter } from 'node:events'
import { Socket } from 'node:net'
import type { ControllerConfig } from '../../config/controllers'

export type ControllerStatus = 'connecting' | 'connected' | 'disconnected'

type ConnectionEvents = { data: [Buffer]; status: [ControllerStatus] }

const MAX_BACKOFF_MS = 30_000

/** One long-lived TCP connection to a weighbridge controller; reconnects with exponential backoff. */
export class ControllerConnection extends EventEmitter<ConnectionEvents> {
  readonly config: ControllerConfig
  status: ControllerStatus = 'disconnected'
  lastError: string | null = null
  private socket: Socket | null = null
  private retries = 0
  private timer: NodeJS.Timeout | null = null
  private stopped = false

  constructor(config: ControllerConfig) {
    super()
    this.config = config
  }

  start(): void {
    this.stopped = false
    this.connect()
  }

  stop(): void {
    this.stopped = true
    if (this.timer) clearTimeout(this.timer)
    this.socket?.destroy()
  }

  /** Writes a command; returns false when the controller is not connected. */
  send(data: Buffer | string): boolean {
    if (this.status !== 'connected' || !this.socket) return false
    return this.socket.write(data)
  }

  private connect(): void {
    this.setStatus('connecting')
    const socket = new Socket()
    this.socket = socket
    socket.setKeepAlive(true)
    socket.on('connect', () => {
      this.retries = 0
      this.lastError = null
      this.setStatus('connected')
    })
    socket.on('data', (chunk) =>
      this.emit('data', Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    )
    socket.on('error', (err) => {
      this.lastError = err.message // 'close' follows and schedules the reconnect
    })
    socket.on('close', () => {
      this.setStatus('disconnected')
      this.scheduleReconnect()
    })
    socket.connect(this.config.port, this.config.host)
  }

  private scheduleReconnect(): void {
    if (this.stopped) return
    const delay = Math.min(MAX_BACKOFF_MS, 1_000 * 2 ** this.retries++)
    this.timer = setTimeout(() => this.connect(), delay)
  }

  private setStatus(status: ControllerStatus): void {
    this.status = status
    this.emit('status', status)
  }
}
