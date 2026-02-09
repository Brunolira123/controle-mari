#!/bin/bash
# deploy-ios-fix.sh

echo "🔄 CORRIGINDO PWA PARA iOS..."

# 1. Limpe tudo
rm -rf dist
rm -rf node_modules/.vite
rm -rf node_modules/.cache

# 2. Build
npm run build:gh

# 3. Verifique os caminhos no manifest
echo "🔍 Verificando manifest..."
cat dist/manifest.webmanifest | grep -E "(scope|start_url|src)"

# 4. Adicione .nojekyll
echo "" > dist/.nojekyll

# 5. Adicione meta tags para iOS no index.html
sed -i 's|<title>|<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<meta name="apple-mobile-web-app-title" content="App Mari">\n<title>|' dist/index.html

# 6. Deploy
npx gh-pages -d dist --branch gh-pages --dotfiles --no-history --message "FIX: iOS PWA $(date +'%Y-%m-%d %H:%M:%S')"

echo "✅ DEPLOY COM CORREÇÕES iOS ENVIADO!"
echo ""
echo "📱 NO IPHONE, SIGA ESTES PASSOS:"
echo "1. REMOVA o app antigo da tela inicial"
echo "2. Vá em Ajustes > Safari > Limpar Histórico e Dados"
echo "3. Vá em Ajustes > Safari > Avançado > Dados de Website"
echo "   - Remova TUDO de github.io"
echo "4. Reinicie o iPhone (opcional mas recomendado)"
echo "5. Abra Safari e acesse:"
echo "   https://brunolira123.github.io/controle-mari/?v=$(date +%s)"
echo "6. Aguarde 10 segundos após carregar"
echo "7. Toque em Compartilhar > Adicionar à Tela de Início"
echo ""
echo "⏰ Aguarde 2 minutos para o GitHub Pages atualizar"