# Next.js 15 - 新機能・新API

> ソース: https://nextjs.org/blog/next-15

v15 で追加された主要な新機能とAPI。

---

## `<Form>` コンポーネント

::: tip 新機能
`next/form` から `<Form>` コンポーネントが利用可能。HTML `<form>` を拡張し、プリフェッチ・クライアントサイドナビゲーション・プログレッシブエンハンスメントを提供。
:::

検索フォームなど、別ページに遷移するフォームに最適:

```tsx
import Form from 'next/form'

export default function Page() {
  return (
    <Form action="/search">
      <input name="query" />
      <button type="submit">Submit</button>
    </Form>
  )
}
```

### 特徴

| 機能 | 説明 |
|------|------|
| **プリフェッチ** | フォームがビューポートに表示されると、遷移先の layout と loading UI をプリフェッチ |
| **クライアントサイドナビゲーション** | 送信時に共有レイアウトとクライアント状態を維持 |
| **プログレッシブエンハンスメント** | JS が未ロードでもフルページナビゲーションで動作 |

### v14 での同等の実装（手動）

```tsx
// v14 では手動実装が必要だった
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchForm(props) {
  const router = useRouter()

  useEffect(() => {
    if (typeof props.action === 'string') {
      router.prefetch(props.action)
    }
  }, [props.action, router])

  function onSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = new URLSearchParams()
    for (const [name, value] of formData) {
      data.append(name, value as string)
    }
    router.push(`${props.action}?${data.toString()}`)
  }

  return <form onSubmit={onSubmit} {...props} />
}
```

v15 の `<Form>` コンポーネントにより、このボイラープレートが不要に。

---

## `next.config.ts`（TypeScript サポート）

::: tip 新機能
設定ファイルを TypeScript で記述可能に。`NextConfig` 型による自動補完と型安全性。
:::

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
}

export default nextConfig
```

> `next.config.js` も引き続きサポート。

---

## `instrumentation.js`（安定版）

::: tip 新機能
サーバーライフサイクルの監視APIが安定版に。`experimental.instrumentationHook` の設定が不要に。
:::

```ts
// instrumentation.ts

export async function register() {
  // OpenTelemetry などの監視ライブラリを初期化
}

export async function onRequestError(
  err: Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: 'Pages Router' | 'App Router'; routeType: string }
) {
  // エラーを監視サービスに送信
  await fetch('https://...', {
    method: 'POST',
    body: JSON.stringify({ message: err.message, request, context }),
    headers: { 'Content-Type': 'application/json' },
  })
}
```

### `register()` 関数

- サーバー起動時に1回だけ呼ばれる
- 監視ライブラリの初期化に使用

### `onRequestError()` フック

サーバーエラーのキャッチに使用。以下のコンテキスト情報を含む:
- **routerKind**: Pages Router or App Router
- **routeType**: Server Component, Server Action, Route Handler, Middleware

---

## `unstable_after`（実験的）

::: tip 新機能
レスポンスのストリーミング完了後にコードを実行。ログ、アナリティクス、外部システム同期などに最適。
:::

### 設定

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    after: true,
  },
}
```

### 使い方

Server Components, Server Actions, Route Handlers, Middleware で使用可能:

```tsx
import { unstable_after as after } from 'next/server'
import { log } from '@/app/utils'

export default function Layout({ children }) {
  // レスポンス送信後にログを実行（ユーザーを待たせない）
  after(() => {
    log()
  })

  return <>{children}</>
}
```

### ユースケース

| ユースケース | 説明 |
|------------|------|
| ログ記録 | レスポンス完了後にアクセスログを記録 |
| アナリティクス | ページビューやイベントを非同期送信 |
| 外部同期 | 外部システムへのデータ同期 |
| キャッシュ更新 | バックグラウンドでのキャッシュウォーミング |

---

## バンドル設定の統一

::: tip 新機能
App Router と Pages Router のバンドル設定を統一する新オプション。
:::

### `bundlePagesRouterDependencies`

Pages Router でも App Router と同様に外部パッケージを自動バンドル:

```ts
// next.config.ts
const nextConfig = {
  bundlePagesRouterDependencies: true,
}
```

### `serverExternalPackages`

::: warning 動作変更
`serverComponentsExternalPackages` から `serverExternalPackages` に名前変更。
:::

特定のパッケージをバンドルから除外:

```ts
// next.config.ts
const nextConfig = {
  bundlePagesRouterDependencies: true,
  serverExternalPackages: ['package-name'],
}
```

---

## ESLint 9 サポート

::: tip 新機能
ESLint 9 + 新しいフラットコンフィグ形式をサポート。ESLint 8 との後方互換性あり。
:::

- ESLint 9 未採用の場合、自動的に `ESLINT_USE_FLAT_CONFIG=false` を適用
- `eslint-plugin-react-hooks` が v5.0.0 にアップグレード（新しいルール追加）

---

## セルフホスティング改善

::: tip 新機能
`Cache-Control` ヘッダーのカスタマイズが改善。
:::

### `expireTime` 設定

ISR ページの `stale-while-revalidate` 期間を制御:

```ts
// next.config.ts
const nextConfig = {
  expireTime: 31536000, // デフォルト: 1年（秒）
}
```

> v14 の `experimental.swrDelta` から名前変更。

### sharp の自動使用

`next start` またはスタンドアロン出力モードで `sharp` が自動的に使用される。手動インストール不要。

---

## next/image の変更

::: danger 破壊的変更
`next/image` に複数の破壊的変更あり。
:::

| 変更 | 詳細 |
|------|------|
| `squoosh` 削除 | 画像最適化に `sharp` を使用（自動） |
| `Content-Disposition` | デフォルトが `attachment` に変更（画像がダウンロードされる） |
| `src` バリデーション | 先頭・末尾のスペースがあるとエラー |

---

## next/font の変更

::: danger 破壊的変更
:::

| 変更 | 詳細 |
|------|------|
| 外部パッケージ削除 | `@next/font` パッケージのサポート終了。`next/font` を使用 |
| ハッシュ削除 | `font-family` のハッシュ化が廃止 |

---

## next/dynamic の変更

::: danger 破壊的変更
:::

| 変更 | 詳細 |
|------|------|
| `suspense` prop 削除 | App Router では空の Suspense 境界を挿入しなくなった |
| `ssr: false` 制限 | Server Components での `ssr: false` が禁止に |

---

## Speed Insights の削除

::: danger 破壊的変更
Speed Insights の自動計測が削除された。
:::

引き続き使用するには `@vercel/speed-insights` パッケージを手動でインストール:

```bash
npm install @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```
