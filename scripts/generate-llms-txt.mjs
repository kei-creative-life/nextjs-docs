import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative, basename } from 'path'

const ROOT = new URL('..', import.meta.url).pathname
const PUBLIC_DIR = join(ROOT, 'public')
const SITE_URL = process.env.SITE_URL || 'https://nextjs-docs.example.com'

// VitePress config からサイドバー情報を取得する代わりに、
// ファイルシステムから直接 md ファイルを収集
function collectMarkdownFiles(dir, base = ROOT) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'public' || entry === 'scripts' || entry === 'CLAUDE.md') continue
    if (statSync(full).isDirectory()) {
      files.push(...collectMarkdownFiles(full, base))
    } else if (entry.endsWith('.md') && entry !== 'index.md') {
      files.push(full)
    }
  }
  return files.sort()
}

function mdToUrl(filepath) {
  const rel = relative(ROOT, filepath).replace(/\.md$/, '')
  return `${SITE_URL}/${rel}`
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function extractDescription(content) {
  // 最初の > ブロック（ソースリンク）の次の段落、または最初の非見出し段落
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('---') || trimmed.startsWith('|') || trimmed.startsWith('```') || trimmed.startsWith(':::')) continue
    if (trimmed.length > 20) return trimmed.slice(0, 150)
  }
  return ''
}

function stripFrontmatter(content) {
  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3)
    if (end !== -1) return content.slice(end + 3).trim()
  }
  return content
}

// --- メイン処理 ---

const files = collectMarkdownFiles(ROOT)

// index.md を先頭に追加
const indexPath = join(ROOT, 'index.md')
const allFiles = [indexPath, ...files]

// llms.txt 生成（インデックス）
const llmsTxtLines = [
  '# Next.js Docs (Japanese)',
  '',
  '> Next.js 14/15 App Router ドキュメント（日本語）をトピック別に整理したサイト。',
  '> 破壊的変更・新機能がひと目でわかるマーカー付き。',
  '',
  '## Pages',
  '',
]

for (const filepath of allFiles) {
  const content = stripFrontmatter(readFileSync(filepath, 'utf-8'))
  const title = extractTitle(content) || basename(filepath, '.md')
  const url = filepath === indexPath ? SITE_URL : mdToUrl(filepath)
  const desc = extractDescription(content)
  llmsTxtLines.push(`- [${title}](${url})${desc ? ': ' + desc : ''}`)
}

writeFileSync(join(PUBLIC_DIR, 'llms.txt'), llmsTxtLines.join('\n') + '\n')

// llms-full.txt 生成（全コンテンツ結合）
const fullLines = []
for (const filepath of allFiles) {
  const raw = readFileSync(filepath, 'utf-8')
  const content = stripFrontmatter(raw)
  const rel = relative(ROOT, filepath)
  const url = filepath === indexPath ? SITE_URL : mdToUrl(filepath)

  fullLines.push(`${'='.repeat(60)}`)
  fullLines.push(`Source: ${rel}`)
  fullLines.push(`URL: ${url}`)
  fullLines.push(`${'='.repeat(60)}`)
  fullLines.push('')
  // VitePress カスタムコンテナを読みやすく変換
  const cleaned = content
    .replace(/::: danger (.+)/g, '⚠️ $1:')
    .replace(/::: tip (.+)/g, '✅ $1:')
    .replace(/::: warning (.+)/g, '⚡ $1:')
    .replace(/^:::$/gm, '')
  fullLines.push(cleaned)
  fullLines.push('')
}

writeFileSync(join(PUBLIC_DIR, 'llms-full.txt'), fullLines.join('\n'))

const fileCount = allFiles.length
console.log(`Generated llms.txt and llms-full.txt (${fileCount} pages)`)
