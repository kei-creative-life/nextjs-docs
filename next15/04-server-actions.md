# Next.js 15 App Router - Server Actions & Mutations

> ソース: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

## 概要

Server Actions = サーバーで実行される**非同期関数**。
フォーム送信とデータミューテーションを処理。

## 定義方法

### Server Component 内（インライン）

```tsx
export default function Page() {
  async function create() {
    'use server'
    // サーバーで実行される
  }

  return <form action={create}>...</form>
}
```

### 別ファイル（Client Component から使用する場合）

```ts
// app/actions.ts
'use server'

export async function create() {
  // ...
}
```

## 動作特性

- `<form>` の `action` 属性で呼び出し可能
- Server Components ではプログレッシブエンハンスメント（JS無しでもフォーム送信可能）
- `POST` メソッドのみで呼び出される
- 引数と返り値はシリアライズ可能である必要がある

---

## セキュリティ強化

::: tip 新機能
Server Actions のセキュリティが強化された。
:::

### 推測不能なアクションID

Next.js が非決定論的なIDを生成し、ビルドごとに再計算:

```tsx
// app/actions.js
'use server'

// 使用されているアクション → セキュアなIDでクライアントから参照可能
export async function updateUserAction(formData) {}

// 未使用のアクション → next build で自動削除、公開エンドポイントにならない
export async function deleteUserAction(formData) {}
```

### Dead Code Elimination

未使用の Server Actions がクライアントバンドルに含まれなくなり、バンドルサイズが削減。

---

## フォーム操作

### 基本的なフォーム

```tsx
export default function Page() {
  async function createInvoice(formData: FormData) {
    'use server'
    const rawFormData = {
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    }
    // データミューテーション & キャッシュ再検証
  }

  return <form action={createInvoice}>...</form>
}
```

### 追加引数を渡す（bind）

```tsx
'use client'
import { updateUser } from './actions'

export function UserProfile({ userId }: { userId: string }) {
  const updateUserWithId = updateUser.bind(null, userId)
  return (
    <form action={updateUserWithId}>
      <input type="text" name="name" />
      <button type="submit">Update User Name</button>
    </form>
  )
}
```

### Pending State（useFormStatus）

```tsx
'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" aria-disabled={pending}>
      Add
    </button>
  )
}
```

### サーバーサイドバリデーション

::: danger 破壊的変更
`useFormState` が `useActionState` に名前変更（React 19）。`react-dom` ではなく `react` からインポート。
:::

```tsx
// v14 — useFormState（react-dom）
import { useFormState } from 'react-dom'

// v15 — useActionState（react）
import { useActionState } from 'react'
```

```ts
// app/actions.ts
'use server'
import { z } from 'zod'

const schema = z.object({
  email: z.string({ invalid_type_error: 'Invalid Email' }),
})

export async function createUser(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  return { message: 'Success' }
}
```

```tsx
'use client'
import { useActionState } from 'react'
import { createUser } from '@/app/actions'

const initialState = { message: '' }

export function Signup() {
  const [state, formAction, isPending] = useActionState(createUser, initialState)

  return (
    <form action={formAction}>
      <label htmlFor="email">Email</label>
      <input type="text" id="email" name="email" required />
      <p aria-live="polite">{state?.message}</p>
      <button disabled={isPending}>Sign up</button>
    </form>
  )
}
```

**`useActionState` vs `useFormState` の違い:**

| | `useFormState`（v14） | `useActionState`（v15） |
|--|----------------------|------------------------|
| インポート元 | `react-dom` | `react` |
| 戻り値 | `[state, formAction]` | `[state, formAction, isPending]` |
| pending 状態 | 別途 `useFormStatus` が必要 | 3番目の戻り値で取得可能 |

### Optimistic Updates（useOptimistic）

```tsx
'use client'
import { useOptimistic } from 'react'
import { send } from './actions'

export function Thread({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: string) => [...state, { message: newMessage }]
  )

  return (
    <div>
      {optimisticMessages.map((m, k) => <div key={k}>{m.message}</div>)}
      <form action={async (formData) => {
        const message = formData.get('message')
        addOptimisticMessage(message)
        await send(message)
      }}>
        <input type="text" name="message" />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

---

## フォーム以外からの呼び出し

### イベントハンドラ

```tsx
'use client'
import { incrementLike } from './actions'
import { useState } from 'react'

export default function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes)

  return (
    <button onClick={async () => {
      const updatedLikes = await incrementLike()
      setLikes(updatedLikes)
    }}>
      Like ({likes})
    </button>
  )
}
```

---

## データ再検証

```ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createPost() {
  // ...
  revalidatePath('/posts')
}
```

::: danger 破壊的変更
Server Action からのリダイレクト時に、再検証が正しく適用されるようになった（v14ではタイミングの問題があった）。
:::

## Cookies 操作

::: danger 破壊的変更
`cookies()` が非同期に変更。`await` が必要。
:::

```ts
'use server'
import { cookies } from 'next/headers'

export async function exampleAction() {
  const cookieStore = await cookies()        // v15: await が必要
  const value = cookieStore.get('name')?.value
  cookieStore.set('name', 'Delba')
  cookieStore.delete('name')
}
```

---

## セキュリティ

### 認証・認可

```ts
'use server'
import { auth } from './lib'

export function addItem() {
  const { user } = auth()
  if (!user) {
    throw new Error('You must be signed in to perform this action')
  }
  // ...
}
```

### クロージャと暗号化

- Next.js が閉じ込められた変数を**自動暗号化**
- ビルドごとに新しい秘密鍵が生成

### CSRF 対策

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    },
  },
}
```
