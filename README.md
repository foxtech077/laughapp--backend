# Laugh App Backend

Production-ready NestJS backend for the Laugh App MVP.

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: Header-based request identity (`x-user-id`, `x-user-type`)
- **API Docs**: Swagger

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run prisma:seed
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and app settings.

### Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Once running, visit: http://localhost:3000/docs

Swagger is disabled automatically when `NODE_ENV=production`.

## Seed Accounts (after seeding)

- **Admin**: admin@laughapp.com / admin123
- **Creator**: creator@laughapp.com / creator123
- **Fan**: fan@laughapp.com / fan123

## Project Structure

```
src/
├── modules/
│   ├── users/           # User management
│   ├── videos/          # Video content
│   ├── tips/             # Tipping system
│   ├── follows/          # Follow relationships
│   ├── daily-feeds/       # Daily feed generation
│   ├── leaderboard-entries/ # Hourly leaderboard
│   ├── notifications/     # In-app notifications
│   ├── coin-transactions/ # Coin ledger
│   ├── coin-packages/     # Purchasable coin bundles
│   ├── purchases/         # Purchase records
│   ├── creator-profiles/  # Creator-specific data
│   ├── attributions/      # Signup attribution tracking
│   ├── video-publish-quota/ # Posting limits
│   ├── admin-audit-log/   # Admin action logs
│   ├── rate-limits/       # Rate limiting
│   └── sessions/          # User sessions
├── common/
│   ├── database/         # Prisma service
│   ├── filters/           # Exception filters
│   ├── interceptors/      # Response transformers
│   ├── guards/            # Auth guards
│   └── decorators/        # Custom decorators
└── app.module.ts
```

## License

MIT

## Technical Notes

- `tsconfig.json` currently keeps `strict` mode disabled for MVP velocity.
- TODO: enable strict typing and fix resulting type errors in a dedicated hardening pass.
