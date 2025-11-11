# 🔧 Troubleshooting - Discord Bots Management

## Common Issues and Quick Solutions

### 🔒 "Unauthorized" error when uploading or performing other actions

**Symptoms:**
- 401 Unauthorized error when uploading avatar
- 401 error on requests after changes to `.env`
- Session appears valid but actions fail

**Cause:**
The `AUTH_SECRET` was changed, invalidating all existing sessions.

**Solution:**
1. **Clear browser cache** or **open an incognito tab**
2. **Logout** (if possible)
3. **Login again**

```bash
# Or restart the container and login again
docker-compose restart
```

---

### 🤖 Bots appear as "Unauthorized" / Decryption error

**Symptoms:**
- Bots show "Unauthorized" status
- Logs show: `Error: Unsupported state or unable to authenticate data`
- Bots don't initialize

**Cause:**
Bot tokens were encrypted with a different `AUTH_SECRET` than the current one.

**Solutions:**

**Option 1: Use the old key**
```bash
# Edit .env and set the original key
AUTH_SECRET=original-key-that-was-used
docker-compose restart
```

**Option 2: Re-add the bots**
1. Access the interface: http://localhost:3000
2. Delete existing bots
3. Add them again with Discord tokens
4. Tokens will be re-encrypted with the new key

**Option 3: Clear data and start from scratch**
```bash
docker-compose down
# Backup (optional)
cp data/bots.json data/bots.json.backup
# Clear
echo "[]" > data/bots.json
docker-compose up -d
```

---

### 📤 Error uploading avatar

**Symptoms:**
- Error when trying to upload image
- "Failed to upload avatar"

**Cause:**
Permission issues in the uploads directory.

**Solution:**
```bash
# Adjust permissions
chmod -R 777 public/uploads

# Restart container
docker-compose restart
```

---

### 🔴 Container won't start / Internal Server Error

**Symptoms:**
- Container stops shortly after starting
- Error 500 when accessing the application
- Logs show environment variable errors

**Solution:**
```bash
# 1. Check environment variables
docker exec discord-bots-hub env | grep AUTH

# 2. If not configured, edit .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
AUTH_USERNAME=admin
AUTH_PASSWORD=your-password-here
AUTH_SECRET=your-32-character-key-here
EOF

# 3. Restart
docker-compose down
docker-compose up -d
```

---

### 🔄 Errors after updating code/Docker

**Symptoms:**
- Application with strange behavior after pull/update
- Errors that didn't exist before

**Solution:**
```bash
# Complete rebuild without cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

### 📝 Invalid JSON / Error reading bots

**Symptoms:**
- `SyntaxError: Unexpected end of JSON input`
- Application doesn't load bot list

**Solution:**
```bash
# Check if JSON is valid
cat data/bots.json

# If corrupted, restore
echo "[]" > data/bots.json
docker-compose restart
```

---

### 🌐 Cannot access http://localhost:3000

**Symptoms:**
- Connection refused
- Timeout

**Solutions:**
```bash
# 1. Check if container is running
docker-compose ps

# 2. Check if port is in use
lsof -i :3000

# 3. Check logs
docker-compose logs -f

# 4. If needed, use another port
PORT=3001 docker-compose up -d
# Access: http://localhost:3001
```

---

### 🧹 Clean everything and start from scratch

**When to use:**
- Persistent issues after several attempts
- Want to ensure a clean state

**Commands:**
```bash
# Stop and remove everything
docker-compose down -v

# Clean old images
docker image prune -a

# Clear data (WARNING: loses all bots)
echo "[]" > data/bots.json
rm -rf public/uploads/*
touch public/uploads/.gitkeep

# Recreate .env
./docker-setup.sh

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔍 Quick Verification

Run this checklist when you have issues:

```bash
# 1. Is container running?
docker-compose ps

# 2. Do logs show errors?
docker-compose logs --tail=50

# 3. Are environment variables configured?
docker exec discord-bots-hub env | grep AUTH

# 4. Uploads directory permissions?
ls -la public/uploads/

# 5. Is bots JSON valid?
cat data/bots.json | jq .
```

---

## 📞 Still having issues?

1. Check detailed logs: `docker-compose logs -f`
2. Consult full documentation: [DOCKER.md](DOCKER.md)
3. Open an issue in the repository with the logs

---

## 💡 Prevention Tips

✅ **Backup** `.env` and `data/bots.json` before changes  
✅ **Use the same** `AUTH_SECRET` whenever possible  
✅ **Logout/login** after changing environment variables  
✅ **Monitor logs** regularly: `docker-compose logs -f`  
✅ **Check permissions** after mounting volumes
