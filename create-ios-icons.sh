#!/bin/bash
echo "Ì≥± Criando √≠cones iOS em m√∫ltiplos tamanhos..."

# Tamanhos necess√°rios para iOS
sizes="57 60 72 76 114 120 144 152 180"

# Verifica se imagem original existe
if [ ! -f "apple-touch-icon.png" ]; then
  echo "‚ùå apple-touch-icon.png n√£o encontrado!"
  exit 1
fi

# Se tem imagem magick, use
if command -v magick &> /dev/null; then
  for size in $sizes; do
    magick apple-touch-icon.png -resize ${size}x${size} apple-touch-icon-${size}x${size}.png
    echo "‚úÖ apple-touch-icon-${size}x${size}.png"
  done
else
  # Fallback: copia o mesmo arquivo com nomes diferentes
  for size in $sizes; do
    cp apple-touch-icon.png apple-touch-icon-${size}x${size}.png
    echo "Ì≥Ñ apple-touch-icon-${size}x${size}.png (c√≥pia)"
  done
  echo "‚ö†Ô∏è  Instale ImageMagick para redimensionar corretamente:"
  echo "    Windows: https://imagemagick.org/script/download.php#windows"
  echo "    Mac: brew install imagemagick"
  echo "    Linux: sudo apt-get install imagemagick"
fi

echo "Ìæâ √çcones iOS criados!"
