This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SEO studio

`/studio` is where the admin and the SEO specialist edit the website: text, Google titles and descriptions, share images,
alt text, business details and blog posts. **Save** keeps a change as a draft, shown in the preview beside the form; **Confirm & Publish** puts it on the website.

### Set up

1. Copy `.env.example` to `.env` and fill it in.
2. `npm run db:up` starts MySQL in Docker (port 3307).
3. `npm run db:deploy` creates the tables.
4. `npm run dev`. The first start creates the two accounts from `SEED_*` in `.env`, if there are no users yet.

Everything in Docker: `docker compose --profile app up -d --build` (http://localhost:3020). Behind https keep
`COOKIE_SECURE=true`; the reverse proxy must set `X-Forwarded-For` and pass the `Host` header on. With
more than one proxy in front (Cloudflare and nginx, say), set `PROXY_HOPS` to their number. The app is only reachable on
127.0.0.1; set `WEB_BIND=0.0.0.0` if the proxy runs on another machine.

### How it is put together

| Part | Where |
| --- | --- |
| What can be edited (forms **and** validation come from it) | `src/lib/studio/fields.ts` |
| Starting text, shown until something is published | `src/lib/content.ts`, `src/lib/studio/defaults.ts` |
| Tables | `prisma/schema.prisma` |
| JWT check before every studio request (middleware, called proxy in Next.js 16) | `src/proxy.ts` |
| Sessions: signed JWT with the session id in an HttpOnly cookie, the session in the database | `src/lib/server/session.ts` |
| Server-side validation (zod) | `src/lib/server/validate.ts` |
| Uploads (multer, then re-encoded with sharp) into `UPLOAD_DIR` | `src/lib/server/upload.ts` |
| Page editor and preview | `src/components/studio/PageEditor.tsx`, `Preview.tsx` |
| Draft preview: Next.js draft mode, and only for a signed-in user | `src/lib/server/site.ts` (`previewing`) |
| On-demand ISR: pages and their data stay cached until something is published (`refreshSite`) or saved (`refreshStudio`) | `src/lib/server/site.ts`, `refresh.ts`, `studio.ts` |
| API | `src/app/api/studio` |
| Log (pino, JSON lines on stdout) | `src/lib/server/log.ts` |

Nothing is fetched on a timer, so a change made directly in the database is not seen until the next save or publish, or a
restart of the server (it refreshes its pages once when it starts).

A session ends after 12 hours, or after 2 hours without a request. After ten wrong passwords for one
email from one address, that address has to wait 15 minutes.
