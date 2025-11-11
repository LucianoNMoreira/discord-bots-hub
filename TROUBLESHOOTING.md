# 🔧 Troubleshooting - Discord Bots Management

## Problemas Comuns e Soluções Rápidas

### 🔒 Erro "Unauthorized" ao fazer upload ou outras ações

**Sintomas:**
- Erro 401 Unauthorized ao fazer upload de avatar
- Erro 401 em requisições após mudanças no `.env`
- Sessão aparentemente válida mas ações falham

**Causa:**
O `AUTH_SECRET` foi alterado, invalidando todas as sessões existentes.

**Solução:**
1. **Limpe o cache do navegador** ou **abra uma aba anônima**
2. Faça **logout** (se possível)
3. Faça **login novamente**

```bash
# Ou reinicie o container e faça login novamente
docker-compose restart
```

---

### 🤖 Bots aparecem como "Unauthorized" / Erro de descriptografia

**Sintomas:**
- Bots mostram status "Unauthorized"
- Logs mostram: `Error: Unsupported state or unable to authenticate data`
- Bots não inicializam

**Causa:**
Os tokens dos bots foram criptografados com um `AUTH_SECRET` diferente do atual.

**Soluções:**

**Opção 1: Usar a chave antiga**
```bash
# Edite o .env e coloque a chave original
AUTH_SECRET=chave-original-que-foi-usada
docker-compose restart
```

**Opção 2: Re-adicionar os bots**
1. Acesse a interface: http://localhost:3000
2. Delete os bots existentes
3. Adicione novamente com os tokens do Discord
4. Os tokens serão re-criptografados com a nova chave

**Opção 3: Limpar dados e começar do zero**
```bash
docker-compose down
# Backup (opcional)
cp data/bots.json data/bots.json.backup
# Limpar
echo "[]" > data/bots.json
docker-compose up -d
```

---

### 📤 Erro ao fazer upload de avatar

**Sintomas:**
- Erro ao tentar fazer upload de imagem
- "Failed to upload avatar"

**Causa:**
Problemas de permissão no diretório de uploads.

**Solução:**
```bash
# Ajustar permissões
chmod -R 777 public/uploads

# Reiniciar container
docker-compose restart
```

---

### 🔴 Container não inicia / Internal Server Error

**Sintomas:**
- Container para logo após iniciar
- Erro 500 ao acessar a aplicação
- Logs mostram erros de variáveis de ambiente

**Solução:**
```bash
# 1. Verificar variáveis de ambiente
docker exec discord-bots-hub env | grep AUTH

# 2. Se não estiverem configuradas, edite o .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
AUTH_USERNAME=admin
AUTH_PASSWORD=sua-senha-aqui
AUTH_SECRET=sua-chave-de-32-caracteres-aqui
EOF

# 3. Reiniciar
docker-compose down
docker-compose up -d
```

---

### 🔄 Erros após atualizar código/Docker

**Sintomas:**
- Aplicação com comportamento estranho após pull/update
- Erros que não existiam antes

**Solução:**
```bash
# Rebuild completo sem cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

### 📝 JSON inválido / Erro ao ler bots

**Sintomas:**
- `SyntaxError: Unexpected end of JSON input`
- Aplicação não carrega lista de bots

**Solução:**
```bash
# Verificar se o JSON está válido
cat data/bots.json

# Se estiver corrompido, restaurar
echo "[]" > data/bots.json
docker-compose restart
```

---

### 🌐 Não consegue acessar http://localhost:3000

**Sintomas:**
- Conexão recusada
- Timeout

**Soluções:**
```bash
# 1. Verificar se o container está rodando
docker-compose ps

# 2. Verificar se a porta está ocupada
lsof -i :3000

# 3. Verificar logs
docker-compose logs -f

# 4. Se necessário, usar outra porta
PORT=3001 docker-compose up -d
# Acesse: http://localhost:3001
```

---

### 🧹 Limpar tudo e começar do zero

**Quando usar:**
- Problemas persistentes após várias tentativas
- Quer garantir um estado limpo

**Comandos:**
```bash
# Parar e remover tudo
docker-compose down -v

# Limpar imagens antigas
docker image prune -a

# Limpar dados (CUIDADO: perde todos os bots)
echo "[]" > data/bots.json
rm -rf public/uploads/*
touch public/uploads/.gitkeep

# Recriar .env
./docker-setup.sh

# Rebuild e iniciar
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔍 Verificação Rápida

Execute este checklist quando tiver problemas:

```bash
# 1. Container está rodando?
docker-compose ps

# 2. Logs mostram erros?
docker-compose logs --tail=50

# 3. Variáveis de ambiente estão configuradas?
docker exec discord-bots-hub env | grep AUTH

# 4. Permissões do diretório de uploads?
ls -la public/uploads/

# 5. JSON dos bots está válido?
cat data/bots.json | jq .
```

---

## 📞 Ainda com problemas?

1. Verifique os logs detalhados: `docker-compose logs -f`
2. Consulte a documentação completa: [DOCKER.md](DOCKER.md)
3. Abra uma issue no repositório com os logs

---

## 💡 Dicas de Prevenção

✅ **Faça backup** do `.env` e `data/bots.json` antes de mudanças  
✅ **Use a mesma** `AUTH_SECRET` sempre que possível  
✅ **Faça logout/login** após mudar variáveis de ambiente  
✅ **Monitore os logs** regularmente: `docker-compose logs -f`  
✅ **Verifique permissões** após montar volumes

