import type { ControllerEvent } from '../../types/controller'
// Not mapped yet; the exact format is in docs/design/protokol-controller.md.
// Until then every chunk is passed through as 'raw'.

export function parseControllerData(controllerId: string, data: Buffer): ControllerEvent[] {
  return [
    {
      type: 'raw',
      controllerId,
      data,
      at: new Date(),
    },
  ]
}
