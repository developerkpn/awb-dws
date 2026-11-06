#!/usr/bin/env node
// Checks that TECHNICAL.md lists everything in the code, and that decisions and history in
// BLUEPRINT.md + TECHNICAL.md are never overwritten. Run: npm run check:blueprint. Rules: TECHNICAL.md.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const DOCS = ['BLUEPRINT.md', 'TECHNICAL.md']
const COVERAGE_DOC = 'TECHNICAL.md'
const PDF_SOURCE = 'BLUEPRINT.md'
const PDF_BUILD_INFO = join(ROOT, 'docs/project-files/supporting/blueprint-build.json')

const dirs = (path) =>
  existsSync(path)
    ? readdirSync(path)
        .filter((name) => statSync(join(path, name)).isDirectory())
        .sort()
    : []

const files = (path, ext) => {
  if (!existsSync(path)) return []
  return readdirSync(path, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith(ext))
    .map((name) => join(path, name))
    .sort()
}

const read = (name) =>
  existsSync(join(ROOT, name))
    ? readFileSync(join(ROOT, name), 'utf8').replace(/\r\n/g, '\n')
    : null
const current = Object.fromEntries(DOCS.map((name) => [name, read(name)]))
for (const name of DOCS) {
  if (current[name] === null) {
    console.error(`✘ ${name} tidak ditemukan.`)
    process.exit(1)
  }
}
let failed = false

// ---------------------------------------------------------------- 1. coverage
/** @type {{ section: string, id: string, source: string }[]} */
const items = []
const add = (section, id, source) => items.push({ section, id, source: relative(ROOT, source) })

for (const system of dirs(join(ROOT, 'apps'))) {
  for (const role of dirs(join(ROOT, 'apps', system))) {
    const app = join(ROOT, 'apps', system, role)
    add('A. Aplikasi', `${system}/${role}`, app)

    for (const module of dirs(join(app, 'src/modules'))) {
      add(
        'B. Domain dan modul backend',
        `${system}/${role}/modules/${module}`,
        join(app, 'src/modules', module),
      )
    }

    for (const file of [join(app, 'prisma/schema.prisma')].filter((path) => existsSync(path))) {
      for (const [, model] of readFileSync(file, 'utf8').matchAll(/^model\s+(\w+)\s*\{/gm)) {
        add('D. Model data dan migrasi', model, file)
      }
    }
    for (const migration of dirs(join(app, 'prisma/migrations'))) {
      add('D. Model data dan migrasi', migration, join(app, 'prisma/migrations', migration))
    }

    for (const device of dirs(join(app, 'src/devices'))) {
      add(
        'G. Perangkat dan integrasi',
        `${system}/${role}/devices/${device}`,
        join(app, 'src/devices', device),
      )
    }
    for (const feature of dirs(join(app, 'src/features'))) {
      add(
        'F. Fitur frontend',
        `${system}/${role}/features/${feature}`,
        join(app, 'src/features', feature),
      )
    }
    for (const file of files(join(app, 'src/pages'), '.tsx')) {
      if (!file.endsWith('/index.tsx')) continue
      const page = relative(join(app, 'src/pages'), file)
        .replace(/\\/g, '/')
        .replace(/\/index\.tsx$/, '')
      add('F. Fitur frontend', `${system}/${role}/pages/${page}`, file)
    }
  }
}
for (const pkg of dirs(join(ROOT, 'packages'))) {
  add('H. Paket bersama', `packages/${pkg}`, join(ROOT, 'packages', pkg))
}
for (const file of files(join(ROOT, 'packages/contracts/src'), '.ts')) {
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/^export const (\w+)/gm)) {
    add('E. Contract', name, file)
  }
}

const missing = items.filter(({ id }) => !current[COVERAGE_DOC].includes(`\`${id}\``))
if (missing.length === 0) {
  console.log(`✔ ${COVERAGE_DOC} mencakup ${items.length} item yang ada di kode.`)
} else {
  failed = true
  console.error(`✘ ${COVERAGE_DOC} belum mencantumkan ${missing.length} item yang ada di kode:\n`)
  for (const section of [...new Set(missing.map((m) => m.section))]) {
    console.error(`  ${section}`)
    for (const m of missing.filter((x) => x.section === section))
      console.error(`    \`${m.id}\`   (${m.source})`)
  }
  console.error(
    `\n  Tambahkan ke bagian yang sesuai di ${COVERAGE_DOC} (sebagai inline code) dan catat di riwayat.\n`,
  )
}

