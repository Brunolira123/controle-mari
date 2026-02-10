import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Dashboard.css'
import VisitasModal from './VisitasModal'

function Dashboard({ onNavigate, user }) {
  const [stats, setStats] = useState({
    hoje: 0,
    semana: 0,
    mes: 0,
    pendentes: 0,
    totalGeral: 0,
    visitasHoje: 0,
    visitasTotal: 0,
    taxaConversao: 0,
    visitasAbertas: 0, // NULL = em aberto
    visitasFechadas: 0, // TRUE = fechadas
    visitasNaoFechou: 0 // FALSE = não fechou
  })
  const [loading, setLoading] = useState(true)
  const [recentes, setRecentes] = useState([])
  const [showVisitasModal, setShowVisitasModal] = useState(false)

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

      // Dados de visitas - SEPARADOS POR STATUS
      const { data: visitasHoje } = await supabase
        .from('visitas')
        .select('*')
        .eq('data_visita', hoje)

      const { data: todasVisitas } = await supabase
        .from('visitas')
        .select('*')

      // Calcular estatísticas de visitas CORRETAMENTE
      const todasVisitasArray = todasVisitas || []
      const visitasHojeArray = visitasHoje || []
      
      // Contagem por status
      const visitasFechadas = todasVisitasArray.filter(v => v.fechou_contrato === true).length
      const visitasNaoFechou = todasVisitasArray.filter(v => v.fechou_contrato === false).length
      const visitasAbertas = todasVisitasArray.filter(v => v.fechou_contrato === null).length
      const totalVisitas = todasVisitasArray.length
      
      // Visitas de hoje EM ABERTO (só NULL)
      const visitasHojeAbertas = visitasHojeArray.filter(v => v.fechou_contrato === null).length
      
      const taxaConversao = totalVisitas > 0 ? 
        ((visitasFechadas / totalVisitas) * 100).toFixed(1) : 0

      const valorPendentes = hojeData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0
      const valorRealizados = realizadosHoje?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0

      setStats({
        hoje: hojeData?.length || 0,
        semana: 0,
        mes: 0,
        pendentes: valorPendentes,
        totalGeral: valorRealizados,
        visitasHoje: visitasHojeAbertas, // SÓ VISITAS DE HOJE EM ABERTO
        visitasTotal: totalVisitas,
        taxaConversao: parseFloat(taxaConversao),
        visitasAbertas: visitasAbertas,
        visitasFechadas: visitasFechadas,
        visitasNaoFechou: visitasNaoFechou
      })

      setRecentes(recentesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Menu items
  const menuItems = [
    {
      id: 'agendar',
      label: 'Agendar',
      icon: '➕',
      desc: 'Novo serviço'
    },
    {
      id: 'visitas',
      label: 'Visitas',
      icon: '👥',
      desc: '',
      onClick: () => setShowVisitasModal(true)
    },
    {
      id: 'fechar',
      label: 'Fechar',
      icon: '✅',
      desc: 'Marcar realizados'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: '👤',
      desc: 'Cadastro'
    },
    {
      id: 'servicos',
      label: 'Serviços',
      icon: '✂️',
      desc: 'Catálogo'
    },
    {
      id: 'perfil',
      label: 'Perfil',
      icon: '⚙️',
      desc: 'Configurações'
    }
  ]

  const hoje = new Date()
  const hora = hoje.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <>
      <div className="dashboard">
        {/* CABEÇALHO */}
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

        {/* ESTATÍSTICAS */}
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
          
          <div className="stat-card" onClick={() => setShowVisitasModal(true)}>
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.visitasAbertas}</div>
            <div className="stat-label">Em Aberto</div>
          </div>
          
          <div className="stat-card" onClick={() => setShowVisitasModal(true)}>
            <div className="stat-icon">📈</div>
            <div className="stat-value">{stats.taxaConversao}%</div>
            <div className="stat-label">Conversão</div>
          </div>
        </div>

        {/* RESUMO VISITAS - SÓ APARECE SE TIVER VISITAS */}
        {stats.visitasTotal > 0 && (
          <div className="visitas-resumo">
            <h3 className="section-title">Visitas</h3>
            <div className="visitas-resumo-stats">
              <div className="visita-resumo-item aberto" onClick={() => setShowVisitasModal(true)}>
                <div className="resumo-icone">⏳</div>
                <div className="resumo-info">
                  <div className="resumo-valor">{stats.visitasAbertas}</div>
                  <div className="resumo-label">Em aberto</div>
                </div>
              </div>
              <div className="visita-resumo-item fechado" onClick={() => setShowVisitasModal(true)}>
                <div className="resumo-icone">✅</div>
                <div className="resumo-info">
                  <div className="resumo-valor">{stats.visitasFechadas}</div>
                  <div className="resumo-label">Fechadas</div>
                </div>
              </div>
              <div className="visita-resumo-item nao-fechou" onClick={() => setShowVisitasModal(true)}>
                <div className="resumo-icone">❌</div>
                <div className="resumo-info">
                  <div className="resumo-valor">{stats.visitasNaoFechou}</div>
                  <div className="resumo-label">Não fechou</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MENU PRINCIPAL */}
        <div className="dashboard-menu">
          <h2 className="section-title">Menu Principal</h2>
          <div className="menu-grid">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick || (() => onNavigate(item.id))}
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
            <h2 className="section-title">Agendamentos Recentes</h2>
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

        {/* NOTIFICAÇÃO DE PENDENTES - Agendamentos */}
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

        {/* NOTIFICAÇÃO DE VISITAS ABERTAS - SÓ SE TIVER VISITAS COM NULL */}
        {stats.visitasAbertas > 0 && (
          <div className="notification info">
            <div className="notification-icon">👥</div>
            <div className="notification-content">
              <strong>Você tem {stats.visitasAbertas} visita(s) em aberto</strong>
              <button 
                onClick={() => setShowVisitasModal(true)}
                className="notification-button"
              >
                Ver Visitas
              </button>
            </div>
          </div>
        )}

        {/* VISITAS DE HOJE EM ABERTO */}
        {stats.visitasHoje > 0 && (
          <div className="notification warning">
            <div className="notification-icon">📅</div>
            <div className="notification-content">
              <strong>Você tem {stats.visitasHoje} visita(s) hoje</strong>
              <button 
                onClick={() => setShowVisitasModal(true)}
                className="notification-button"
              >
                Ver Hoje
              </button>
            </div>
          </div>
        )}

        {/* BOTÃO FIXO PARA VISITAS NO MOBILE */}
        <button 
          onClick={() => setShowVisitasModal(true)}
          className="mobile-fixed-button"
        >
          👥 Visitas ({stats.visitasAbertas})
        </button>
      </div>

      {/* MODAL DE VISITAS */}
      {showVisitasModal && (
        <VisitasModal
          onClose={() => setShowVisitasModal(false)}
          onRefresh={carregarDados}
        />
      )}
    </>
  )
}

export default Dashboard