# Next.js 14 App Router - Server Actions & Mutations

> ソース: https://nextjs.org/docs/14/app/building-your-application/data-fetching/server-actions-and-mutations

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

```tsx
// app/ui/button.tsx
import { create } from '@/app/actions'

export function Button() {
  return <form action={create}>...</form>
}
```

### Props として渡す

```tsx
<ClientComponent updateItem={updateItem} />

// client-component.tsx
'use client'
export default function ClientComponent({ updateItem }) {
  return <form action={updateItem}>{/* ... */}</form>
}
```

## 動作特性

- `<form>` の `action` 属性で呼び出し可能
- Server Components ではプログレッシブエンハンスメント（JS無しでもフォーム送信可能）
- Client Components ではJSロード前のサブミッションをキュー
- `POST` メソッドのみで呼び出される
- 引数と返り値はシリアライズ可能である必要がある
- `<form>` 以外からも呼び出し可能（イベントハンドラ、`useEffect` 等）

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

```ts
// app/actions.ts
'use server'
export async function updateUser(userId: string, formData: FormData) {
  // ...
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

> `useFormStatus` は `<form>` の子として定義する必要がある。

### サーバーサイドバリデーション（useFormState）

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

  // データミューテーション
  return { message: 'Success' }
}
```

```tsx
'use client'
import { useFormState } from 'react-dom'
import { createUser } from '@/app/actions'

const initialState = { message: '' }

export function Signup() {
  const [state, formAction] = useFormState(createUser, initialState)

  return (
    <form action={formAction}>
      <label htmlFor="email">Email</label>
      <input type="text" id="email" name="email" required />
      <p aria-live="polite">{state?.message}</p>
      <button>Sign up</button>
    </form>
  )
}
```

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

### useEffect

```tsx
'use client'
import { incrementViews } from './actions'

export default function ViewCount({ initialViews }: { initialViews: number }) {
  const [views, setViews] = useState(initialViews)

  useEffect(() => {
    const updateViews = async () => {
      const updatedViews = await incrementViews()
      setViews(updatedViews)
    }
    updateViews()
  }, [])

  return <p>Total Views: {views}</p>
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

```ts
'use server'
import { revalidateTag } from 'next/cache'

export async function createPost() {
  // ...
  revalidateTag('posts')
}
```

## リダイレクト

`redirect` は `try/catch` ブロックの**外**で呼ぶ:

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'

export async function createPost(id: string) {
  try {
    // ...
  } catch (error) {
    // ...
  }

  revalidateTag('posts')
  redirect(`/post/${id}`)
}
```

## Cookies 操作

```ts
'use server'
import { cookies } from 'next/headers'

export async function exampleAction() {
  const value = cookies().get('name')?.value  // 取得
  cookies().set('name', 'Delba')              // 設定
  cookies().delete('name')                    // 削除
}
```

---

## セキュリティ

### 認証・認可

Server Actions は公開APIエンドポイントと同様に扱い、ユーザー認可を確認:

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

- Server Action 内でキャプチャされた変数はクライアントに送信され、サーバーに戻される
- Next.js が閉じ込められた変数を**自動暗号化**
- ビルドごとに新しい秘密鍵が生成
- 複数サーバーでの自己ホスティング時: `process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` で暗号化キーを統一

### CSRF 対策

- POST メソッドのみ許可
- Origin ヘッダーと Host ヘッダーを比較
- `serverActions.allowedOrigins` で許可オリジンを設定可能

```js
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    },
  },
}
```
