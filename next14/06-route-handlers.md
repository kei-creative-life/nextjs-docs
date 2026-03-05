# Next.js 14 App Router - Route Handlers

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/route-handlers

## 概要

Web の Request/Response API を使ってカスタムリクエストハンドラを作成。
`app` ディレクトリ内でのみ利用可能（`pages` の API Routes に相当）。

## 規約

`route.js|ts` ファイルで定義:

```ts
// app/api/route.ts
export async function GET(request: Request) {}
```

**制約:** 同じルートセグメントに `route.js` と `page.js` を共存させることは**不可**。

## サポートされるHTTPメソッド

`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`

未サポートメソッド → `405 Method Not Allowed`

## NextRequest / NextResponse

ネイティブの Request/Response を拡張した便利なヘルパー。

---

## キャッシング

### デフォルトでキャッシュされる条件

`GET` メソッド + `Response` オブジェクト使用時:

```ts
export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...')
  const data = await res.json()
  return Response.json({ data })
}
```

### キャッシュのオプトアウト

- `Request` オブジェクトを `GET` で使用
- 他のHTTPメソッド（POST等）を使用
- Dynamic Functions（`cookies`, `headers`）を使用
- Segment Config で dynamic モードを指定

```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  // Request オブジェクトを使用 → キャッシュされない
  const res = await fetch(`https://data.mongodb-api.com/product/${id}`)
  const product = await res.json()
  return Response.json({ product })
}
```

---

## 再検証

```ts
export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    next: { revalidate: 60 },  // 60秒ごと
  })
  const data = await res.json()
  return Response.json(data)
}
```

またはセグメント設定:
```ts
export const revalidate = 60
```

---

## Cookies

```ts
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const token = cookieStore.get('token')

  return new Response('Hello', {
    status: 200,
    headers: { 'Set-Cookie': `token=${token.value}` },
  })
}
```

NextRequest 経由でも:
```ts
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')
}
```

## Headers

```ts
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const headersList = headers()
  const referer = headersList.get('referer')

  return new Response('Hello', {
    status: 200,
    headers: { referer: referer },
  })
}
```

---

## Dynamic Route Segments

```ts
// app/items/[slug]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
}
```

## URL Query Parameters

```ts
import { type NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  // /api/search?query=hello → query = "hello"
}
```

## リダイレクト

```ts
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  redirect('https://nextjs.org/')
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
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
  })
  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

---

## Webhooks

```ts
export async function POST(request: Request) {
  try {
    const text = await request.text()
    // Webhook ペイロードを処理
  } catch (error) {
    return new Response(`Webhook error: ${error.message}`, { status: 400 })
  }
  return new Response('Success!', { status: 200 })
}
```

---

## Segment Config Options

```ts
export const dynamic = 'auto'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
export const runtime = 'nodejs'       // 'edge' も可
export const preferredRegion = 'auto'
```

---

## Non-UI Responses

RSS, sitemap, robots.txt 等のレスポンスも可能:

```ts
export async function GET() {
  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Next.js Documentation</title>
    <link>https://nextjs.org/docs</link>
  </channel>
</rss>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}
```

> `sitemap.xml`, `robots.txt`, `app icons`, `opengraph-image` にはビルトインサポートあり。
