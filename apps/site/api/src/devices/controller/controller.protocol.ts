// Not mapped yet; the exact format is in docs/design/protokol-controller.md.
// Until then every chunk is passed through as 'raw'.
export type ControllerEvent =
  | { type: 'rfid.tap'; controllerId: string; cardUid: string; at: Date }
  | {
      type: 'sensor.state'
      controllerId: string
      sensor: string
      state: 'on' | 'off' | 'unknown'
      at: Date
    }
  | { type: 'raw'; controllerId: string; data: Buffer; at: Date }

export function parseControllerData(controllerId: string, data: Buffer): ControllerEvent[] {
  return [{ type: 'raw', controllerId, data, at: new Date() }]
}
