#!/usr/bin/env node
// Checks that BLUEPRINT.md lists everything in the code and never overwrites history or decisions.
// Run: npm run check:blueprint (part of npm run check). The rules are explained in BLUEPRINT.md.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const BLUEPRINT = join(ROOT, 'BLUEPRINT.md')
const PDF_BUILD_INFO = join(ROOT, 'docs/project-files/supporting/blueprint-build.json')
const DECISIONS = '4. Keputusan teknis'
const HISTORY = '5. Riwayat perubahan'

const dirs = (path) =>
  existsSync(path) ? readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory()).sort() : []

const files = (path, ext) => {
  if (!existsSync(path)) return []
  return readdirSync(path, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith(ext))
    .map((name) => join(path, name))
    .sort()
}

if (!existsSync(BLUEPRINT)) {
  console.error('✘ BLUEPRINT.md tidak ditemukan.')
  process.exit(1)
}
const blueprint = readFileSync(BLUEPRINT, 'utf8').replace(/\r\n/g, '\n')
let failed = false

// ---------------------------------------------------------------- 1. coverage
/** @type {{ section: string, id: string, source: string }[]} */
const items = []
const add = (section, id, source) => items.push({ section, id, source: relative(ROOT, source) })

for (const system of dirs(join(ROOT, 'apps'))) {
  for (const role of dirs(join(ROOT, 'apps', system))) {
    const app = join(ROOT, 'apps', system, role)
    add('Lampiran A. Aplikasi', `${system}/${role}`, app)

    for (const domain of dirs(join(app, 'src/domains'))) {
      add('Lampiran B. Domain dan modul backend', `${system}/${role}/domains/${domain}`, join(app, 'src/domains', domain))
      for (const module of dirs(join(app, 'src/domains', domain))) {
        add('Lampiran B. Domain dan modul backend', `${system}/${role}/domains/${domain}/${module}`, join(app, 'src/domains', domain, module))
      }
    }
    for (const module of dirs(join(app, 'src/modules'))) {
      add('Lampiran B. Domain dan modul backend', `${system}/${role}/modules/${module}`, join(app, 'src/modules', module))
    }

    for (const file of files(join(app, 'prisma/schema'), '.prisma')) {
      for (const [, model] of readFileSync(file, 'utf8').matchAll(/^model\s+(\w+)\s*\{/gm)) {
        add('Lampiran D. Model data dan migrasi', model, file)
      }
    }
    for (const migration of dirs(join(app, 'prisma/migrations'))) {
      add('Lampiran D. Model data dan migrasi', migration, join(app, 'prisma/migrations', migration))
    }

    for (const device of dirs(join(app, 'src/devices'))) {
      add('Lampiran G. Perangkat dan integrasi', `${system}/${role}/devices/${device}`, join(app, 'src/devices', device))
    }
    for (const feature of dirs(join(app, 'src/features'))) {
      add('Lampiran F. Fitur frontend', `${system}/${role}/features/${feature}`, join(app, 'src/features', feature))
    }
  }
}
for (const pkg of dirs(join(ROOT, 'packages'))) {
  add('Lampiran H. Paket bersama', `packages/${pkg}`, join(ROOT, 'packages', pkg))
}
for (const file of files(join(ROOT, 'packages/contracts/src'), '.ts')) {
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/^export const (\w+)/gm)) {
    add('Lampiran E. Contract', name, file)
  }
}

const missing = items.filter(({ id }) => !blueprint.includes(`\`${id}\``))
if (missing.length === 0) {
  console.log(`✔ BLUEPRINT.md mencakup ${items.length} item yang ada di kode.`)
} else {
  failed = true
  console.error(`✘ BLUEPRINT.md belum mencantumkan ${missing.length} item yang ada di kode:\n`)
  for (const section of [...new Set(missing.map((m) => m.section))]) {
    console.error(`  ${section}`)
    for (const m of missing.filter((x) => x.section === section)) console.error(`    \`${m.id}\`   (${m.source})`)
  }
  console.error('\n  Tambahkan ke lampiran yang sesuai (sebagai inline code) dan catat di "Riwayat perubahan".\n')
}

// ---------------------------------------------------------------- 2. history is append-only
/** Rows (without the header) of the first table under the "## <heading>" section. */
function tableRows(markdown, heading) {
  const lines = markdown.split('\n')
  const start = lines.findIndex((line) => line.startsWith('## ') && line.slice(3).trim().startsWith(heading))
  if (start < 0) return []
  const rows = []
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break
    if (!line.trim().startsWith('|') || /^\|\s*:?-/.test(line.trim())) continue
    rows.push(line.trim().slice(1, -1).split('|').map((cell) => cell.trim()))
  }
  return rows.slice(1)
}

const base = process.env.BLUEPRINT_BASE || 'HEAD'
let previous = null
try {
  previous = execFileSync('git', ['show', `${base}:BLUEPRINT.md`], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).replace(/\r\n/g, '\n')
} catch {
  previous = null
}

if (previous === null) {
  console.log(`ℹ Riwayat belum dibandingkan: BLUEPRINT.md belum ada di ${base} (belum di-commit).`)
} else {
  const problems = []
  const oldHistory = tableRows(previous, HISTORY)
  const newHistory = tableRows(blueprint, HISTORY)
  const newHistoryRows = new Set(newHistory.map((row) => row.join(' | ')))
  for (const row of oldHistory) {
    if (!newHistoryRows.has(row.join(' | '))) {
      problems.push(`Riwayat ${row[0]} diubah atau dihapus. Riwayat hanya boleh ditambah; tulis koreksi sebagai baris baru.`)
    }
  }

  const newDecisions = new Map(tableRows(blueprint, DECISIONS).map((row) => [row[0], row]))
  for (const row of tableRows(previous, DECISIONS)) {
    const now = newDecisions.get(row[0])
    if (!now) {
      problems.push(`Keputusan ${row[0]} dihapus. Jangan dihapus; ubah statusnya menjadi "digantikan oleh K-xx".`)
    } else if (row.slice(0, -1).join(' | ') !== now.slice(0, -1).join(' | ')) {
      problems.push(`Keputusan ${row[0]} ditimpa. Tambahkan keputusan baru dan ubah status yang lama; hanya kolom Status yang boleh berubah.`)
    }
  }

  if (previous !== blueprint && newHistory.length <= oldHistory.length) {
    problems.push('BLUEPRINT.md berubah tetapi belum ada baris baru di "Riwayat perubahan" (isi Sebelumnya, Sekarang dan Alasan).')
  }

  if (problems.length === 0) {
    console.log(`✔ Riwayat dan keputusan tidak ditimpa (dibandingkan dengan ${base}).`)
  } else {
    failed = true
    console.error(`✘ Aturan riwayat dilanggar (dibandingkan dengan ${base}):`)
    for (const problem of problems) console.error(`    ${problem}`)
  }
}

// ---------------------------------------------------------------- 3. PDF freshness (warning only)
const sourceHash = createHash('sha256').update(readFileSync(BLUEPRINT)).digest('hex')
if (!existsSync(PDF_BUILD_INFO)) {
  console.warn('⚠ PDF blueprint belum pernah dibuat: jalankan npm run blueprint:pdf.')
} else if (JSON.parse(readFileSync(PDF_BUILD_INFO, 'utf8')).source_sha256 !== sourceHash) {
  console.warn('⚠ PDF blueprint lebih lama dari BLUEPRINT.md: jalankan npm run blueprint:pdf sebelum dibagikan.')
} else {
  console.log('✔ PDF blueprint sesuai dengan BLUEPRINT.md.')
}

process.exit(failed ? 1 : 0)
