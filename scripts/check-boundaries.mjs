import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const entry = fileURLToPath(import.meta.resolve('dependency-cruiser'))
const cli = resolve(dirname(entry), '../../bin/dependency-cruiser.mjs')
const config = ['--config', '.dependency-cruiser.cjs']

execFileSync(process.execPath, [cli, 'apps', 'packages', ...config], { stdio: 'inherit' })

for (const app of ['apps/prereg/web', 'apps/site/web', 'apps/site/kiosk']) {
  const output = execFileSync(
    process.execPath,
    [cli, `${app}/src`, ...config, '--ts-config', `${app}/tsconfig.json`, '--output-type', 'json'],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  )
  const result = JSON.parse(output)
  const unresolved = result.modules.flatMap((module) =>
    module.dependencies
      .filter((dependency) => dependency.couldNotResolve && dependency.module.startsWith('@/'))
      .map((dependency) => `${module.source}: ${dependency.module}`),
  )

  if (unresolved.length) {
    console.error(`Unresolved application imports:\n${unresolved.join('\n')}`)
    process.exit(1)
  }

  console.log(`Architecture and source aliases checked: ${app}`)
}
