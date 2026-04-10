# Next.js 15 App Router - キャッシング

> ソース: https://nextjs.org/docs/app/building-your-application/caching

::: danger 破壊的変更
v15 ではキャッシュのデフォルト動作が大幅に変更された。v14 では「可能な限りキャッシュする」がデフォルトだったが、v15 では「デフォルトでキャッシュしない」に変更。
:::

## 4つのキャッシュメカニズム

| メカニズム | 対象 | 場所 | 目的 | 期間 |
|-----------|------|------|------|------|
| Request Memoization | 関数の戻り値 | サーバー | Reactコンポーネントツリー内でデータ再利用 | リクエストライフサイクル |
| Data Cache | データ | サーバー | ユーザーリクエスト・デプロイを跨いでデータ保存 | 永続的（再検証可能） |
| Full Route Cache | HTML と RSC Payload | サーバー | レンダリングコスト削減 | 永続的（再検証可能） |
| Router Cache | RSC Payload | クライアント | ナビゲーション時のサーバーリクエスト削減 | セッション or 時間ベース |

---

## v14 → v15 キャッシュデフォルト変更まとめ

| キャッシュ | v14 デフォルト | v15 デフォルト | v14 の動作に戻す方法 |
|-----------|-------------|-------------|-------------------|
| **fetch** | `force-cache` | `no-store` | `fetch(url, { cache: 'force-cache' })` |
| **GET Route Handler** | キャッシュされる | キャッシュされない | `export const dynamic = 'force-static'` |
| **Client Router Cache（Page）** | `staleTime: 30s`（動的）/ `5min`（静的） | `staleTime: 0` | `staleTimes: { dynamic: 30 }` を設定 |

---

## 1. Request Memoization（React の機能）

- React が `fetch` を自動メモ化（変更なし）
- 同じURL・オプションの `fetch` はレンダリングパス内で1回だけ実行
- **GET メソッドのみ**
- React コンポーネントツリー内のみ（Route Handlers は対象外）

```tsx
async function getItem() {
  const res = await fetch('https://.../item/1')
  return res.json()
}

const item = await getItem() // cache MISS（実行される）
const item = await getItem() // cache HIT（メモから返す）
```

---

## 2. Data Cache

::: danger 破壊的変更
`fetch` のデフォルトが `no-store` に変更。キャッシュするには明示的な指定が必要。
:::

```tsx
// v14: デフォルトでキャッシュされた
fetch('https://...')

// v15: デフォルトでキャッシュされない
fetch('https://...')

// v15: 明示的にキャッシュを有効化
fetch('https://...', { cache: 'force-cache' })
```

### 再検証

#### 時間ベース
```js
fetch('https://...', { next: { revalidate: 3600 } })
```

#### オンデマンド
```js
revalidatePath('/')
revalidateTag('collection')
```

### オプトアウト

```js
// v15 ではデフォルトで no-store なので、明示的なオプトアウトは通常不要
fetch('https://...', { cache: 'no-store' })

// セグメント全体
export const dynamic = 'force-dynamic'
```

---

## 3. Full Route Cache

- ビルド時に静的レンダリングされたルートのHTML + RSC Payloadをキャッシュ
- CDNから配信可能

### 無効化

1. **Data Cache の再検証** → Full Route Cache も無効化
2. **再デプロイ** → Full Route Cache はクリア

### オプトアウト

::: danger 破壊的変更
`cookies()` と `headers()` が非同期に。Dynamic Functions として引き続き Full Route Cache をオプトアウトするが、呼び出し時に `await` が必要。
:::

- Dynamic Functions の使用（`await cookies()`, `await headers()`, `searchParams`）
- `dynamic = 'force-dynamic'` または `revalidate = 0`
- Data Cache のオプトアウト

---

## 4. Router Cache（クライアントサイド）

::: danger 破壊的変更
Page コンポーネントのデフォルト `staleTime` が `0` に変更。ナビゲーション時に常にサーバーから最新データを取得。
:::

### v14 vs v15 の Router Cache 動作

| | v14 | v15 |
|--|-----|-----|
| 動的ルートの staleTime | 30秒 | **0**（即座に再取得） |
| 静的ルートの staleTime | 5分 | **0**（即座に再取得） |
| `loading.js` | 5分キャッシュ | **5分キャッシュ**（変更なし） |
| 共有レイアウト | リフェッチしない | **リフェッチしない**（変更なし） |
| 戻る/進む | キャッシュから復元 | **キャッシュから復元**（変更なし） |

### v14 の動作に戻す

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,   // 動的ルートを30秒キャッシュ
      static: 300,   // 静的ルートを5分キャッシュ
    },
  },
}
```

### 無効化

- Server Action で `revalidatePath` / `revalidateTag`
- `cookies.set` / `cookies.delete`
- `router.refresh`

---

## キャッシュの相互作用

### Data Cache ↔ Full Route Cache
- Data Cache の再検証/オプトアウト → Full Route Cache も無効化
- Full Route Cache のオプトアウト → Data Cache には**影響しない**

### Data Cache ↔ Router Cache
- Route Handler での Data Cache 再検証 → Router Cache は**即座に無効化されない**
- Server Action での再検証 → Router Cache も無効化

---

## API とキャッシュの関係

| API | Router Cache | Full Route Cache | Data Cache | React Cache |
|-----|-------------|-----------------|------------|-------------|
| `<Link prefetch>` | キャッシュ | | | |
| `router.prefetch` | キャッシュ | | | |
| `router.refresh` | 再検証 | | | |
| `fetch` | | | **要明示指定** | キャッシュ |
| `fetch cache:'force-cache'` | | キャッシュ | キャッシュ | |
| `fetch cache:'no-store'` | | | オプトアウト | |
| `fetch next.revalidate` | | 再検証 | 再検証 | |
| `revalidateTag` | 再検証(SA) | 再検証 | 再検証 | |
| `revalidatePath` | 再検証(SA) | 再検証 | 再検証 | |
| `cookies` | 再検証(SA) | オプトアウト | | |
| `headers`, `searchParams` | | オプトアウト | | |

> SA = Server Action 経由の場合
