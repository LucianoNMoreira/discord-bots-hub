# 🐳 Guia Docker - Discord Bots Management

Este guia explica como executar o projeto usando Docker e Docker Compose.

## 📋 Pré-requisitos

- Docker (v20.10 ou superior)
- Docker Compose (v2.0 ou superior)

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.docker .env
```

Edite o arquivo `.env` e configure as variáveis:

```env
NODE_ENV=production
PORT=3000
AUTH_USERNAME=admin
AUTH_PASSWORD=sua-senha-segura-aqui
AUTH_SECRET=sua-chave-secreta-de-32-caracteres-aqui
```

> ⚠️ **Importante**: Altere `AUTH_PASSWORD` e `AUTH_SECRET` para valores seguros!

### 2. Executar em Produção

```bash
# Build e iniciar o container
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar o container
docker-compose down
```

A aplicação estará disponível em: `http://localhost:3000`

### 3. Executar em Desenvolvimento

Para desenvolvimento com hot reload:

```bash
# Build e iniciar em modo desenvolvimento
docker-compose -f docker-compose.dev.yml up

# Ou em background
docker-compose -f docker-compose.dev.yml up -d

# Parar
docker-compose -f docker-compose.dev.yml down
```

## 🏗️ Arquitetura Docker

### Arquivos Docker

- **`Dockerfile`**: Build otimizado para produção (multi-stage)
- **`Dockerfile.dev`**: Build para desenvolvimento com hot reload
- **`docker-compose.yml`**: Orquestração para produção
- **`docker-compose.dev.yml`**: Orquestração para desenvolvimento
- **`.dockerignore`**: Arquivos excluídos do build

### Multi-Stage Build

O Dockerfile de produção usa 3 stages:

1. **deps**: Instala dependências
2. **builder**: Build da aplicação Next.js
3. **runner**: Imagem final otimizada e mínima

### Volumes Persistentes

Os seguintes diretórios são montados como volumes para persistir dados:

- `./data`: Dados dos bots e logs de mensagens
- `./public/uploads`: Avatares e uploads

## 🔧 Comandos Úteis

### Build Manual

```bash
# Build da imagem
docker build -t discord-bots-hub .

# Build para desenvolvimento
docker build -f Dockerfile.dev -t discord-bots-hub:dev .
```

### Executar Container Manualmente

```bash
# Produção
docker run -d \
  --name discord-bots-hub \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -e AUTH_USERNAME=admin \
  -e AUTH_PASSWORD=sua-senha \
  -e AUTH_SECRET=sua-chave-secreta-32-chars \
  discord-bots-hub

# Desenvolvimento
docker run -d \
  --name discord-bots-hub-dev \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  -v $(pwd)/data:/app/data \
  discord-bots-hub:dev
```

### Gerenciamento

```bash
# Ver logs
docker logs discord-bots-hub
docker logs -f discord-bots-hub  # seguir logs

# Acessar shell do container
docker exec -it discord-bots-hub sh

# Reiniciar container
docker restart discord-bots-hub

# Parar e remover
docker stop discord-bots-hub
docker rm discord-bots-hub

# Remover imagem
docker rmi discord-bots-hub
```

### Docker Compose

```bash
# Subir serviços
docker-compose up -d

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Rebuild e reiniciar
docker-compose up -d --build

# Limpar tudo (containers, volumes, networks)
docker-compose down -v
```

## 📊 Health Check

O container inclui um health check que verifica se a aplicação está respondendo:

```bash
# Verificar saúde do container
docker inspect --format='{{.State.Health.Status}}' discord-bots-hub
```

Status possíveis:
- `healthy`: Aplicação funcionando
- `unhealthy`: Aplicação com problemas
- `starting`: Iniciando

## 🔒 Segurança

### Boas Práticas Implementadas

1. ✅ Container roda com usuário não-root (`nextjs:nodejs`)
2. ✅ Imagem Alpine Linux (menor superfície de ataque)
3. ✅ Multi-stage build (imagem final mínima)
4. ✅ Variáveis sensíveis via `.env` (não commitadas)
5. ✅ `.dockerignore` para excluir arquivos desnecessários

### Recomendações

- Use senhas fortes para `AUTH_PASSWORD`
- Gere uma chave aleatória de 32 caracteres para `AUTH_SECRET`
- Não commite o arquivo `.env` no Git
- Use secrets em produção (Docker Swarm ou Kubernetes)

## 🌐 Deploy em Produção

### Usando Docker Compose

```bash
# Em um servidor com Docker instalado
git clone <seu-repositorio>
cd discord-bots-management
cp .env.docker .env
# Edite o .env com valores de produção
docker-compose up -d
```

### Usando Docker Swarm

```bash
docker stack deploy -c docker-compose.yml discord-bots
```

### Reverse Proxy (Nginx)

Exemplo de configuração Nginx:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker-compose logs

# Verificar se a porta está em uso
lsof -i :3000
```

### Erro de permissões / Falha no upload de avatar

**Problema**: Erro ao fazer upload de avatar ou criar arquivos.

**Solução**:
```bash
# Ajustar permissões dos volumes
chmod -R 777 public/uploads
chmod -R 755 data

# Reiniciar o container
docker-compose restart
```

**Ou use o script de setup**:
```bash
./docker-setup.sh
```

### Bots aparecem como "Unauthorized" ou erro de descriptografia

**Problema**: `Error: Unsupported state or unable to authenticate data`

**Causa**: Os tokens dos bots foram criptografados com uma chave diferente da configurada no `.env`.

**Soluções**:

1. **Usar a mesma chave de criptografia**:
   - Se você tinha um `.env` anterior, use a mesma `AUTH_SECRET`
   - Copie a chave antiga para o novo `.env`

2. **Re-adicionar os bots**:
   - Delete os bots existentes na interface
   - Adicione-os novamente com a nova chave
   - Os tokens serão re-criptografados com a chave nova

3. **Limpar dados e começar do zero**:
   ```bash
   # Parar containers
   docker-compose down
   
   # Backup (opcional)
   cp data/bots.json data/bots.json.backup
   
   # Limpar dados
   echo "[]" > data/bots.json
   
   # Reiniciar
   docker-compose up -d
   ```

### Build muito lento

```bash
# Limpar cache do Docker
docker builder prune

# Build sem cache
docker-compose build --no-cache
```

### Não consegue conectar aos bots

Certifique-se de que:
1. As variáveis de ambiente estão corretas
2. Os volumes estão montados corretamente
3. A aplicação tem acesso à rede
4. Os tokens do Discord são válidos

### Erro "Internal Server Error"

**Problema**: Erro 500 ao acessar a aplicação.

**Solução**:
```bash
# Verificar logs detalhados
docker-compose logs -f

# Verificar se as variáveis de ambiente estão configuradas
docker exec discord-bots-hub env | grep AUTH

# Se não estiverem, parar e reconfigurar
docker-compose down
# Edite o .env com valores corretos
docker-compose up -d
```

## 📚 Recursos Adicionais

- [Documentação Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

## 🤝 Contribuindo

Se encontrar problemas com a configuração Docker, por favor abra uma issue!

