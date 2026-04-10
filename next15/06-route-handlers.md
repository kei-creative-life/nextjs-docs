# Next.js 15 App Router - Route Handlers

> ソース: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

## 概要

Web の Request/Response API を使ってカスタムリクエストハンドラを作成。
`app` ディレクトリ内でのみ利用可能。

## 規約

`route.js|ts` ファイルで定義:

```ts
// app/api/route.ts
export async function GET(request: Request) {}
```

**制約:** 同じルートセグメントに `route.js` と `page.js` を共存させることは**不可**。

## サポートされるHTTPメソッド

`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`

---

## キャッシング

::: danger 破壊的変更
`GET` Route Handlers がデフォルトでキャッシュされなくなった。v14 では `Response` オブジェクト使用時にキャッシュされていた。
:::

### v14 vs v15

| 条件 | v14 | v15 |
|------|-----|-----|
| `GET` + `Response` オブジェクト | キャッシュされる | **キャッシュされない** |
| `GET` + `Request` オブジェクト | キャッシュされない | キャッシュされない |
| POST, PUT 等 | キャッシュされない | キャッシュされない |

### v14 の動作に戻す

```ts
// 明示的にキャッシュを有効化
export const dynamic = 'force-static'

export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...')
  const data = await res.json()
  return Response.json({ data })
}
```

### キャッシュのオプトアウト（v15 ではデフォルト）

- Dynamic Functions（`cookies`, `headers`）を使用
- 他のHTTPメソッド（POST等）を使用
- Segment Config で dynamic モードを指定

---

## 再検証

```ts
export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    next: { revalidate: 60 },
  })
  const data = await res.json()
  return Response.json(data)
}
```

---

## Cookies

::: danger 破壊的変更
`cookies()` が非同期に変更。`await` が必要。
:::

```ts
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  // v14: const cookieStore = cookies()
  const cookieStore = await cookies()  // v15: await が必要
  const token = cookieStore.get('token')

  return new Response('Hello', {
    status: 200,
    headers: { 'Set-Cookie': `token=${token?.value}` },
  })
}
```

## Headers

::: danger 破壊的変更
`headers()` が非同期に変更。`await` が必要。
:::

```ts
import { headers } from 'next/headers'

export async function GET(request: Request) {
  // v14: const headersList = headers()
  const headersList = await headers()  // v15: await が必要
  const referer = headersList.get('referer')

  return new Response('Hello', {
    status: 200,
    headers: { referer: referer ?? '' },
  })
}
```

---

## Dynamic Route Segments

::: danger 破壊的変更
`params` が非同期に変更。`await` が必要。
:::

```ts
// app/items/[slug]/route.ts

// v14
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
}

// v15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
}
```

## URL Query Parameters

```ts
import { type NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
}
```

---

## Request Body

```ts
export async function POST(request: Request) {
  const res = await request.json()
  return Response.json({ res })
}
```

### FormData

```ts
export async function POST(request: Request) {
  const formData = await request.formData()
  const name = formData.get('name')
  const email = formData.get('email')
  return Response.json({ name, email })
}
```

---

## CORS

```ts
export async function GET(request: Request) {
  return new Response('Hello', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

---

## Streaming

```ts
export const runtime = 'edge'  // v14 の 'experimental-edge' は廃止

export async function POST(req: Request) {
  // ストリーミングレスポンスの実装
}
```

::: danger 破壊的変更
`export const runtime = "experimental-edge"` は廃止。`"edge"` を使用すること。自動変換コマンド: `npx @next/codemod@canary app-dir-runtime-config-experimental-edge .`
:::

---

## Segment Config Options

```ts
export const dynamic = 'auto'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
```

---

## Non-UI Responses

```ts
export async function GET() {
  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Next.js Documentation</title>
  </channel>
</rss>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}
```
