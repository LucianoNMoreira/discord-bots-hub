#!/bin/bash

echo "🐳 Configurando ambiente Docker para Discord Bots Management..."
echo ""

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p data public/uploads

# Ajustar permissões para permitir escrita pelo container
echo "🔐 Ajustando permissões..."
chmod -R 777 public/uploads
chmod -R 755 data

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  Arquivo .env não encontrado!"
    echo ""
    read -p "Deseja criar um arquivo .env com valores padrão? (s/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# Credenciais de autenticação
AUTH_USERNAME=admin
AUTH_PASSWORD=SuaSenhaSegura123!
AUTH_SECRET=sua-chave-muito-segura-de-32-caracteres
EOF
        echo "✅ Arquivo .env criado!"
        echo ""
        echo "⚠️  IMPORTANTE: Edite o arquivo .env e altere as senhas antes de usar em produção!"
    else
        echo ""
        echo "❌ Configure o arquivo .env antes de continuar."
        echo "   Copie o arquivo env.example: cp env.example .env"
        exit 1
    fi
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "🚀 Para iniciar a aplicação:"
echo "   docker-compose up -d"
echo ""
echo "📊 Para ver os logs:"
echo "   docker-compose logs -f"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo ""

