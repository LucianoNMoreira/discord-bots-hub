#!/bin/sh
set -e

# Adjust permissions of directories mounted as volumes
# This is necessary because mounted volumes inherit permissions from the host
if [ -d /app/data ]; then
    chown -R nextjs:nodejs /app/data 2>/dev/null || true
    chmod -R 755 /app/data 2>/dev/null || true
fi

if [ -d /app/public/uploads ]; then
    chown -R nextjs:nodejs /app/public/uploads 2>/dev/null || true
    chmod -R 755 /app/public/uploads 2>/dev/null || true
fi

# Switch to non-root user and execute the command
exec su-exec nextjs "$@"

