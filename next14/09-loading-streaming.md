# Next.js 14 App Router - Loading UI & Streaming

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming

## loading.js

`loading.js` で React Suspense を使ったローディングUIを作成。

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

### 動作

- `loading.js` は `layout.js` の中にネスト
- `page.js` とその配下を `<Suspense>` 境界で自動ラップ

```
<Layout>
  <Suspense fallback={<Loading />}>
    <Page />
  </Suspense>
</Layout>
```

**特徴:**
- ナビゲーションは即座（サーバーセントリックルーティングでも）
- ナビゲーションは中断可能（ルートコンテンツのロード完了を待たずに別ルートへ移動可能）
- 新しいルートセグメントのロード中も共有レイアウトはインタラクティブ

---

## Streaming with Suspense

`loading.js` に加え、独自の `<Suspense>` 境界を手動で作成可能。

### SSR の課題と Streaming の解決

**従来のSSR（順次・ブロッキング）:**
1. サーバーでページの全データをフェッチ
2. サーバーでHTMLをレンダリング
3. HTML, CSS, JS をクライアントに送信
4. 非インタラクティブUIを表示
5. React がハイドレーション → インタラクティブ化

**Streaming:**
- ページのHTMLをチャンクに分割して順次送信
- データのロード完了を待たずにUIの一部を先に表示
- 優先度の高いコンポーネントを先に送信可能

### メリット

- **TTFB** の改善
- **FCP** の改善
- **TTI** の改善（特に低速デバイス）

### Suspense の使い方

```tsx
import { Suspense } from 'react'
import { PostFeed, Weather } from './Components'

export default function Posts() {
  return (
    <section>
      <Suspense fallback={<p>Loading feed...</p>}>
        <PostFeed />
      </Suspense>
      <Suspense fallback={<p>Loading weather...</p>}>
        <Weather />
      </Suspense>
    </section>
  )
}
```

**Suspense の利点:**
1. **Streaming Server Rendering**: サーバーからクライアントへHTMLを順次レンダリング
2. **Selective Hydration**: ユーザーインタラクションに基づいてハイドレーション優先度を決定

---

## SEO

- `generateMetadata` 内のデータフェッチが完了するまでUIストリーミングを待機 → `<head>` タグが最初に含まれる
- ストリーミングはサーバーレンダリングのためSEOに影響なし

## ステータスコード

- ストリーミング中は `200` が返される
- レスポンスヘッダーは既に送信済みのため、ステータスコードの変更は不可
- `redirect` や `notFound` はストリーミングコンテンツ内でエラーを通知
- SEO には影響しない
