# Next.js 14 App Router - ルーティング

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing

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

## ルートセグメント

各フォルダ = ルートセグメント = URLセグメントに対応

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

ネストされたルートでは、親セグメントのコンポーネントの**内側**に子セグメントのコンポーネントがネストされる。

## コロケーション

`app` ディレクトリ内にコンポーネント、スタイル、テストなどを配置可能。
**`page.js` または `route.js` の内容のみが公開アクセス可能**。

---

## ルートの定義

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/defining-routes

- フォルダでルートを定義
- `page.js` ファイルでルートセグメントを公開

```tsx
// app/page.tsx → `/`
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}
```

`page.js` がないフォルダはルートとして公開されない（コンポーネントやスタイルの配置に使える）。

---

## Pages と Layouts

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/pages-and-layouts

### Pages

- ルート固有の**ユニークなUI**
- `page.js` からコンポーネントをエクスポート
- デフォルトで Server Component
- ルートサブツリーの**リーフ**

```tsx
// app/dashboard/page.tsx → `/dashboard`
export default function Page() {
  return <h1>Hello, Dashboard Page!</h1>
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

**重要な注意点:**
- 親レイアウトと子の間でデータの受け渡しは不可（同じデータを複数箇所でfetchしてOK、Reactが自動重複排除）
- レイアウトは下位のルートセグメントにアクセスできない（`useSelectedLayoutSegment` / `useSelectedLayoutSegments` を使う）

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

- `app` ディレクトリに**必須**
- `<html>` と `<body>` タグを定義する必要がある
- Server Component であり、Client Component に**できない**

### ネストされたレイアウト

- フォルダ内のレイアウトはそのルートセグメントに適用
- デフォルトでネスト（`children` プロップで子レイアウトをラップ）
- Root Layout のみ `<html>` と `<body>` を含める

### Templates

- レイアウトと似ているが、ナビゲーション時に**新しいインスタンスを作成**
- DOMが再作成、状態は保持されない、effectsが再同期
- ユースケース: `useEffect` でのページビュー記録、ページごとのフィードバックフォーム

```tsx
// app/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
```

レンダリング順序:
```jsx
<Layout>
  <Template key={routeParam}>{children}</Template>
</Layout>
```

### Metadata の設定

```tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next.js',
}

export default function Page() {
  return '...'
}
```

> Root Layout に手動で `<title>` や `<meta>` を追加しない。Metadata API を使用する。

---

## Dynamic Routes

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/dynamic-routes

### 基本

フォルダ名を角括弧で囲む: `[folderName]`

```tsx
// app/blog/[slug]/page.tsx
export default function Page({ params }: { params: { slug: string } }) {
  return <div>My Post: {params.slug}</div>
}
```

| ルート | URL例 | `params` |
|-------|-------|----------|
| `app/blog/[slug]/page.js` | `/blog/a` | `{ slug: 'a' }` |

### generateStaticParams

ビルド時にルートを静的に生成:

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
| `[...slug]` | `/shop/a/b/c` | 1つ以上のセグメント（`{ slug: ['a','b','c'] }`） |
| `[[...slug]]` | `/shop` も `/shop/a/b` も | 0個以上のセグメント |

### TypeScript

```tsx
// app/blog/[slug]/page.tsx       → { slug: string }
// app/shop/[...slug]/page.tsx    → { slug: string[] }
// app/shop/[[...slug]]/page.tsx  → { slug?: string[] }
// app/[catId]/[itemId]/page.tsx  → { categoryId: string, itemId: string }
```

---

## Route Groups

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/route-groups

フォルダ名を丸括弧で囲む: `(folderName)` → **URLパスに影響しない**

### 用途

1. **ルートの整理**: サイトセクション、チームごとにグループ化
2. **同じセグメントレベルでネストされたレイアウト**
3. **複数のRoot Layoutの作成**

```
app/
├── (marketing)/
│   ├── layout.tsx      # マーケティング用レイアウト
│   ├── about/page.tsx  # /about
│   └── blog/page.tsx   # /blog
├── (shop)/
│   ├── layout.tsx      # ショップ用レイアウト
│   ├── cart/page.tsx   # /cart
│   └── account/page.tsx # /account
```

**注意:**
- `(marketing)/about/page.js` と `(shop)/about/page.js` は同じ `/about` になりエラー
- 複数Root Layoutを使う場合、`home page.js` はいずれかのRoute Groupに定義
- 複数Root Layout間のナビゲーションは**フルページロード**

---

## リンクとナビゲーション

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/linking-and-navigating

### 3つのナビゲーション方法

#### 1. `<Link>` コンポーネント（推奨）

```tsx
import Link from 'next/link'

export default function Page() {
  return <Link href="/dashboard">Dashboard</Link>
}
```

- `<a>` タグを拡張
- プリフェッチとクライアントサイドナビゲーションを提供
- Dynamic Segmentsへのリンク: テンプレートリテラルを使用
- アクティブリンクの検出: `usePathname()` を使用
- スクロール制御: `scroll={false}` で無効化

#### 2. `useRouter` Hook

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

- Client Components でのみ使用
- Server Components では `redirect()` を使用

#### 3. ネイティブ History API

- `window.history.pushState`: 新しいエントリを追加（戻る操作可能）
- `window.history.replaceState`: 現在のエントリを置換（戻る操作不可）

### ナビゲーションの仕組み

1. **コード分割**: ルートセグメントごとに自動分割
2. **プリフェッチ**: `<Link>` がビューポートに表示されると自動プリフェッチ
   - 静的ルート: 全体をプリフェッチ・キャッシュ
   - 動的ルート: 最初の `loading.js` までの共有レイアウトをプリフェッチ（30秒キャッシュ）
3. **キャッシング**: Router Cache（インメモリクライアントサイドキャッシュ）
4. **部分レンダリング**: 変更されたセグメントのみ再レンダリング
5. **ソフトナビゲーション**: ページリロードなし、React状態を保持
6. **戻る/進むナビゲーション**: スクロール位置を維持、Router Cacheを再利用
