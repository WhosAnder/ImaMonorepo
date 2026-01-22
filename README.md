# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `web`: Next.js frontend application
- `api`: Hono REST API backend service
- `auth`: Hono authentication service
- `@repo/ui`: Shared React component library
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## Environment Variables

This monorepo uses environment variables for configuration across all services. Each service has its own `.env.example` file that documents all available environment variables.

### Quick Start

1. **Copy the example files** for each service you want to run:

```bash
# Web app (Next.js frontend)
cp apps/web/.env.example apps/web/.env

# API service (backend)
cp apps/api/.env.example apps/api/.env

# Auth service
cp apps/auth/.env.example apps/auth/.env
```

2. **Update the values** in each `.env` file according to your environment (local development, staging, production)

3. **Start the services** using turbo:

```bash
turbo dev
```

### Service Environment Variables Overview

#### **apps/web** (Next.js Frontend)

| Variable                        | Required | Default                 | Description                |
| ------------------------------- | -------- | ----------------------- | -------------------------- |
| `NEXT_PUBLIC_AUTH_URL`          | Optional | `http://localhost:5001` | Authentication service URL |
| `NEXT_PUBLIC_API_URL`           | Optional | `http://localhost:4000` | Main API service URL       |
| `NEXT_PUBLIC_S3_PRESIGNER_BASE` | Optional | Same as API_URL         | S3 presigned URL base      |

#### **apps/api** (Hono Backend)

| Variable                                           | Required            | Default                           | Description                 |
| -------------------------------------------------- | ------------------- | --------------------------------- | --------------------------- |
| `NODE_ENV`                                         | Optional            | `development`                     | Environment mode            |
| `PORT`                                             | Optional            | `4000`                            | Server port                 |
| `MONGODB_URL`                                      | Optional            | `mongodb://localhost:27017`       | MongoDB connection string   |
| `MONGODB_DB_NAME`                                  | Optional            | `ima`                             | MongoDB database name       |
| `AUTH_SERVICE_URL`                                 | Optional            | `http://localhost:5001`           | Auth service URL            |
| `DEDUPLICATION_ENABLED`                            | Optional            | `true`                            | Enable duplicate prevention |
| `DEDUPLICATION_TTL_HOURS`                          | Optional            | `24`                              | Deduplication cache TTL     |
| `AWS_REGION` / `S3_REGION`                         | Optional            | `auto`                            | S3 region                   |
| `AWS_ACCESS_KEY_ID` / `S3_ACCESS_KEY_ID`           | **Required for S3** | -                                 | S3 access key               |
| `AWS_SECRET_ACCESS_KEY` / `S3_SECRET_ACCESS_KEY`   | **Required for S3** | -                                 | S3 secret key               |
| `S3_BUCKET`                                        | **Required for S3** | -                                 | Evidences bucket name       |
| `AWS_S3_ENDPOINT` / `S3_ENDPOINT` / `AWS_ENDPOINT` | **Required for S3** | -                                 | S3 endpoint URL             |
| `EVIDENCES_MAX_SIZE_MB` / `FILES_MAX_SIZE_MB`      | Optional            | `20`                              | Max file size (MB)          |
| `EVIDENCES_ALLOWED_MIME` / `FILES_ALLOWED_MIME`    | Optional            | `image/png,image/jpeg,image/webp` | Allowed file types          |
| `S3_SIGNATURES_BUCKET`                             | Optional            | -                                 | Separate signatures bucket  |
| `S3_SIGNATURES_ACCESS_KEY_ID`                      | Optional            | Inherits from main                | Signatures access key       |
| `S3_SIGNATURES_SECRET_ACCESS_KEY`                  | Optional            | Inherits from main                | Signatures secret key       |
| `S3_SIGNATURES_ENDPOINT`                           | Optional            | Inherits from main                | Signatures endpoint         |
| `S3_SIGNATURES_REGION`                             | Optional            | Inherits from main                | Signatures region           |
| `BASE_URL`                                         | Optional            | `http://localhost:3000`           | Local file serving URL      |

#### **apps/auth** (Authentication Service)

| Variable          | Required     | Default                 | Description                  |
| ----------------- | ------------ | ----------------------- | ---------------------------- |
| `DATABASE_URL`    | **REQUIRED** | -                       | PostgreSQL connection string |
| `PORT`            | Optional     | `5001`                  | Server port                  |
| `BETTER_AUTH_URL` | Optional     | `http://localhost:5001` | Auth base URL                |
| `ADMIN_EMAIL`     | Script only  | `admin@ima.com`         | Admin creation script        |
| `ADMIN_PASSWORD`  | Script only  | `adminUser123`          | Admin creation script        |
| `ADMIN_NAME`      | Script only  | `Admin User`            | Admin creation script        |
| `ADMIN_ROLE`      | Script only  | `admin`                 | Admin creation script        |

### Service Dependencies

```
┌─────────────┐
│   web       │
│  (Next.js)  │
└─────┬───────┘
      │
      ├──────────────────┐
      │                  │
      ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   auth      │    │     api     │
│  (Hono)     │◄───│   (Hono)    │
└─────┬───────┘    └─────┬───────┘
      │                  │
      ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │  MongoDB    │
│             │    │   + S3      │
└─────────────┘    └─────────────┘
```

- **web** depends on both **auth** and **api** services
- **api** depends on **auth** for admin authentication
- **auth** requires PostgreSQL
- **api** requires MongoDB and optionally S3 for file storage

### Environment-Specific Configuration

#### Local Development

For local development, the default values in `.env.example` files are configured to work with services running on localhost:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Auth: `http://localhost:5001`

#### Production

For production deployment, ensure you:

1. Set `NODE_ENV=production` in the API service
2. Use secure, production database connection strings
3. Configure proper S3 credentials and endpoints
4. Update all service URLs to use production domains
5. Enable HTTPS for all public endpoints

### Security Notes

- **Never commit `.env` files** - they are git-ignored by default
- Store production secrets in your deployment platform's environment variable management
- Rotate credentials regularly, especially S3 keys
- The `DATABASE_URL` for auth service is **required** and contains sensitive credentials
- Use strong passwords and secure connection strings for production databases

### Troubleshooting

**Services can't connect to each other:**

- Verify all service URLs are correct in environment variables
- Check that dependent services are running
- Ensure ports are not blocked by firewalls

**S3 uploads failing:**

- Verify all S3 credentials are set correctly
- Check that the bucket exists and is accessible
- Ensure the S3 endpoint URL is correct

**Authentication errors:**

- Verify `DATABASE_URL` is set in the auth service
- Check that `AUTH_SERVICE_URL` points to the correct auth service location
- Ensure the auth service is running and accessible

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
