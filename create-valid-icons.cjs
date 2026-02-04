// create-valid-icons.js
const fs = require('fs');
const { createCanvas } = require('canvas');

// Instale canvas se não tiver: npm install canvas

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 }
];

sizes.forEach(({ name, size }) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fundo roxo
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(0, 0, size, size);
  
  // Texto branco
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.25}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', size / 2, size / 2);
  
  // Borda branca
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.02;
  ctx.strokeRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);
  
  // Salvar como PNG VÁLIDO
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(name, buffer);
  console.log(`✅ Criado: ${name} (${size}x${size})`);
});

console.log('🎉 Todos os ícones PNG válidos foram criados!');