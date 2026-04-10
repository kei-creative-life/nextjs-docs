# Next.js 15 App Router - データフェッチング

> ソース: https://nextjs.org/docs/app/building-your-application/data-fetching

## データフェッチの4つの方法

1. サーバーで `fetch` を使用
2. サーバーでサードパーティライブラリを使用
3. クライアントで Route Handler 経由
4. クライアントでサードパーティライブラリ（SWR, TanStack Query等）

---

## サーバーでの fetch

Next.js はネイティブ `fetch` を拡張し、キャッシングと再検証の挙動を設定可能。
React は `fetch` を自動メモ化。

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/...')

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <main>{/* ... */}</main>
}
```

---

## キャッシング

::: danger 破壊的変更
`fetch` のデフォルトキャッシュ動作が変更。v14 では `force-cache`（キャッシュする）がデフォルトだったが、v15 では `no-store`（キャッシュしない）がデフォルトに。
:::

```tsx
// v14: デフォルトでキャッシュされる（force-cache）
fetch('https://...')

// v15: デフォルトでキャッシュされない（no-store）
fetch('https://...')

// v15: 明示的にキャッシュする場合
fetch('https://...', { cache: 'force-cache' })
```

### ページ全体のfetchをまとめてキャッシュ

`fetchCache` セグメント設定で、個別に `cache` を指定しない全ての `fetch` にデフォルトキャッシュを適用:

```js
// app/layout.js
export const fetchCache = 'default-cache'

export default async function RootLayout() {
  const a = await fetch('https://...')                        // キャッシュされる
  const b = await fetch('https://...', { cache: 'no-store' }) // キャッシュされない（個別指定が優先）
}
```

### v14 との比較

| 動作 | v14 デフォルト | v15 デフォルト |
|------|-------------|-------------|
| `fetch('https://...')` | `force-cache`（キャッシュ） | `no-store`（非キャッシュ） |
| キャッシュを有効にする | 不要（デフォルト） | `{ cache: 'force-cache' }` を明示 |
| キャッシュを無効にする | `{ cache: 'no-store' }` を明示 | 不要（デフォルト） |

::: warning 動作変更
`force-dynamic` を設定した場合、fetch キャッシュのデフォルトが `no-store` に設定されるようになった（v14 では `force-dynamic` と fetch キャッシュは独立していた）。
:::

---

## 再検証（Revalidation）

### 時間ベースの再検証

```js
fetch('https://...', { next: { revalidate: 3600 } })  // 1時間
```

または Route Segment Config:
```tsx
export const revalidate = 3600
```

### オンデマンド再検証

#### パスベース: `revalidatePath`
```ts
'use server'
import { revalidatePath } from 'next/cache'

export async function action() {
  revalidatePath('/posts')
}
```

#### タグベース: `revalidateTag`
```tsx
// フェッチ時にタグ付け
const res = await fetch('https://...', { next: { tags: ['collection'] } })

// Server Action でタグを再検証
'use server'
import { revalidateTag } from 'next/cache'

export async function action() {
  revalidateTag('collection')
}
```

::: danger 破壊的変更
レンダリング中に `revalidateTag` / `revalidatePath` を呼び出すとエラーがスローされるようになった。Server Action または Route Handler 内で使用すること。
:::

---

## サードパーティライブラリでのフェッチ（サーバー）

`fetch` を使わないDB・CMS・ORMクライアントの場合:

```ts
import { cache } from 'react'

export const getItem = cache(async (id: string) => {
  const item = await db.item.findUnique({ id })
  return item
})
```

```tsx
// app/item/[id]/layout.tsx
import { getItem } from '@/utils/get-item'

export const revalidate = 3600

export default async function Layout({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params  // v15: params は非同期
  const item = await getItem(id)
  // ...
}
```

---

## クライアントでのフェッチ

### Route Handler 経由

Client Component から Route Handler を呼び出してデータ取得。

### サードパーティライブラリ

- **SWR**: https://swr.vercel.app/
- **TanStack Query**: https://tanstack.com/query/latest

---

## データフェッチパターン

### 並列データフェッチ

`Promise.all` でウォーターフォールを回避:

```tsx
async function Page() {
  const artistData = getArtist(id)
  const albumsData = getAlbums(id)

  const [artist, albums] = await Promise.all([artistData, albumsData])
  // ...
}
```

---

## Server Components HMR Cache

::: tip 新機能
開発中の HMR（Hot Module Replacement）時に、Server Components の `fetch` レスポンスが再利用されるようになった。API呼び出しの重複を削減し、開発コストを低減。
:::

無効化する場合:
```ts
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsHmrCache: false,
  },
}
```

---

## Static Generation の最適化

::: tip 新機能
静的生成のビルド時間が改善。ページのレンダリングが1回で済むようになり（v14では2回）、`fetch` キャッシュがワーカー間で共有される。
:::

高度な制御（実験的）:
```ts
const nextConfig = {
  experimental: {
    staticGenerationRetryCount: 1,        // 失敗時のリトライ回数
    staticGenerationMaxConcurrency: 8,    // ワーカーあたりの同時処理数
    staticGenerationMinPagesPerWorker: 25, // 新ワーカー起動の最小ページ数
  },
}
```
