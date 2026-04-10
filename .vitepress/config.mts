import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Next.js Docs',
  description: 'Next.js App Router ドキュメント（日本語）',
  lang: 'ja-JP',

  themeConfig: {
    nav: [
      { text: 'Next.js 14', link: '/next14/01-routing' },
      { text: 'Next.js 15', link: '/next15/00-overview' },
    ],

    sidebar: {
      '/next14/': [
        {
          text: 'Next.js 14 App Router',
          items: [
            { text: 'ルーティング', link: '/next14/01-routing' },
            { text: 'レンダリング', link: '/next14/02-rendering' },
            { text: 'データフェッチング', link: '/next14/03-data-fetching' },
            { text: 'Server Actions', link: '/next14/04-server-actions' },
            { text: 'キャッシング', link: '/next14/05-caching' },
            { text: 'Route Handlers', link: '/next14/06-route-handlers' },
            { text: 'Middleware', link: '/next14/07-middleware' },
            { text: 'エラーハンドリング', link: '/next14/08-error-handling' },
            { text: 'Loading & Streaming', link: '/next14/09-loading-streaming' },
          ],
        },
      ],
      '/next15/': [
        {
          text: 'Next.js 15 App Router',
          items: [
            { text: '変更概要', link: '/next15/00-overview' },
            { text: 'ルーティング', link: '/next15/01-routing' },
            { text: 'レンダリング', link: '/next15/02-rendering' },
            { text: 'データフェッチング', link: '/next15/03-data-fetching' },
            { text: 'Server Actions', link: '/next15/04-server-actions' },
            { text: 'キャッシング', link: '/next15/05-caching' },
            { text: 'Route Handlers', link: '/next15/06-route-handlers' },
            { text: 'Middleware', link: '/next15/07-middleware' },
            { text: 'エラーハンドリング', link: '/next15/08-error-handling' },
            { text: 'Loading & Streaming', link: '/next15/09-loading-streaming' },
            { text: '新機能・新API', link: '/next15/10-new-apis' },
          ],
        },
      ],
    },

    outline: {
      level: [2, 3],
      label: '目次',
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://nextjs.org/docs' },
    ],
  },
})
