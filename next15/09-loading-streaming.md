# Next.js 15 App Router - Loading UI & Streaming

> ソース: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

> v14 からの変更はほぼなし。

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
- ナビゲーションは即座
- ナビゲーションは中断可能
- 新しいルートセグメントのロード中も共有レイアウトはインタラクティブ

::: warning 動作変更
Router Cache における `loading.js` のキャッシュ期間は引き続き **5分**（`staleTimes.static` の値）。Page のデフォルト staleTime が 0 に変更されたが、loading.js は影響を受けない。
:::

---

## Streaming with Suspense

`loading.js` に加え、独自の `<Suspense>` 境界を手動で作成可能。

### SSR の課題と Streaming の解決

**従来のSSR（順次・ブロッキング）:**
1. サーバーでページの全データをフェッチ
2. サーバーでHTMLをレンダリング
3. HTML, CSS, JS をクライアントに送信
4. 非インタラクティブUIを表示
5. React がハイドレーション

**Streaming:**
- ページのHTMLをチャンクに分割して順次送信
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

---

## SEO

- `generateMetadata` 内のデータフェッチが完了するまでUIストリーミングを待機
- ストリーミングはサーバーレンダリングのためSEOに影響なし

## ステータスコード

- ストリーミング中は `200` が返される
- `redirect` や `notFound` はストリーミングコンテンツ内でエラーを通知
