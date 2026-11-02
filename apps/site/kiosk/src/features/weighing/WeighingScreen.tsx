import { wbSessionPhase } from '@awb/contracts'
import { Screen } from '@awb/ui'

export function WeighingScreen() {
  return (
    <Screen title="Timbang (WB IN / WB OUT)">
      <p>Tap pertama menampilkan data truk; tap kedua merekam berat.</p>
      <p>Fase lane: {wbSessionPhase.options.join(' → ')}</p>
    </Screen>
  )
}
