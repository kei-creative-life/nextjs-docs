# Next.js 15 App Router - Middleware

> ソース: https://nextjs.org/docs/app/building-your-application/routing/middleware

## 概要

リクエストが完了する前にコードを実行。
リクエストに基づいてレスポンスを書き換え、リダイレクト、ヘッダー変更、直接レスポンス返却が可能。

**キャッシュされたコンテンツやルートマッチングの前に実行される。**

## 規約

プロジェクトルートに `middleware.ts`（or `.js`）を配置。

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

---

## react-server 条件

::: danger 破壊的変更
Middleware に `react-server` 条件が適用されるようになった。React のクライアント専用APIのインポートが制限される。
:::

Middleware 内で `useState`, `useEffect` などのクライアント React API をインポートするとエラーになる。Middleware はサーバーサイドで実行されるため、これらのAPIは本来使用すべきではない。

---

## パスマッチング

### 実行順序

1. `next.config.js` の `headers`
2. `next.config.js` の `redirects`
3. **Middleware**（rewrites, redirects 等）
4. `next.config.js` の `beforeFiles` rewrites
5. ファイルシステムルート
6. `next.config.js` の `afterFiles` rewrites
7. Dynamic Routes
8. `next.config.js` の `fallback` rewrites

### Matcher

```js
export const config = {
  matcher: '/about/:path*',
}

// 複数パス
export const config = {
  matcher: ['/about/:path*', '/dashboard/:path*'],
}
```

**静的ファイルを除外:**

```js
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**プリフェッチを除外:**

```js
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

---

## NextResponse API

- `redirect`: 別URLにリダイレクト
- `rewrite`: 指定URLのレスポンスを表示
- リクエスト/レスポンスヘッダーの設定
- レスポンスCookieの設定

---

## Cookies

```ts
export function middleware(request: NextRequest) {
  let cookie = request.cookies.get('nextjs')
  const allCookies = request.cookies.getAll()
  request.cookies.has('nextjs')
  request.cookies.delete('nextjs')

  const response = NextResponse.next()
  response.cookies.set('vercel', 'fast')
  response.cookies.set({ name: 'vercel', value: 'fast', path: '/' })

  return response
}
```

---

## ヘッダーの設定

```ts
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hello-from-middleware1', 'hello')

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  response.headers.set('x-hello-from-middleware2', 'hello')
  return response
}
```

---

## 直接レスポンス

```ts
import { NextRequest } from 'next/server'
import { isAuthenticated } from '@lib/auth'

export const config = {
  matcher: '/api/:function*',
}

export function middleware(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return Response.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    )
  }
}
```

---

## waitUntil

```ts
export function middleware(req: NextRequest, event: NextFetchEvent) {
  event.waitUntil(
    fetch('https://my-analytics-platform.com', {
      method: 'POST',
      body: JSON.stringify({ pathname: req.nextUrl.pathname }),
    })
  )
  return NextResponse.next()
}
```

---

## NextRequest の変更

::: danger 破壊的変更
`NextRequest` の `geo` と `ip` プロパティが削除された。これらの値はホスティングプロバイダが提供する。
:::

Vercel を使用する場合は `@vercel/functions` を使用:

```ts
import { geolocation, ipAddress } from '@vercel/functions'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { city } = geolocation(request)
  const ip = ipAddress(request)
  // ...
}
```

---

## ランタイム

Middleware は **Edge Runtime のみ**。Node.js Runtime は使用不可。
