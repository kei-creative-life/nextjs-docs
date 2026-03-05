# Next.js 14 App Router - Middleware

> ソース: https://nextjs.org/docs/14/app/building-your-application/routing/middleware

## 概要

リクエストが完了する前にコードを実行。
リクエストに基づいてレスポンスを書き換え、リダイレクト、ヘッダー変更、直接レスポンス返却が可能。

**キャッシュされたコンテンツやルートマッチングの前に実行される。**

## 規約

プロジェクトルートに `middleware.ts`（or `.js`）を配置。
`pages` や `app` と同じレベル、または `src` ディレクトリ内。

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

## パスマッチング

### 実行順序

1. `next.config.js` の `headers`
2. `next.config.js` の `redirects`
3. **Middleware**（rewrites, redirects 等）
4. `next.config.js` の `beforeFiles` rewrites
5. ファイルシステムルート（`public/`, `_next/static/`, `pages/`, `app/` 等）
6. `next.config.js` の `afterFiles` rewrites
7. Dynamic Routes（`/blog/[slug]`）
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

**一般的なパターン（静的ファイルを除外）:**

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

**Matcher のルール:**
- `/` で始まる必要がある
- 名前付きパラメータ: `/about/:path` → `/about/a` にマッチ、`/about/a/c` にはマッチしない
- 修飾子: `*`（0個以上）、`?`（0または1個）、`+`（1個以上）
- 正規表現: `/about/(.*)` = `/about/:path*`

### 条件文

```ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/about')) {
    return NextResponse.rewrite(new URL('/about-2', request.url))
  }
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.rewrite(new URL('/dashboard/user', request.url))
  }
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
  // リクエストCookieの読み取り
  let cookie = request.cookies.get('nextjs')
  const allCookies = request.cookies.getAll()
  request.cookies.has('nextjs')   // true
  request.cookies.delete('nextjs')

  // レスポンスCookieの設定
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

バックグラウンド作業の実行:

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

## 高度なフラグ

### skipTrailingSlashRedirect

トレイリングスラッシュのリダイレクトを無効化:

```js
// next.config.js
module.exports = { skipTrailingSlashRedirect: true }
```

### skipMiddlewareUrlNormalize

URL正規化を無効化:

```js
// next.config.js
module.exports = { skipMiddlewareUrlNormalize: true }
```

---

## ランタイム

Middleware は **Edge Runtime のみ**。Node.js Runtime は使用不可。
