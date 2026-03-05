# Next.js 14 App Router - キャッシング

> ソース: https://nextjs.org/docs/14/app/building-your-application/caching

## 4つのキャッシュメカニズム

| メカニズム | 対象 | 場所 | 目的 | 期間 |
|-----------|------|------|------|------|
| Request Memoization | 関数の戻り値 | サーバー | Reactコンポーネントツリー内でデータ再利用 | リクエストライフサイクル |
| Data Cache | データ | サーバー | ユーザーリクエスト・デプロイを跨いでデータ保存 | 永続的（再検証可能） |
| Full Route Cache | HTML と RSC Payload | サーバー | レンダリングコスト削減 | 永続的（再検証可能） |
| Router Cache | RSC Payload | クライアント | ナビゲーション時のサーバーリクエスト削減 | セッション or 時間ベース |

> デフォルトで Next.js は可能な限りキャッシュする。

---

## 1. Request Memoization（React の機能）

- React が `fetch` を自動メモ化
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

**期間:** レンダリングパスが完了するまで（サーバーリクエスト単位）

**オプトアウト:** `AbortController` の `signal` を渡す
```js
const { signal } = new AbortController()
fetch(url, { signal })
```

---

## 2. Data Cache

- `fetch` の結果をリクエスト・デプロイを跨いで**永続的に保存**
- デフォルトでキャッシュ（`cache: 'force-cache'`）

### 再検証

#### 時間ベース
```js
fetch('https://...', { next: { revalidate: 3600 } })  // 1時間
```

**Stale-While-Revalidate 方式:**
1. 期間内のリクエスト → キャッシュデータを返す
2. 期間後の最初のリクエスト → キャッシュ（stale）を返す + バックグラウンドで再検証
3. 再検証成功 → キャッシュ更新 / 失敗 → 前のデータを維持

#### オンデマンド
```js
revalidatePath('/')           // パスベース
revalidateTag('collection')   // タグベース
```

- オンデマンド再検証はキャッシュエントリを**即座に削除**
- 次のリクエストで新しいデータをフェッチ

### オプトアウト

```js
fetch('https://...', { cache: 'no-store' })

// またはセグメント全体
export const dynamic = 'force-dynamic'
```

---

## 3. Full Route Cache

- ビルド時に静的レンダリングされたルートのHTML + RSC Payloadをキャッシュ
- CDNから配信可能

### 無効化

1. **Data Cache の再検証** → Full Route Cache も無効化
2. **再デプロイ** → Full Route Cache はクリア（Data Cache は永続）

### オプトアウト

- Dynamic Functions の使用（`cookies()`, `headers()`, `searchParams`）
- `dynamic = 'force-dynamic'` または `revalidate = 0`
- Data Cache のオプトアウト（`cache: 'no-store'` のfetchがあるルート）

---

## 4. Router Cache（クライアントサイド）

- ブラウザのインメモリキャッシュ
- 訪問済みルートとプリフェッチされたルートのRSC Payloadを保存

### 期間

- **セッション**: ナビゲーション間で持続、ページリフレッシュでクリア
- **自動無効化期間**:
  - 動的レンダリングのルート: **30秒**
  - 静的レンダリングのルート: **5分**

### 無効化

- Server Action で `revalidatePath` / `revalidateTag`
- `cookies.set` / `cookies.delete` → 認証変更などに対応
- `router.refresh` → Router Cache をクリアし、サーバーに新しいリクエスト

### オプトアウト

Router Cache 自体のオプトアウトは**不可能**。
`<Link prefetch={false}>` でプリフェッチは無効化できるが、30秒間はキャッシュされる。

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
| `fetch` | | | キャッシュ | キャッシュ |
| `fetch cache:'no-store'` | | | オプトアウト | |
| `fetch next.revalidate` | | 再検証 | 再検証 | |
| `fetch next.tags` | | キャッシュ | キャッシュ | |
| `revalidateTag` | 再検証(SA) | 再検証 | 再検証 | |
| `revalidatePath` | 再検証(SA) | 再検証 | 再検証 | |
| `const revalidate` | | 再検証/out | 再検証/out | |
| `const dynamic` | | キャッシュ/out | キャッシュ/out | |
| `cookies` | 再検証(SA) | オプトアウト | | |
| `headers`, `searchParams` | | オプトアウト | | |
| `generateStaticParams` | | キャッシュ | | |
| `React.cache` | | | | キャッシュ |

> SA = Server Action 経由の場合

---

## `revalidatePath` vs `router.refresh`

| | `revalidatePath` | `router.refresh` |
|--|-------------------|-------------------|
| Router Cache | クリア | クリア |
| Data Cache | パージ | **変更なし** |
| Full Route Cache | パージ | **変更なし** |
| 用途 | サーバーサイドからのデータ・ルート更新 | クライアントからのUI更新 |
