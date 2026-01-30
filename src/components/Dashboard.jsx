import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

function Dashboard({ onNavigate, user }) {
  const [stats, setStats] = useState({
    hoje: 0,
    semana: 0,
    mes: 0,
    pendentes: 0,
    totalGeral: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentes, setRecentes] = useState([])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    const hoje = new Date().toISOString().split('T')[0]
    
    try {
      // Agendamentos de hoje
      const { data: hojeData } = await supabase
        .from('agendamentos')
        .select('valor')
        .eq('data', hoje)
        .eq('status', 'agendado')

      // Realizados hoje
      const { data: realizadosHoje } = await supabase
        .from('agendamentos')
        .select('valor')
        .eq('data', hoje)
        .eq('status', 'realizado')

      // Recentes (últimos 5)
      const { data: recentesData } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes(nome),
          servicos(nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      const valorPendentes = hojeData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0
      const valorRealizados = realizadosHoje?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0

      setStats({
        hoje: hojeData?.length || 0,
        semana: 0,
        mes: 0,
        pendentes: valorPendentes,
        totalGeral: valorRealizados
      })

      setRecentes(recentesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Menu items otimizados para mobile
  const menuItems = [
    {
      id: 'agendar',
      label: 'Agendar',
      icon: '➕',
      desc: 'Novo serviço'
    },
    {
      id: 'fechar',
      label: 'Fechar',
      icon: '✅',
      desc: 'Marcar realizados'
    },
    {
      id: 'quinzenal',
      label: 'Relatórios',
      icon: '📊',
      desc: 'Quinzenal'
    },
    {
      id: 'perfil',
      label: 'Perfil',
      icon: '👤',
      desc: 'Meus dados'
    }
  ]

  const hoje = new Date()
  const hora = hoje.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="dashboard">
      {/* CABEÇALHO COMPACTO */}
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {user?.nome?.charAt(0) || '👤'}
          </div>
          <div>
            <h1 className="user-name">{saudacao}, {user?.nome?.split(' ')[0] || 'Usuário'}!</h1>
            <div className="user-role">
              {hoje.toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}
            </div>
          </div>
        </div>
        <button 
          onClick={carregarDados}
          className="refresh-button"
          disabled={loading}
          title="Atualizar dados"
        >
          {loading ? '🔄' : '🔄'}
        </button>
      </div>

      {/* ESTATÍSTICAS RÁPIDAS */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigate('fechar')}>
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.hoje}</div>
          <div className="stat-label">Agendados</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">R$ {stats.pendentes.toFixed(0)}</div>
          <div className="stat-label">Pendentes</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">R$ {stats.totalGeral.toFixed(0)}</div>
          <div className="stat-label">Realizados</div>
        </div>
      </div>

      {/* MENU PRINCIPAL COMPACTO */}
      <div className="dashboard-menu">
        <h2 className="section-title">Menu Principal</h2>
        <div className="menu-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.id === 'perfil' ? alert('Em desenvolvimento') : onNavigate(item.id)}
              className="menu-card"
            >
              <div className="menu-icon">
                {item.icon}
              </div>
              <div className="menu-content">
                <div className="menu-title">{item.label}</div>
                <div className="menu-desc">{item.desc}</div>
              </div>
              <div className="menu-arrow">→</div>
            </button>
          ))}
        </div>
      </div>

      {/* ATENDIMENTOS RECENTES */}
      {recentes.length > 0 && (
        <div className="recent-section">
          <h2 className="section-title">Recentes</h2>
          <div className="recent-list">
            {recentes.slice(0, 3).map((item) => (
              <div key={item.id} className="recent-card" onClick={() => onNavigate('fechar')}>
                <div className="recent-client">
                  {item.clientes?.nome?.split(' ')[0] || 'Cliente'}
                </div>
                <div className="recent-service">
                  {item.servicos?.nome?.split(' ')[0] || 'Serviço'}
                </div>
                <div className="recent-date">
                  {new Date(item.data).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </div>
                <div className={`recent-status ${item.status}`}>
                  {item.status === 'realizado' ? '✅' : '⏳'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFICAÇÃO DE PENDENTES */}
      {stats.hoje > 0 && (
        <div className="notification">
          <div className="notification-icon">🔔</div>
          <div className="notification-content">
            <strong>Você tem {stats.hoje} agendamento(s) pendente(s)</strong>
            <button 
              onClick={() => onNavigate('fechar')}
              className="notification-button"
            >
              Fechar Agora
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard