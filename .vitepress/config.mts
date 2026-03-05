import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Next.js Docs',
  description: 'Next.js App Router ドキュメント（日本語）',
  lang: 'ja-JP',

  themeConfig: {
    nav: [
      { text: 'Next.js 14', link: '/next14/01-routing' },
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
