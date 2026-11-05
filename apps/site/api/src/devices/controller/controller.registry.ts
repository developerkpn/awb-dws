import type { ControllerConfig } from '../../config/controllers'
import { ControllerConnection, type ControllerStatus } from './controller.connection'
import { parseControllerData, type ControllerEvent } from './controller.protocol'

const connections = new Map<string, ControllerConnection>()

/** Opens one connection per configured controller and forwards parsed events. Returns a stop function. */
export function startControllers(
  configs: ControllerConfig[],
  onEvent: (event: ControllerEvent) => void,
): () => void {
  for (const config of configs) {
    const connection = new ControllerConnection(config)
    connection.on('data', (data) => parseControllerData(config.id, data).forEach(onEvent))
    connection.start()
    connections.set(config.id, connection)
  }
  return () => {
    for (const connection of connections.values()) connection.stop()
    connections.clear()
  }
}

/** Connection state per controller, for health checks and the device monitor (PRD UI-15). */
export function controllerStatuses(): Record<string, ControllerStatus> {
  return Object.fromEntries([...connections].map(([id, connection]) => [id, connection.status]))
}

/** Sends a command (e.g. barrier or lamp) to one controller. Returns false when it is not connected. */
export function sendToController(id: string, data: Buffer | string): boolean {
  return connections.get(id)?.send(data) ?? false
}
