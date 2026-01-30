import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import './Footer.css';

function FooterExtended({ currentView, onNavigate, user }) {
  const [stats, setStats] = useState({
    hoje: 0,
    semana: 0,
    mes: 0,
    metaProgresso: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (user && currentView !== 'login') {
      loadQuickStats();
      const interval = setInterval(loadQuickStats, 300000); // Atualiza a cada 5 minutos
      return () => clearInterval(interval);
    }
  }, [user, currentView]);

  async function loadQuickStats() {
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];
    
    try {
      // Agendamentos de hoje
      const { data: hojeData } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', hoje)
        .eq('status', 'agendado');

      // Total da semana
      const semanaPassada = new Date();
      semanaPassada.setDate(semanaPassada.getDate() - 7);
      
      const { data: semanaData } = await supabase
        .from('agendamentos')
        .select('valor')
        .gte('data', semanaPassada.toISOString().split('T')[0])
        .eq('status', 'realizado');

      // Total do mês
      const primeiroDiaMes = new Date();
      primeiroDiaMes.setDate(1);
      
      const { data: mesData } = await supabase
        .from('agendamentos')
        .select('valor')
        .gte('data', primeiroDiaMes.toISOString().split('T')[0])
        .eq('status', 'realizado');

      const totalSemana = semanaData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0;
      const totalMes = mesData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0;

      // Progresso da meta
      const metaMensal = user?.meta_mensal || 5000;
      const progresso = metaMensal > 0 ? (totalMes / metaMensal) * 100 : 0;

      setStats({
        hoje: hojeData?.length || 0,
        semana: totalSemana,
        mes: totalMes,
        metaProgresso: Math.min(100, progresso)
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  if (currentView === 'login' || !user) {
    return null;
  }

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          
          {/* Seção de Navegação Rápida */}
          <div className="footer-section">
            <h3 className="footer-section-title">
              <span className="footer-icon">⚡</span>
              Menu Rápido
            </h3>
            <div className="footer-nav-grid">
              {[
                { id: 'dashboard', icon: '🏠', label: 'Início' },
                { id: 'agendar', icon: '➕', label: 'Agendar' },
                { id: 'fechar', icon: '✅', label: 'Fechar' },
                { id: 'quinzenal', icon: '📊', label: 'Relatórios' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`footer-nav-item ${currentView === item.id ? 'active' : ''}`}
                >
                  <div className="footer-nav-icon">{item.icon}</div>
                  <div className="footer-nav-text">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progresso da Meta */}
          <div className="footer-section">
            <h3 className="footer-section-title">
              <span className="footer-icon">🎯</span>
              Meta Mensal
            </h3>
            <div className="footer-meta">
              <div className="footer-meta-info">
                <div className="footer-meta-value">R$ {stats.mes.toFixed(2)}</div>
                <div className="footer-meta-label">de R$ {user?.meta_mensal || 5000}</div>
              </div>
              
              <div className="footer-progress">
                <div 
                  className="footer-progress-bar"
                  style={{ width: `${stats.metaProgresso}%` }}
                />
              </div>
              
              <div className="footer-meta-percent">
                {stats.metaProgresso.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="footer-section">
            <h3 className="footer-section-title">
              <span className="footer-icon">📈</span>
              Resumo
            </h3>
            {loading ? (
              <div className="footer-loading">🔄 Atualizando...</div>
            ) : (
              <div className="footer-stats-extended">
                <div className="footer-stat-extended">
                  <div className="footer-stat-extended-icon">📅</div>
                  <div className="footer-stat-extended-content">
                    <div className="footer-stat-extended-value">{stats.hoje}</div>
                    <div className="footer-stat-extended-label">Hoje</div>
                  </div>
                </div>
                
                <div className="footer-stat-extended">
                  <div className="footer-stat-extended-icon">📆</div>
                  <div className="footer-stat-extended-content">
                    <div className="footer-stat-extended-value">R$ {stats.semana.toFixed(2)}</div>
                    <div className="footer-stat-extended-label">Semana</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ações e Informações */}
          <div className="footer-section">
            <h3 className="footer-section-title">
              <span className="footer-icon">⚙️</span>
              Sistema
            </h3>
            
            <div className="footer-user">
              <div className="footer-user-avatar">{user?.avatar || '👤'}</div>
              <div className="footer-user-info">
                <div className="footer-user-name">{user?.nome || 'Usuário'}</div>
                <div className="footer-user-period">
                  {new Date().getDate() <= 15 ? '1ª Quinzena' : '2ª Quinzena'}
                </div>
              </div>
            </div>
            
            <div className="footer-actions-extended">
              <button 
                className="footer-action-button"
                onClick={loadQuickStats}
                disabled={loading}
              >
                <span className="footer-action-icon">🔄</span>
                Atualizar
              </button>
              
              <button 
                className="footer-action-button secondary"
                onClick={() => window.open('/help', '_blank')}
              >
                <span className="footer-action-icon">❓</span>
                Ajuda
              </button>
            </div>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-bottom-status">
              <div className="status-indicator" />
              <span>Sistema Online</span>
              <span className="footer-update-time">
                • Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">
                <span>📱</span>
                Suporte
              </a>
              <a href="#" className="footer-bottom-link">
                <span>📄</span>
                Termos
              </a>
              <a href="#" className="footer-bottom-link">
                <span>🔒</span>
                Privacidade
              </a>
              <a href="#" className="footer-bottom-link">
                <span>ℹ️</span>
                Sobre
              </a>
            </div>
            
            <div className="footer-copyright-extended">
              <p>© {new Date().getFullYear()} Salão App • v1.0</p>
              <p className="footer-version">Modo Offline • Dados Locais</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default FooterExtended;