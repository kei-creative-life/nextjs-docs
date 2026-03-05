# Next.js 14 App Router - レンダリング（Server/Client Components）

> ソース: https://nextjs.org/docs/14/app/building-your-application/rendering

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

> ソース: https://nextjs.org/docs/14/app/building-your-application/rendering/server-components

### 利点

- **データフェッチ**: サーバー側でデータソースに近い場所でフェッチ → 高速化
- **セキュリティ**: トークンやAPIキーをクライアントに露出しない
- **キャッシング**: レンダリング結果をキャッシュ、リクエスト・ユーザー間で再利用
- **バンドルサイズ**: 大きな依存関係をサーバーに保持
- **初期ページロード / FCP**: サーバーでHTML生成、即座に表示
- **SEO**: レンダリング済みHTMLを検索エンジンがインデックス
- **ストリーミング**: レンダリングをチャンクに分割してクライアントに順次送信

### デフォルトでServer Components

Next.js は**デフォルトで Server Components** を使用。追加設定不要。

### レンダリングプロセス

**サーバー側:**
1. React が Server Components を **RSC Payload**（React Server Component Payload）にレンダリング
2. Next.js が RSC Payload と Client Component JS を使って **HTML** をレンダリング

**クライアント側:**
1. HTML で非インタラクティブなプレビューを即座に表示
2. RSC Payload で Client/Server Component ツリーを照合、DOM を更新
3. JS でClient Components を**ハイドレーション**（インタラクティブ化）

### RSC Payload の中身
- Server Components のレンダリング結果
- Client Components のレンダリング位置のプレースホルダーとJSファイルへの参照
- Server Component → Client Component に渡されたprops

---

## サーバーレンダリング戦略

### 1. Static Rendering（デフォルト）

- **ビルド時**にレンダリング（またはデータ再検証後にバックグラウンドで）
- 結果がキャッシュされCDNに配信可能
- ユーザーに個人化されないデータに適する（ブログ記事、商品ページ等）

### 2. Dynamic Rendering

- **リクエスト時**に各ユーザーごとにレンダリング
- 個人化されたデータや、リクエスト時のみ判明する情報に適する

**動的レンダリングへの切り替え条件:**

| Dynamic Functions | データ | ルート |
|-------------------|--------|--------|
| なし | キャッシュ済み | 静的レンダリング |
| あり | キャッシュ済み | 動的レンダリング |
| なし | 未キャッシュ | 動的レンダリング |
| あり | 未キャッシュ | 動的レンダリング |

**Dynamic Functions:**
- `cookies()` / `headers()` → ルート全体を動的レンダリングに
- `searchParams` prop（Pageコンポーネント）→ ページを動的レンダリングに

### 3. Streaming

- サーバーからUIをチャンク単位で順次レンダリング
- `loading.js` と React `<Suspense>` で実現
- TTFB、FCP を改善

---

## Client Components

> ソース: https://nextjs.org/docs/14/app/building-your-application/rendering/client-components

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

### `"use client"` の境界

- `"use client"` を定義したファイルにインポートされた全てのモジュール（子コンポーネント含む）がクライアントバンドルの一部になる
- 全てのコンポーネントに定義する必要はない。境界を定義すれば、その配下は全てクライアント

### レンダリングプロセス

**初回ページロード:**
1. サーバーで Client/Server Components 両方の静的HTMLプレビューをレンダリング
2. クライアントでHTMLを即座に表示（非インタラクティブ）
3. RSC Payload でツリーを照合、DOM更新
4. ハイドレーションでインタラクティブ化

**後続ナビゲーション:**
- クライアントのみでレンダリング（サーバーレンダリングHTMLなし）

### サーバー環境に戻る

`"use client"` 境界の後でも、Server Components と Server Actions のインターリービングでサーバーコードを維持可能。

---

## 構成パターン

> ソース: https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns

### Client Components をツリーの下部に移動

```tsx
// Layout は Server Component のまま
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

### サードパーティパッケージの扱い

`"use client"` ディレクティブがないサードパーティコンポーネントは Server Component 内で直接使えない。
ラッパーを作成:

```tsx
// app/carousel.tsx
'use client'
import { Carousel } from 'acme-carousel'
export default Carousel
```

### Context Providers

Server Components では `createContext` は使えない。Client Component でラップ:

```tsx
// app/theme-provider.tsx
'use client'
import { createContext } from 'react'

export const ThemeContext = createContext({})

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}
```

```tsx
// app/layout.tsx
import ThemeProvider from './theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

> Provider はできるだけツリーの深い位置にレンダリングする。

### Server→Client コンポーネントのインターリービング

**NG: Client Component 内で Server Component をインポート**
```tsx
'use client'
import ServerComponent from './Server-Component'  // NG!
```

**OK: Server Component を Client Component の children/props として渡す**
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

サーバー専用コードの誤ったクライアント使用を防ぐ:

```bash
npm install server-only
```

```ts
import 'server-only'

export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: { authorization: process.env.API_KEY },
  })
  return res.json()
}
```
