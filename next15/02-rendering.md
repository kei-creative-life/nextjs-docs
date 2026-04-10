# Next.js 15 App Router - レンダリング（Server/Client Components）

> ソース: https://nextjs.org/docs/app/building-your-application/rendering

## Server Components vs Client Components 使い分け

| やりたいこと | Server | Client |
|------------|--------|--------|
| データフェッチ | o | |
| バックエンドリソースに直接アクセス | o | |
| 機密情報をサーバーに保持（トークン、APIキー） | o | |
| 大きな依存関係をサーバーに保持 / クライアントJS削減 | o | |
| インタラクティブ性、イベントリスナー（onClick, onChange等） | | o |
| State、Lifecycle Effects（useState, useEffect等） | | o |
| ブラウザ専用API | | o |
| state/effects/ブラウザAPIに依存するカスタムフック | | o |
| React クラスコンポーネント | | o |

---

## Server Components

### 利点

- **データフェッチ**: サーバー側でデータソースに近い場所でフェッチ
- **セキュリティ**: トークンやAPIキーをクライアントに露出しない
- **キャッシング**: レンダリング結果をキャッシュ、リクエスト・ユーザー間で再利用
- **バンドルサイズ**: 大きな依存関係をサーバーに保持
- **初期ページロード / FCP**: サーバーでHTML生成
- **SEO**: レンダリング済みHTMLを検索エンジンがインデックス
- **ストリーミング**: レンダリングをチャンクに分割して順次送信

### レンダリングプロセス

**サーバー側:**
1. React が Server Components を **RSC Payload** にレンダリング
2. Next.js が RSC Payload と Client Component JS を使って **HTML** をレンダリング

**クライアント側:**
1. HTML で非インタラクティブなプレビューを即座に表示
2. RSC Payload で Client/Server Component ツリーを照合、DOM を更新
3. JS でClient Components を**ハイドレーション**

---

## サーバーレンダリング戦略

### 1. Static Rendering（デフォルト）

- **ビルド時**にレンダリング
- 結果がキャッシュされCDNに配信可能

### 2. Dynamic Rendering

- **リクエスト時**に各ユーザーごとにレンダリング

::: danger 破壊的変更
Dynamic Functions（`cookies()`, `headers()`）が非同期に変更された。これらを使用する場合は `await` が必要。
:::

```tsx
// v14
import { cookies } from 'next/headers'
const cookieStore = cookies()

// v15
import { cookies } from 'next/headers'
const cookieStore = await cookies()
```

### 3. Streaming

- サーバーからUIをチャンク単位で順次レンダリング
- `loading.js` と React `<Suspense>` で実現

---

## Client Components

### 使い方

ファイルの先頭に `"use client"` ディレクティブを追加:

```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

---

## React 19 対応

::: tip 新機能
Next.js 15 は React 19 を採用。以下の新機能が利用可能。
:::

### `ref` が props として直接利用可能

`forwardRef` が不要に:

```tsx
// v14（React 18）— forwardRef が必要
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />
})

// v15（React 19）— ref が直接 props に
function Input({ ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />
}
```

### `<Context>` を直接 Provider として使用

```tsx
// v14（React 18）
<ThemeContext.Provider value="dark">
  {children}
</ThemeContext.Provider>

// v15（React 19）
<ThemeContext value="dark">
  {children}
</ThemeContext>
```

### ref コールバックのクリーンアップ

```tsx
// v15（React 19）— クリーンアップ関数を返せる
<input ref={(node) => {
  // マウント時
  node.focus()
  // クリーンアップ（アンマウント時）
  return () => {
    // cleanup
  }
}} />
```

### `useDeferredValue` に初期値

```tsx
// v14
const deferredValue = useDeferredValue(value)

// v15 — 初期値を指定可能
const deferredValue = useDeferredValue(value, 'loading...')
```

---

## Turbopack Dev

::: tip 新機能
`next dev --turbo` が安定版に。開発体験が大幅に向上。
:::

```bash
next dev --turbo
```

**パフォーマンス改善:**
- ローカルサーバー起動: 最大 **76.7%** 高速化
- Fast Refresh: 最大 **96.3%** 高速化
- 初回ルートコンパイル: 最大 **45.8%** 高速化

---

## Hydration エラーの改善

::: tip 新機能
Hydration エラーのエラービューが改善。エラーのソースコードと修正提案が表示されるように。
:::

v14.1 から始まった改善がさらに強化され、エラーの原因と解決策がより明確に表示される。

---

## 構成パターン

### Client Components をツリーの下部に移動

```tsx
import SearchBar from './searchbar'  // Client Component
import Logo from './logo'            // Server Component

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav>
        <Logo />
        <SearchBar />
      </nav>
      <main>{children}</main>
    </>
  )
}
```

### Server→Client にデータを渡す

Props は**シリアライズ可能**である必要がある。

### Server→Client コンポーネントのインターリービング

**NG: Client Component 内で Server Component をインポート**
```tsx
'use client'
import ServerComponent from './Server-Component'  // NG!
```

**OK: Server Component を children/props として渡す**
```tsx
// app/page.tsx (Server Component)
import ClientComponent from './client-component'
import ServerComponent from './server-component'

export default function Page() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  )
}
```

### server-only パッケージ

```ts
import 'server-only'

export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: { authorization: process.env.API_KEY! },
  })
  return res.json()
}
```

---

## Static Route Indicator

::: tip 新機能
開発中に静的ルートと動的ルートを視覚的に区別するインジケーターが表示される。
:::

`next build` の出力でも全ルートのレンダリング戦略が確認可能。

無効化する場合:
```ts
// next.config.ts
const nextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },
}
```

---

## React Compiler（実験的）

::: tip 新機能
React Compiler により `useMemo`/`useCallback` の手動最適化が不要に（実験的）。
:::

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
}
```

> 現時点では Babel プラグインとして動作するため、開発・ビルド時間が若干増加する。
