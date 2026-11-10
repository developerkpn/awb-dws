import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readdirSync } from 'node:fs'

const entry = fileURLToPath(import.meta.resolve('dependency-cruiser'))
const cli = resolve(dirname(entry), '../../bin/dependency-cruiser.mjs')
const config = ['--config', '.dependency-cruiser.cjs']

for (const app of ['apps/prereg/api', 'apps/site/api']) {
  if (existsSync(`${app}/src/domains`))
    throw new Error(`${app}: use src/modules instead of src/domains`)

  const files = readdirSync(`${app}/src/modules`, { recursive: true }).map(String)

  if (files.some((file) => file === 'index.ts' || file.endsWith('/index.ts'))) {
    throw new Error(`${app}: import explicit module files instead of index.ts barrels`)
  }
}

execFileSync(process.execPath, [cli, 'apps', 'packages', ...config], { stdio: 'inherit' })

for (const app of ['apps/prereg/web', 'apps/site/web', 'apps/site/kiosk']) {
  const output = execFileSync(
    process.execPath,
    [cli, `${app}/src`, ...config, '--ts-config', `${app}/tsconfig.json`, '--output-type', 'json'],
    {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    },
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
