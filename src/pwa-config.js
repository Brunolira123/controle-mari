// src/pwa-config.js
export const PWA_CONFIG = {
  // Configurações específicas para iOS
  ios: {
    // Força reload quando o app é aberto da tela inicial
    onLaunch: () => {
      if (window.navigator.standalone) {
        // Está rodando como PWA standalone
        console.log('📱 Rodando como PWA standalone no iOS');
        
        // Força recarregamento se houver nova versão
        if (localStorage.getItem('pwa-last-update') !== __BUILD_TIMESTAMP__) {
          localStorage.setItem('pwa-last-update', __BUILD_TIMESTAMP__);
          window.location.reload();
        }
      }
    }
  }
};

// Variável global para build timestamp
window.__BUILD_TIMESTAMP__ = new Date().toISOString();