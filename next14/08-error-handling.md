# Next.js 14 App Router - エラーハンドリング

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/error-handling

## 概要

`error.js` ファイル規約で、ネストされたルートのランタイムエラーをグレースフルに処理。

- ルートセグメントとその子を React Error Boundary で自動ラップ
- ファイルシステム階層で粒度を調整
- エラーを影響を受けたセグメントに分離（他は機能し続ける）
- フルページリロードなしでのエラーリカバリ機能

---

## 基本的な使い方

```tsx
// app/dashboard/error.tsx
'use client'  // Error コンポーネントは Client Component である必要がある

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)  // エラーレポートサービスに送信
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
  <ErrorBoundary fallback={<Error />}>  ← error.js
    <Page />                             ← page.js
  </ErrorBoundary>
</Layout>
```

- `error.js` が React Error Boundary を作成し、子セグメントや `page.js` をラップ
- エラー発生時、フォールバックコンポーネントがレンダリングされる
- エラー境界より**上**のレイアウトは状態を維持し、インタラクティブなまま

---

## エラーリカバリ

`reset()` 関数でError Boundaryの内容を再レンダリング試行:

```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

---

## ネストされたルートでの挙動

- エラーは最も近い親のエラー境界にバブルアップ
- 異なるレベルに `error.js` を配置して粒度を調整

**重要:** `error.js` は**同じセグメント**の `layout.js` や `template.js` のエラーをキャッチしない（エラー境界がそのレイアウトの**内側**にネストされるため）。

---

## レイアウトのエラーハンドリング

特定のレイアウトのエラーを処理するには、**そのレイアウトの親セグメント**に `error.js` を配置。

---

## Root Layout のエラーハンドリング: `global-error.js`

Root `app/error.js` は Root `app/layout.js` のエラーをキャッチ**しない**。

→ `app/global-error.js` を使用:

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

**重要:**
- `global-error.js` はアプリケーション全体をラップ
- Root Layout を置き換えるため、`<html>` と `<body>` を定義する必要がある
- 最も粒度が粗いエラーUI
- `global-error.js` があっても、Root `error.js` も定義推奨

---

## サーバーエラーの処理

Server Component 内でエラーが発生した場合:
- Next.js が `Error` オブジェクト（本番環境では機密情報を削除）を最も近い `error.js` に転送

### 本番環境のセキュリティ

- `message`: エラーの汎用メッセージ
- `digest`: 自動生成されたエラーハッシュ（サーバーサイドログとの照合用）

開発環境では元の `message` がクライアントに送信される（デバッグ容易化）。
