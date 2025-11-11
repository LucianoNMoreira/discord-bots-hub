## Discord Bots Hub

Management console built with Next.js and TypeScript to orchestrate Discord bots and forward their interactions to automation workflows such as n8n.

### Features

- Authenticated access using credentials stored in environment variables.
- Bot registry storing name, avatar, description, interaction origin and relay webhook URL.
- Encrypted at rest storage (AES-256-GCM) for Discord tokens.
- Relay endpoint (`/api/relay/{botId}`) that forwards any inbound payload to the target webhook with context headers.
- Multilingual interface (English, Español, Português-BR) with runtime language switcher.

### Getting started

1. Configure the environment variables in `.env.local`:

   ```
   AUTH_USERNAME=admin
   AUTH_PASSWORD=change-me
   AUTH_SECRET=replace-with-32-characters-secret
   APP_BASE_URL=http://localhost:3000
   ```

   | Variable | Description |
   | --- | --- |
   | `AUTH_USERNAME` / `AUTH_PASSWORD` | Credentials required to log in. |
   | `AUTH_SECRET` | Minimum 32 characters secret used to sign sessions and encrypt tokens. |
   | `APP_BASE_URL` | Base URL used to hint users about the relay endpoint. |

2. Install dependencies and run the development server:

   ```
   pnpm install
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) and authenticate with the configured credentials.

### Discord permissions

The application serves as a relay between Discord and your webhook service (e.g., n8n). Configure your Discord bot to send interactions to the relay endpoint. The bot token is stored encrypted and used only for forwarding requests.

### Relay workflow

1. Register a bot providing its webhook URL (e.g. your n8n webhook).
2. Configure Discord to send events to `/api/relay/{botId}`.
3. The application forwards the payload to the webhook and passes helpful headers such as `X-Discord-Bot-Id` and `X-Discord-Guild-Id`.

### Roadmap ideas

- Support editing and deleting bots.
- Implement Discord interaction signature validation.
- Surface request logs for observability.

