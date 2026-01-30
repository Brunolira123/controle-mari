// src/components/Header.jsx
import './Header.css'

function Header({ title, onBack, showDate = true, showTime = true, showPeriod = true }) {
  const hoje = new Date()
  
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  
  const horaFormatada = hoje.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const periodo = hoje.getDate() <= 15 ? '1ª Quinzena' : '2ª Quinzena'

  return (
    <header className="header">
      <div className="header-content">
        {/* BOTÃO VOLTAR */}
        {onBack && (
          <button onClick={onBack} className="header-back-button">
            <span className="back-icon">←</span>
            <span className="back-text">Voltar</span>
          </button>
        )}

        {/* TÍTULO PRINCIPAL */}
        <div className="header-main">
          <div className="header-icon-container">
            <div className="header-icon">✂️</div>
          </div>
          <div className="header-text">
            <h1 className="header-title">{title}</h1>
            
            {/* INFORMAÇÕES ADICIONAIS */}
            {(showDate || showTime || showPeriod) && (
              <div className="header-info">
                {showDate && (
                  <div className="info-item">
                    <span className="info-icon">📅</span>
                    <span className="info-text">{dataFormatada}</span>
                  </div>
                )}
                
                {showTime && (
                  <div className="info-item">
                    <span className="info-icon">🕐</span>
                    <span className="info-text">{horaFormatada}</span>
                  </div>
                )}
                
                {showPeriod && (
                  <div className="info-item">
                    <span className="info-icon">📊</span>
                    <span className="info-text">{periodo}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STATS RÁPIDOS (opcional) */}
        <div className="header-stats">
          <div className="stat-item">
            <div className="stat-icon">💼</div>
            <div className="stat-label">Atend.</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Comiss.</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-icon">📈</div>
            <div className="stat-label">Relat.</div>
          </div>
        </div>
      </div>

      
    </header>
  )
}

export default Header