# Next.js 15 App Router - エラーハンドリング

> ソース: https://nextjs.org/docs/app/building-your-application/routing/error-handling

## 概要

`error.js` ファイル規約で、ネストされたルートのランタイムエラーをグレースフルに処理。

- ルートセグメントとその子を React Error Boundary で自動ラップ
- ファイルシステム階層で粒度を調整
- エラーを影響を受けたセグメントに分離
- フルページリロードなしでのエラーリカバリ機能

---

## 基本的な使い方

```tsx
// app/dashboard/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

---

## 仕組み

```
<Layout>
  <ErrorBoundary fallback={<Error />}>
    <Page />
  </ErrorBoundary>
</Layout>
```

- `error.js` は**同じセグメント**の `layout.js` のエラーをキャッチしない
- 特定のレイアウトのエラーを処理するには**親セグメント**に `error.js` を配置

---

## Root Layout のエラーハンドリング: `global-error.js`

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

---

## Hydration エラーの改善

::: tip 新機能
Hydration エラーの表示が大幅に改善。エラーのソースコードと修正方法の提案が表示されるようになった。
:::

v14.1 から始まった改善がさらに進化:
- エラーの原因となったソースコードが直接表示される
- 具体的な修正提案が提供される
- クライアント/サーバーの不一致箇所がハイライトされる

---

## サーバーエラーの処理

Server Component 内でエラーが発生した場合:
- Next.js が `Error` オブジェクト（本番環境では機密情報を削除）を最も近い `error.js` に転送

### 本番環境のセキュリティ

- `message`: エラーの汎用メッセージ
- `digest`: 自動生成されたエラーハッシュ（サーバーサイドログとの照合用）

開発環境では元の `message` がクライアントに送信される。

---

## unstable_rethrow

::: tip 新機能
`unstable_rethrow` 関数で Next.js 内部エラーを App Router 内で再スローできるようになった。
:::

Next.js の内部エラー（`redirect()` や `notFound()` がスローするエラーなど）を `try/catch` で誤ってキャッチしてしまった場合に使用:

```tsx
import { unstable_rethrow } from 'next/navigation'

export default async function Page() {
  try {
    // ...何らかの処理
  } catch (error) {
    unstable_rethrow(error)  // Next.js 内部エラーなら再スロー
    // それ以外のエラーをハンドリング
    console.error(error)
  }
}
```
