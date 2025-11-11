#!/bin/bash

echo "🔍 Monitoring Discord Bots Hub logs..."
echo "📝 Try uploading an avatar now and observe the logs below:"
echo ""
echo "-----------------------------------------------------------"
echo ""

cd "$(dirname "$0")"
docker-compose logs -f --tail=20
