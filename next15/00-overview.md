# Next.js 15 - 変更概要

> ソース: https://nextjs.org/blog/next-15

Next.js 15 は React 19 対応、キャッシュデフォルトの変更、非同期API化など、大きな変更を含むメジャーアップデート。

## アップグレード方法

```bash
# 自動アップグレードCLI（推奨）
npx @next/codemod@canary upgrade latest

# 手動アップグレード
npm install next@latest react@latest react-dom@latest
```

---

## 破壊的変更一覧

| カテゴリ | 変更内容 | 影響度 |
|---------|---------|--------|
| **非同期API** | `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` が非同期に | 高 |
| **キャッシュデフォルト** | `fetch` のデフォルトが `no-store` に変更 | 高 |
| **Route Handler** | `GET` がデフォルトでキャッシュされなくなった | 高 |
| **Router Cache** | Page のデフォルト `staleTime` が `0` に | 中 |
| **next/image** | `squoosh` 削除、`Content-Disposition: attachment` に変更 | 中 |
| **next/font** | 外部 `@next/font` パッケージ削除、`font-family` ハッシュ削除 | 低 |
| **next/dynamic** | `suspense` prop 削除、Server Component での `ssr: false` 禁止 | 中 |
| **Middleware** | `react-server` 条件が適用（React APIインポート制限） | 低 |
| **Config 名変更** | `serverComponentsExternalPackages` → `serverExternalPackages` | 低 |
| **Config 名変更** | `bundlePagesExternals` → `bundlePagesRouterDependencies` | 低 |
| **Runtime** | `experimental-edge` → `edge` に変更 | 低 |
| **再検証** | レンダリング中の `revalidateTag`/`revalidatePath` がエラーに | 中 |
| **NextRequest** | `geo` / `ip` プロパティ削除（ホスティングプロバイダが提供） | 中 |
| **Speed Insights** | 自動計測が削除。`@vercel/speed-insights` パッケージを使用 | 低 |
| **Node.js** | 最小バージョンが 18.18.0 に | 低 |

---

## 新機能一覧

| 機能 | 説明 | 状態 |
|------|------|------|
| **React 19** | React 19 対応、新しいフック（`useActionState` 等） | 安定版 |
| **React Compiler** | 自動メモ化（`useMemo`/`useCallback` 不要に） | 実験的 |
| **Turbopack Dev** | `next dev --turbo` が安定版に（最大76%高速化） | 安定版 |
| **`<Form>` コンポーネント** | `next/form` によるプリフェッチ付きフォーム | 安定版 |
| **`next.config.ts`** | TypeScript で設定ファイルが書ける | 安定版 |
| **`instrumentation.js`** | サーバーライフサイクルの監視API | 安定版 |
| **`unstable_after`** | レスポンス送信後にコード実行 | 実験的 |
| **Static Route Indicator** | 開発時に静的/動的ルートを視覚表示 | 安定版 |
| **Server Actions セキュリティ強化** | 推測不能なID、未使用アクションの自動削除 | 安定版 |
| **ESLint 9** | ESLint 9 + eslint-plugin-react-hooks v5 対応 | 安定版 |
| **セルフホスティング改善** | `Cache-Control` のカスタマイズ強化、`sharp` 自動使用 | 安定版 |

---

## 主要な変更の詳細

### 非同期 Request API

v14 で同期だったAPIが全て非同期に:

```tsx
// v14（同期）
import { cookies } from 'next/headers'
const cookieStore = cookies()
const token = cookieStore.get('token')

// v15（非同期）
import { cookies } from 'next/headers'
const cookieStore = await cookies()
const token = cookieStore.get('token')
```

**対象API:** `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`

**一時的な同期アクセス（移行用）:**

完全に非同期化する前の移行期間中は、`UnsafeUnwrapped*` 型を使って同期的にアクセス可能（開発環境で警告が出る）:

```tsx
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'
const cookieStore = cookies() as unknown as UnsafeUnwrappedCookies
```

**同期コンポーネントでの `use()` フック:**

`async` にできないコンポーネント（Client Component等）では `use()` を使用:

```tsx
'use client'
import { use } from 'react'

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  // ...
}
```

自動移行コマンド:
```bash
npx @next/codemod@canary next-async-request-api .
```

### キャッシュデフォルトの変更

```tsx
// v14: デフォルトで cache: 'force-cache'（キャッシュされる）
fetch('https://...')

// v15: デフォルトで cache: 'no-store'（キャッシュされない）
fetch('https://...')

// v15: 明示的にキャッシュする場合
fetch('https://...', { cache: 'force-cache' })

// v15: ページ全体のfetchをまとめてキャッシュする場合
// export const fetchCache = 'default-cache'
```

### React 19 の主な変更

| v14（React 18） | v15（React 19） |
|-----------------|-----------------|
| `useFormState` | `useActionState` |
| `ref` を `forwardRef` で転送 | `ref` が通常のpropsとして利用可能 |
| `<Context.Provider>` | `<Context>` で直接使用可能 |
| `useDeferredValue(value)` | `useDeferredValue(value, initialValue)` |
| Cleanup 不要の `ref` コールバック | `ref` コールバックにクリーンアップ関数 |

---

## 各トピック別の変更

各トピックの詳細は以下のページを参照:

- [ルーティング](./01-routing) — `params`/`searchParams` の非同期化
- [レンダリング](./02-rendering) — React 19、Turbopack、Hydration改善
- [データフェッチング](./03-data-fetching) — キャッシュデフォルト変更
- [Server Actions](./04-server-actions) — セキュリティ強化、`useActionState`
- [キャッシング](./05-caching) — デフォルト大幅変更
- [Route Handlers](./06-route-handlers) — GET キャッシュ無効化、非同期API
- [Middleware](./07-middleware) — react-server 条件
- [エラーハンドリング](./08-error-handling) — Hydration エラー改善
- [Loading & Streaming](./09-loading-streaming) — 変更なし
- [新機能・新API](./10-new-apis) — Form, instrumentation, after, next.config.ts
