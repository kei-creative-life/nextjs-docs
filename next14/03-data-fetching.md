# Next.js 14 App Router - データフェッチング

> ソース: https://nextjs.org/docs/14/app/building-your-application/data-fetching/fetching-caching-and-revalidating

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
// app/page.tsx
async function getData() {
  const res = await fetch('https://api.example.com/...')

  if (!res.ok) {
    throw new Error('Failed to fetch data')  // 最も近い error.js を起動
  }

  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <main>{/* ... */}</main>
}
```

**注意:**
- Route Handlers 内の `fetch` はメモ化されない（React コンポーネントツリーの一部ではないため）
- TypeScript で `async`/`await` を使うには TypeScript 5.1.3+ と `@types/react` 18.2.8+ が必要

---

## キャッシング

### デフォルトでキャッシュ

```js
// 'force-cache' がデフォルト（省略可能）
fetch('https://...', { cache: 'force-cache' })
```

POST メソッドも自動キャッシュ（Route Handler 内のPOSTを除く）。

### キャッシュからオプトアウト

`fetch` がキャッシュ**されない**条件:
- `cache: 'no-store'` を指定
- `revalidate: 0` を指定
- Route Handler 内の POST メソッド
- `headers` や `cookies` の使用後
- `const dynamic = 'force-dynamic'` セグメント設定
- `fetchCache` セグメント設定でスキップ
- `Authorization` or `Cookie` ヘッダー使用（上位に未キャッシュリクエストがある場合）

```js
fetch('https://...', { cache: 'no-store' })
```

---

## 再検証（Revalidation）

### 時間ベースの再検証

```js
fetch('https://...', { next: { revalidate: 3600 } })  // 最大1時間ごと
```

または Route Segment Config:
```tsx
export const revalidate = 3600  // 最大1時間ごと
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

**エラー時の挙動:** エラーが発生した場合、最後に成功したデータがキャッシュから提供され続ける。

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

export default async function Layout({ params: { id } }: { params: { id: string } }) {
  const item = await getItem(id)
  // ...
}
```

React `cache` でメモ化 + `revalidate` セグメント設定でキャッシュ制御。
`getItem` が複数箇所で呼ばれても、DBクエリは1回のみ。

---

## クライアントでのフェッチ

### Route Handler 経由

Client Component から Route Handler を呼び出してデータ取得。
APIトークンなどの機密情報をクライアントに露出しない。

> Server Components ではRoute Handlerを呼ぶ必要はない。直接フェッチ可能。

### サードパーティライブラリ

- **SWR**: https://swr.vercel.app/
- **TanStack Query**: https://tanstack.com/query/latest

独自のメモ化、キャッシング、再検証、ミューテーションAPIを提供。

---

## データフェッチパターン

### どこで使うかに応じてフェッチ

同じデータが必要な複数コンポーネントでそれぞれ `fetch` してOK。
React が自動的にリクエストをメモ化・重複排除。

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
