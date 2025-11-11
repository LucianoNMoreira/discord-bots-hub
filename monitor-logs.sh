#!/bin/bash

echo "🔍 Monitorando logs do Discord Bots Hub..."
echo "📝 Tente fazer upload do avatar agora e observe os logs abaixo:"
echo ""
echo "-----------------------------------------------------------"
echo ""

cd "$(dirname "$0")"
docker-compose logs -f --tail=20

