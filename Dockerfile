# Dockerfile multi-stage otimizado para Next.js com pnpm

# ==========================================
# Stage 1: Dependências
# ==========================================
FROM node:20-alpine AS deps

# Instalar dependências necessárias para compilar módulos nativos
# zlib-sync precisa de zlib-dev também
RUN apk add --no-cache python3 make g++ zlib-dev

RUN corepack enable && corepack prepare pnpm@9.12.1 --activate

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:20-alpine AS builder

# Instalar dependências necessárias para compilar módulos nativos
RUN apk add --no-cache python3 make g++ zlib-dev

RUN corepack enable && corepack prepare pnpm@9.12.1 --activate

WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Variáveis de ambiente temporárias para o build
# (valores reais serão injetados no runtime)
ENV AUTH_SECRET=build-time-secret-must-be-32chars-or-more
ENV AUTH_USERNAME=admin
ENV AUTH_PASSWORD=build-time-password

# Build da aplicação Next.js (forçar webpack ao invés de turbopack)
ENV NEXT_PRIVATE_TEST_BUILD_MODE=webpack
RUN pnpm exec next build --webpack

# ==========================================
# Stage 3: Runner (Produção)
# ==========================================
FROM node:20-alpine AS runner

# Instalar bibliotecas runtime necessárias para módulos nativos
RUN apk add --no-cache zlib

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar node_modules completo para garantir que módulos nativos funcionem
# O standalone não copia módulos nativos como zlib-sync corretamente
COPY --from=builder /app/node_modules ./node_modules

# Criar diretórios para dados persistentes
RUN mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app/data /app/public/uploads

# Usar usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Comando para iniciar a aplicação
CMD ["node", "server.js"]

