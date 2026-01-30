import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import './FooterMobile.css';

function FooterMobile({ currentView, onNavigate, user }) {
  const [todayCount, setTodayCount] = useState(0);
  const [todayValue, setTodayValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(currentView);

  // Sempre chamar useEffect, mas com lógica condicional dentro
  useEffect(() => {
    if (user) {
      loadTodayData();
    }
  }, [user]);

  async function loadTodayData() {
    if (!user) return;
    
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];
    
    try {
      // Agendamentos de hoje realizados
      const { data: hojeData } = await supabase
        .from('agendamentos')
        .select('valor')
        .eq('data', hoje)
        .eq('status', 'realizado');

      // Agendamentos pendentes
      const { data: pendentesData } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', hoje)
        .eq('status', 'agendado');

      const totalHoje = hojeData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0;
      
      setTodayCount(pendentesData?.length || 0);
      setTodayValue(totalHoje);
    } catch (error) {
      console.error('Erro ao carregar dados do dia:', error);
    } finally {
      setLoading(false);
    }
  }

  // Não mostrar footer na página de login
  if (currentView === 'login' || !user) {
    return null;
  }

  // Navegação mobile com feedback tátil
  const handleNavigation = (view) => {
    setActiveTab(view);
    onNavigate(view);
  };

  return (
    <div className="footer-mobile">
      {/* Barra de Ações Superiores (Sticky no Topo) */}
      {currentView === 'dashboard' && (
        <div className="mobile-top-bar">
          <div className="mobile-quick-stats">
            <div className="quick-stat">
              <span className="quick-stat-icon">📅</span>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{todayCount}</div>
                <div className="quick-stat-label">Hoje</div>
              </div>
            </div>
            
            <div className="quick-stat">
              <span className="quick-stat-icon">💰</span>
              <div className="quick-stat-content">
                <div className="quick-stat-value">R$ {todayValue.toFixed(2)}</div>
                <div className="quick-stat-label">Realizado</div>
              </div>
            </div>
            
            <button 
              className="quick-refresh"
              onClick={loadTodayData}
              disabled={loading}
            >
              {loading ? '🔄' : '🔄'}
            </button>
          </div>
        </div>
      )}

      {/* Barra de Navegação Inferior (Fixed) */}
      <div className="mobile-nav-bar">
        <button 
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('dashboard')}
        >
          <div className="mobile-nav-icon">
            {activeTab === 'dashboard' ? '🏠' : '🏠'}
          </div>
          <div className="mobile-nav-label">Início</div>
        </button>
        
        <button 
          className={`mobile-nav-item ${activeTab === 'agendar' ? 'active' : ''}`}
          onClick={() => handleNavigation('agendar')}
        >
          <div className="mobile-nav-icon">
            {activeTab === 'agendar' ? '➕' : '➕'}
          </div>
          <div className="mobile-nav-label">Agendar</div>
        </button>
        
        {/* Botão Central (Destaque) */}
        <div className="mobile-center-action">
          <button 
            className="mobile-action-button"
            onClick={() => handleNavigation('fechar')}
          >
            <div className="action-icon">✅</div>
          </button>
          <div className="action-label">Fechar</div>
        </div>
        
        <button 
          className={`mobile-nav-item ${activeTab === 'quinzenal' ? 'active' : ''}`}
          onClick={() => handleNavigation('quinzenal')}
        >
          <div className="mobile-nav-icon">
            {activeTab === 'quinzenal' ? '📊' : '📊'}
          </div>
          <div className="mobile-nav-label">Relatórios</div>
        </button>
        
        <button 
          className="mobile-nav-item"
          onClick={() => {
            // Menu de contexto simplificado
            if (window.confirm('Recarregar dados?')) {
              loadTodayData();
            }
          }}
        >
          <div className="mobile-nav-icon">⋯</div>
          <div className="mobile-nav-label">Mais</div>
        </button>
      </div>

      {/* Badge de Status (Flutuante) */}
      <div className="mobile-status-badge">
        <div className="status-indicator"></div>
        <span>Online</span>
        <span className="status-time">
          {new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
}

export default FooterMobile;