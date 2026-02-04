// scripts/generate-icons.cjs
const fs = require('fs');
const path = require('path');

// Cores do tema (roxo #8b5cf6)
const THEME_COLOR = '#8b5cf6';

// SVG simples para o favicon
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="${THEME_COLOR}"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">✂️</text>
</svg>`;

// Ícone básico para desenvolvimento
const createBasicIcon = (size, name) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${THEME_COLOR}"/>
  <text x="${size / 2}" y="${size * 0.65}" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle">✂️</text>
</svg>`;
  
  fs.writeFileSync(path.join(__dirname, '../public', name), svg);
  console.log(`✅ Criado: ${name} (${size}x${size})`);
};

// Crie a pasta public se não existir
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('📁 Pasta public criada');
}

// Gere os ícones básicos
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

// Crie um arquivo .ico vazio (será substituído depois)
const icoContent = Buffer.from('');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoContent);

createBasicIcon(180, 'apple-touch-icon.png');
createBasicIcon(192, 'pwa-192x192.png');
createBasicIcon(512, 'pwa-512x512.png');
createBasicIcon(512, 'maskable-icon-512x512.png');

// Crie o manifest.json
const manifest = {
  name: "App Mari - Controle Salão",
  short_name: "App Mari",
  description: "Sistema de gestão para salões de beleza",
  theme_color: THEME_COLOR,
  background_color: "#ffffff",
  display: "standalone",
  orientation: "portrait",
  scope: "/controle-mari/",
  start_url: "/controle-mari/",
  icons: [
    {
      src: "pwa-192x192.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "pwa-512x512.png",
      sizes: "512x512",
      type: "image/png"
    },
    {
      src: "apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
      purpose: "apple touch icon"
    },
    {
      src: "maskable-icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ]
};

fs.writeFileSync(
  path.join(publicDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('✅ Manifest.json criado');
console.log('\n🎨 Para ícones PNG profissionais:');
console.log('1. Acesse: https://favicon.io/favicon-converter/');

console.log('\n📋 Copiando ícones para a raiz do projeto...');

const filesToCopy = [
  'apple-touch-icon.png',
  'pwa-192x192.png', 
  'pwa-512x512.png',
  'manifest.json'
];

filesToCopy.forEach(file => {
  const source = path.join(publicDir, file);
  const destination = path.join(__dirname, '..', file);
  
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
    console.log(`✅ Copiado: ${file} para raiz`);
  }
});

// Cria um favicon.ico na raiz (simples, para desenvolvimento)
const icoPath = path.join(__dirname, '..', 'favicon.ico');
if (!fs.existsSync(icoPath)) {
  // Cria um ICO básico a partir do SVG
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="3" fill="${THEME_COLOR}"/>
  <text x="8" y="12" font-family="Arial" font-size="10" font-weight="bold" fill="white" text-anchor="middle">M</text>
</svg>`;
  
  // Salva como .ico (na verdade é .svg com extensão .ico)
  fs.writeFileSync(icoPath, svgContent);
  console.log('✅ Criado: favicon.ico na raiz');
}

console.log('\n🎉 Ícones prontos!');
console.log('📍 Agora na pasta public/ E na raiz do projeto.');
