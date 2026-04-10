# Next.js 15 App Router - ルーティング

> ソース: https://nextjs.org/docs/app/building-your-application/routing

## 基本用語

- **Tree**: 階層構造を可視化する規約（コンポーネントツリー、フォルダ構造等）
- **Subtree**: ツリーの一部。新しいルート（最初）からリーフ（最後）まで
- **Root**: ツリーまたはサブツリーの最初のノード（ルートレイアウトなど）
- **Leaf**: 子を持たないノード（URLパスの最後のセグメント）
- **URL Segment**: スラッシュで区切られたURLパスの一部
- **URL Path**: ドメインの後に続くURL部分（セグメントで構成）

## App Router の基本

- `app` ディレクトリ内で動作
- **デフォルトで Server Components**
- React Server Components 上に構築
- 共有レイアウト、ネストされたルーティング、ローディング状態、エラーハンドリングをサポート

## フォルダとファイルの役割

- **フォルダ** = ルートを定義
- **ファイル** = ルートセグメントに表示されるUIを作成

```
app/
├── layout.tsx        # ルートレイアウト（必須）
├── page.tsx          # `/` のUI
├── dashboard/
│   ├── layout.tsx    # dashboardレイアウト
│   ├── page.tsx      # `/dashboard` のUI
│   └── settings/
│       └── page.tsx  # `/dashboard/settings` のUI
```

## 特殊ファイル規約

| ファイル | 役割 |
|---------|------|
| `layout.js` | セグメントとその子の共有UI |
| `page.js` | ルート固有のUI（ルートを公開アクセス可能にする） |
| `loading.js` | セグメントとその子のローディングUI |
| `not-found.js` | 404 UI |
| `error.js` | エラーUI |
| `global-error.js` | グローバルエラーUI |
| `route.js` | サーバーサイドAPIエンドポイント |
| `template.js` | 再レンダリングされるレイアウトUI |
| `default.js` | Parallel Routesのフォールバック |

> `.js`, `.jsx`, `.tsx` いずれも使用可能

## コンポーネント階層（レンダリング順序）

```
<Layout>
  <Template>
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Loading />}>
        <ErrorBoundary fallback={<NotFound />}>
          <Page />
        </ErrorBoundary>
      </Suspense>
    </ErrorBoundary>
  </Template>
</Layout>
```

## コロケーション

`app` ディレクトリ内にコンポーネント、スタイル、テストなどを配置可能。
**`page.js` または `route.js` の内容のみが公開アクセス可能**。

---

## ルートの定義

> ソース: https://nextjs.org/docs/app/building-your-application/routing/defining-routes

- フォルダでルートを定義
- `page.js` ファイルでルートセグメントを公開

```tsx
// app/page.tsx → `/`
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}
```

---

## Pages と Layouts

> ソース: https://nextjs.org/docs/app/building-your-application/routing/pages

### Pages

- ルート固有の**ユニークなUI**
- デフォルトで Server Component

::: danger 破壊的変更
`searchParams` prop が**非同期**に変更された。`await` が必要。
:::

```tsx
// v14
export default function Page({
  searchParams,
}: {
  searchParams: { query: string }
}) {
  const query = searchParams.query
}

// v15 — async コンポーネント
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ query: string }>
}) {
  const { query } = await searchParams
}

// v15 — Client Component（use() を使用）
'use client'
import { use } from 'react'

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ query: string }>
}) {
  const { query } = use(searchParams)
}
```

### Layouts

- 複数ページ間で**共有されるUI**
- ナビゲーション時に状態を保持、再レンダリングしない
- `children` プロップを受け取る

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <nav></nav>
      {children}
    </section>
  )
}
```

### Root Layout（必須）

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Templates

- レイアウトと似ているが、ナビゲーション時に**新しいインスタンスを作成**
- DOM再作成、状態は保持されない

---

## Dynamic Routes

> ソース: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes

### 基本

::: danger 破壊的変更
`params` prop が**非同期**に変更された。`await` が必要。
:::

```tsx
// v14
export default function Page({ params }: { params: { slug: string } }) {
  return <div>My Post: {params.slug}</div>
}

// v15（非同期に変更）
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <div>My Post: {slug}</div>
}
```

**影響を受けるファイル:** `layout.js`, `page.js`, `route.js`, `default.js`, `generateMetadata`, `generateViewport`

### generateStaticParams

ビルド時にルートを静的に生成（変更なし）:

```tsx
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then((res) => res.json())
  return posts.map((post) => ({ slug: post.slug }))
}
```

### Catch-all Segments

| パターン | 例 | マッチ |
|---------|---|--------|
| `[slug]` | `/blog/a` | 単一セグメント |
| `[...slug]` | `/shop/a/b/c` | 1つ以上のセグメント |
| `[[...slug]]` | `/shop` も `/shop/a/b` も | 0個以上のセグメント |

---

## Route Groups

フォルダ名を丸括弧で囲む: `(folderName)` → **URLパスに影響しない**

```
app/
├── (marketing)/
│   ├── layout.tsx      # マーケティング用レイアウト
│   ├── about/page.tsx  # /about
│   └── blog/page.tsx   # /blog
├── (shop)/
│   ├── layout.tsx      # ショップ用レイアウト
│   └── cart/page.tsx   # /cart
```

---

## リンクとナビゲーション

> ソース: https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating

### `<Link>` コンポーネント

```tsx
import Link from 'next/link'

export default function Page() {
  return <Link href="/dashboard">Dashboard</Link>
}
```

### `useRouter` Hook

```tsx
'use client'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  return (
    <button onClick={() => router.push('/dashboard')}>
      Dashboard
    </button>
  )
}
```

### ナビゲーションの仕組み

1. **コード分割**: ルートセグメントごとに自動分割
2. **プリフェッチ**: `<Link>` がビューポートに表示されると自動プリフェッチ

::: warning 動作変更
Client Router Cache のデフォルトが変更。Page の `staleTime` が `0` に。ナビゲーション時に常に最新データを取得するようになった。
:::

3. **キャッシング**: Router Cache（インメモリクライアントサイドキャッシュ）
4. **部分レンダリング**: 変更されたセグメントのみ再レンダリング
5. **ソフトナビゲーション**: ページリロードなし、React状態を保持

::: tip 新機能
クライアントプリフェッチが `priority` 属性を使用するようになり、ブラウザによるリソース優先度制御が改善。
:::
