#!/bin/bash
# generate-ios-icons.sh - Gera ícones iOS em múltiplos tamanhos

echo "🎨 Criando ícones iOS em múltiplos tamanhos..."

# Diretório de saída
OUTPUT_DIR="public"
mkdir -p "$OUTPUT_DIR"

# Tamanhos necessários para iOS (nome: tamanho)
declare -A icon_sizes=(
  ["57x57"]="57"
  ["60x60"]="60"
  ["72x72"]="72"
  ["76x76"]="76"
  ["114x114"]="114"
  ["120x120"]="120"
  ["144x144"]="144"
  ["152x152"]="152"
  ["180x180"]="180"
)

# Verifica se imagem original existe
SOURCE_IMAGE="apple-touch-icon.png"
if [ ! -f "$SOURCE_IMAGE" ] && [ ! -f "public/$SOURCE_IMAGE" ]; then
  echo "❌ ERRO: $SOURCE_IMAGE não encontrado!"
  echo "Coloque um arquivo apple-touch-icon.png (1024x1024 recomendado) na raiz do projeto"
  exit 1
fi

# Encontra a imagem fonte
if [ -f "$SOURCE_IMAGE" ]; then
  IMG_SOURCE="$SOURCE_IMAGE"
else
  IMG_SOURCE="public/$SOURCE_IMAGE"
fi

echo "📁 Usando imagem fonte: $IMG_SOURCE"

# Verifica se tem ImageMagick instalado - CORREÇÃO AQUI
if command -v magick &> /dev/null; then
  echo "✅ ImageMagick encontrado"
  HAS_MAGICK=true
elif command -v convert &> /dev/null; then  # REMOVI O ; then EXTRA
  echo "✅ ImageMagick (convert) encontrado"
  HAS_MAGICK=true
else
  echo "⚠️  ImageMagick não encontrado. Usando cópias..."
  HAS_MAGICK=false
fi

# Cria os ícones
for name in "${!icon_sizes[@]}"; do
  size="${icon_sizes[$name]}"
  output_file="$OUTPUT_DIR/apple-touch-icon-${name}.png"
  
  if [ "$HAS_MAGICK" = true ]; then
    # Usa ImageMagick para redimensionar
    if command -v magick &> /dev/null; then
      magick "$IMG_SOURCE" -resize "${size}x${size}" -background none -gravity center -extent "${size}x${size}" "$output_file"
    else
      convert "$IMG_SOURCE" -resize "${size}x${size}" -background none -gravity center -extent "${size}x${size}" "$output_file"
    fi
    echo "✅ Criado: apple-touch-icon-${name}.png (${size}x${size})"
  else
    # Fallback: copia e avisa
    cp "$IMG_SOURCE" "$output_file"
    echo "⚠️  Cópia: apple-touch-icon-${name}.png (NÃO redimensionado)"
  fi
done

# Cria também o ícone principal apple-touch-icon.png em public/
cp "$IMG_SOURCE" "$OUTPUT_DIR/apple-touch-icon.png"
echo "✅ Copiado: apple-touch-icon.png para $OUTPUT_DIR/"

# Cria ícone padrão para PWA
if [ "$HAS_MAGICK" = true ]; then
  magick "$IMG_SOURCE" -resize "192x192" "$OUTPUT_DIR/pwa-192x192.png"
  magick "$IMG_SOURCE" -resize "512x512" "$OUTPUT_DIR/pwa-512x512.png"
  echo "✅ Criados ícones PWA: pwa-192x192.png e pwa-512x512.png"
else
  cp "$IMG_SOURCE" "$OUTPUT_DIR/pwa-192x192.png"
  cp "$IMG_SOURCE" "$OUTPUT_DIR/pwa-512x512.png"
  echo "⚠️  Cópias PWA: pwa-*.png (NÃO redimensionados)"
fi

# Cria favicons também
if [ "$HAS_MAGICK" = true ]; then
  magick "$IMG_SOURCE" -resize "32x32" "$OUTPUT_DIR/favicon-32x32.png"
  magick "$IMG_SOURCE" -resize "16x16" "$OUTPUT_DIR/favicon-16x16.png"
  echo "✅ Criados favicons: favicon-16x16.png e favicon-32x32.png"
fi

# Cria um relatório
echo ""
echo "📊 RELATÓRIO DE ÍCONES CRIADOS:"
ls -la "$OUTPUT_DIR"/apple-touch-icon*.png "$OUTPUT_DIR"/pwa*.png 2>/dev/null | awk '{print $9, $5 " bytes"}'

echo ""
echo "✅ Processo concluído!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Adicione os links no index.html:"
echo "   <link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png\">"
echo "   <link rel=\"apple-touch-icon\" sizes=\"57x57\" href=\"/apple-touch-icon-57x57.png\">"
echo "   ... (todos os tamanhos)"
echo ""
echo "2. Faça o deploy:"
echo "   npm run build:gh && npx gh-pages -d dist --branch gh-pages --dotfiles --no-history"