// ---------------------------------------------------------------- 2. decisions and history are never overwritten
/** Rows (without the header) of every table under a "## [n.] <prefix>..." section. */
function tableRows(markdown, prefix) {
  const rows = []
  let inSection = false
  let seenHeader = false
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      inSection = line
        .slice(3)
        .trim()
        .replace(/^\d+\.\s+/, '')
        .startsWith(prefix)
      seenHeader = false
      continue
    }
    const trimmed = line.trim()
    if (!inSection || !trimmed.startsWith('|') || /^\|\s*:?-/.test(trimmed)) continue
    if (!seenHeader) {
      seenHeader = true
      continue
    }
    rows.push(
      trimmed
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim()),
    )
  }
  return rows
}
const allRows = (docs, prefix) =>
  Object.values(docs).flatMap((markdown) => (markdown ? tableRows(markdown, prefix) : []))

const base = process.env.BLUEPRINT_BASE || 'HEAD'
const showAtBase = (name) => {
  try {
    return execFileSync('git', ['show', `${base}:${name}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).replace(/\r\n/g, '\n')
  } catch {
    return null
  }
}
const previous = Object.fromEntries(DOCS.map((name) => [name, showAtBase(name)]))

if (Object.values(previous).every((markdown) => markdown === null)) {
  console.log(`ℹ Riwayat belum dibandingkan: dokumen belum ada di ${base} (belum di-commit).`)
} else {
  const problems = []
  const oldHistory = allRows(previous, 'Riwayat')
  const newHistory = allRows(current, 'Riwayat')
  const newHistoryRows = new Set(newHistory.map((row) => row.join(' | ')))
  for (const row of oldHistory) {
    if (!newHistoryRows.has(row.join(' | '))) {
      problems.push(
        `Riwayat ${row[0]} diubah atau dihapus. Riwayat hanya boleh ditambah; tulis koreksi sebagai baris baru.`,
      )
    }
  }

  const newDecisions = new Map(allRows(current, 'Keputusan').map((row) => [row[0], row]))
  for (const row of allRows(previous, 'Keputusan')) {
    const now = newDecisions.get(row[0])
    if (!now) {
      problems.push(
        `Keputusan ${row[0]} dihapus. Jangan dihapus; ubah statusnya menjadi "digantikan oleh K-xx".`,
      )
    } else if (row.slice(0, -1).join(' | ') !== now.slice(0, -1).join(' | ')) {
      problems.push(
        `Keputusan ${row[0]} ditimpa. Tambahkan keputusan baru dan ubah status yang lama; hanya kolom Status yang boleh berubah.`,
      )
    }
  }

  const changed = DOCS.some((name) => previous[name] !== current[name])
  if (changed && newHistory.length <= oldHistory.length) {
    problems.push(
      'BLUEPRINT.md atau TECHNICAL.md berubah tetapi belum ada baris riwayat baru (isi Sebelumnya, Sekarang dan Alasan).',
    )
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
const sourceHash = createHash('sha256')
  .update(readFileSync(join(ROOT, PDF_SOURCE)))
  .digest('hex')
if (!existsSync(PDF_BUILD_INFO)) {
  console.warn('⚠ PDF blueprint belum pernah dibuat: jalankan npm run blueprint:pdf.')
} else if (JSON.parse(readFileSync(PDF_BUILD_INFO, 'utf8')).source_sha256 !== sourceHash) {
  console.warn(
    `⚠ PDF blueprint lebih lama dari ${PDF_SOURCE}: jalankan npm run blueprint:pdf sebelum dibagikan.`,
  )
} else {
  console.log(`✔ PDF blueprint sesuai dengan ${PDF_SOURCE}.`)
}

process.exit(failed ? 1 : 0)
