import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './DailyChecklist.css'

export function DailyChecklist() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState('current')
  const [viewMode, setViewMode] = useState('summary')
  const [stats, setStats] = useState({
    total: 0,
    agendado: 0,
    realizado: 0,
    falta: 0,
    valorAgendado: 0,
    valorRealizado: 0,
    valorFalta: 0
  })

  const getMonthRange = (filter) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    
    switch(filter) {
      case 'current':
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        return {
          start: firstDay.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0],
          label: `${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
        }
      
      case 'last':
        const lastMonthFirstDay = new Date(year, month - 1, 1)
        const lastMonthLastDay = new Date(year, month, 0)
        return {
          start: lastMonthFirstDay.toISOString().split('T')[0],
          end: lastMonthLastDay.toISOString().split('T')[0],
          label: `${lastMonthFirstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
        }
      
      default:
        return {
          start: '2000-01-01',
          end: '2100-12-31',
          label: 'Todos os registros'
        }
    }
  }

  async function loadServices() {
    setLoading(true)
    
    try {
      const monthRange = getMonthRange(monthFilter)
      console.log(`Carregando dados para: ${monthRange.label}`)
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes(nome, telefone),
          servicos(nome)
        `)
        .gte('data', monthRange.start)
        .lte('data', monthRange.end)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar:', error)
        alert('Erro ao carregar agendamentos: ' + error.message)
        return
      }

      console.log(`${data?.length || 0} registros carregados`)
      setServices(data || [])
      calculateStats(data || [])
      
    } catch (error) {
      console.error('Erro inesperado:', error)
      alert('Erro inesperado ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(data) {
    const agendados = data.filter(s => s.status === 'agendado')
    const realizados = data.filter(s => s.status === 'realizado')
    const faltas = data.filter(s => s.status === 'falta')

    const valorAgendado = agendados.reduce((sum, s) => sum + parseFloat(s.valor || 0), 0)
    const valorRealizado = realizados.reduce((sum, s) => sum + parseFloat(s.valor || 0), 0)
    const valorFalta = faltas.reduce((sum, s) => sum + parseFloat(s.valor || 0), 0)

    setStats({
      total: data.length,
      agendado: agendados.length,
      realizado: realizados.length,
      falta: faltas.length,
      valorAgendado,
      valorRealizado,
      valorFalta
    })
  }

  async function updateStatus(id, newStatus) {
    try {
      console.log(`Atualizando agendamento ${id} para status: ${newStatus}`)
      
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: newStatus
          // REMOVIDO: updated_at: new Date().toISOString() - coluna não existe
        })
        .eq('id', id)

      if (error) {
        console.error('Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Status atualizado com sucesso no banco')
      
      // Atualizar localmente
      const updatedServices = services.map(service =>
        service.id === id 
          ? { ...service, status: newStatus }
          : service
      )
      
      setServices(updatedServices)
      calculateStats(updatedServices)
      
      const feedback = newStatus === 'realizado' 
        ? '✅ Marcado como realizado!' 
        : '❌ Marcado como falta.'
      
      alert(feedback)
      
      // Recarregar para garantir sincronização
      setTimeout(() => loadServices(), 1000)
      
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      
      if (error.message.includes('updated_at')) {
        alert('Erro: A coluna "updated_at" não existe na tabela. Contate o administrador.')
      } else {
        alert('Erro ao atualizar status: ' + error.message)
      }
    }
  }

  async function updateStatusWithRetry(id, newStatus) {
    // Tenta primeiro sem updated_at
    try {
      await updateStatus(id, newStatus)
    } catch (error) {
      // Se falhar, tenta uma abordagem alternativa
      console.log('Tentando abordagem alternativa...')
      await updateStatusAlternative(id, newStatus)
    }
  }

  async function updateStatusAlternative(id, newStatus) {
    // Tenta atualizar apenas o status, sem nenhuma outra coluna
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      
      // Atualizar localmente
      const updatedServices = services.map(service =>
        service.id === id 
          ? { ...service, status: newStatus }
          : service
      )
      
      setServices(updatedServices)
      calculateStats(updatedServices)
      
      alert(newStatus === 'realizado' 
        ? '✅ Marcado como realizado!' 
        : '❌ Marcado como falta.')
      
    } catch (error) {
      console.error('Erro na abordagem alternativa:', error)
      alert('Erro ao atualizar: ' + error.message)
    }
  }

  useEffect(() => {
    loadServices()
  }, [monthFilter])

 const formatDate = (dateString) => {
  if (!dateString) return 'Sem data'
  try {
    // Divide a string e cria data LOCAL (sem timezone issues)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // Mês é 0-based no JS
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}

  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Filtrar serviços por status
  const agendados = services.filter(s => s.status === 'agendado')
  const realizados = services.filter(s => s.status === 'realizado')
  const faltas = services.filter(s => s.status === 'falta')

  const monthRange = getMonthRange(monthFilter)

  return (
    <div className="daily-checklist">
      {/* HEADER */}
      <div className="daily-checklist-header">
        <div className="daily-checklist-header-top">
          <h1 className="daily-checklist-title">📊 Dashboard de Agendamentos</h1>
          <button 
            onClick={loadServices}
            className="daily-checklist-reload-button"
            disabled={loading}
          >
            {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
          </button>
        </div>
        
        <div className="daily-checklist-period-info">
          <div className="daily-checklist-period-label">
            Período: <strong>{monthRange.label}</strong>
          </div>
          <div className="daily-checklist-total-info">
            {stats.total} registros encontrados
          </div>
        </div>
        
        {/* FILTROS */}
        <div className="daily-checklist-filters-container">
          <div className="daily-checklist-filter-group">
            <span className="daily-checklist-filter-label">📅 Filtrar por Mês:</span>
            <div className="daily-checklist-filters">
              <button 
                className={`daily-checklist-filter-button ${monthFilter === 'last' ? 'active' : ''}`}
                onClick={() => setMonthFilter('last')}
              >
                Mês Anterior
              </button>
              <button 
                className={`daily-checklist-filter-button ${monthFilter === 'current' ? 'active' : ''}`}
                onClick={() => setMonthFilter('current')}
              >
                Este Mês
              </button>
              <button 
                className={`daily-checklist-filter-button ${monthFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMonthFilter('all')}
              >
                Todos
              </button>
            </div>
          </div>
          
          <div className="daily-checklist-filter-group">
            <span className="daily-checklist-filter-label">👁️ Visualização:</span>
            <div className="daily-checklist-filters">
              <button 
                className={`daily-checklist-view-button ${viewMode === 'summary' ? 'active' : ''}`}
                onClick={() => setViewMode('summary')}
              >
                Resumo
              </button>
              <button 
                className={`daily-checklist-view-button ${viewMode === 'details' ? 'active' : ''}`}
                onClick={() => setViewMode('details')}
              >
                Detalhes
              </button>
              <button 
                className={`daily-checklist-view-button ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                Tudo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="daily-checklist-stats-grid">
        <div className="daily-checklist-stat-card total">
          <div className="daily-checklist-stat-icon">📊</div>
          <div className="daily-checklist-stat-content">
            <div className="daily-checklist-stat-label">Total</div>
            <div className="daily-checklist-stat-value">{stats.total}</div>
            <div className="daily-checklist-stat-subvalue">
              {formatCurrency(stats.valorAgendado + stats.valorRealizado + stats.valorFalta)}
            </div>
          </div>
        </div>
        
        <div className="daily-checklist-stat-card pending">
          <div className="daily-checklist-stat-icon">⏳</div>
          <div className="daily-checklist-stat-content">
            <div className="daily-checklist-stat-label">Pendentes</div>
            <div className="daily-checklist-stat-value">{stats.agendado}</div>
            <div className="daily-checklist-stat-subvalue">
              {formatCurrency(stats.valorAgendado)}
            </div>
          </div>
        </div>
        
        <div className="daily-checklist-stat-card completed">
          <div className="daily-checklist-stat-icon">✅</div>
          <div className="daily-checklist-stat-content">
            <div className="daily-checklist-stat-label">Realizados</div>
            <div className="daily-checklist-stat-value">{stats.realizado}</div>
            <div className="daily-checklist-stat-subvalue">
              {formatCurrency(stats.valorRealizado)}
            </div>
          </div>
        </div>
        
        <div className="daily-checklist-stat-card missed">
          <div className="daily-checklist-stat-icon">❌</div>
          <div className="daily-checklist-stat-content">
            <div className="daily-checklist-stat-label">Faltas</div>
            <div className="daily-checklist-stat-value">{stats.falta}</div>
            <div className="daily-checklist-stat-subvalue">
              {formatCurrency(stats.valorFalta)}
            </div>
          </div>
        </div>
      </div>

      {/* METAS DE PERFORMANCE */}
      <div className="daily-checklist-performance">
        <div className="daily-checklist-performance-item">
          <div className="daily-checklist-performance-label">Taxa de Realização</div>
          <div className="daily-checklist-performance-bar">
            <div 
              className="daily-checklist-performance-fill"
              style={{ 
                width: `${stats.total > 0 ? (stats.realizado / (stats.realizado + stats.falta) * 100) : 0}%` 
              }}
            ></div>
          </div>
          <div className="daily-checklist-performance-value">
            {stats.realizado + stats.falta > 0 
              ? `${((stats.realizado / (stats.realizado + stats.falta)) * 100).toFixed(1)}%` 
              : '0%'}
          </div>
        </div>
        
        <div className="daily-checklist-performance-item">
          <div className="daily-checklist-performance-label">Taxa de Faltas</div>
          <div className="daily-checklist-performance-bar">
            <div 
              className="daily-checklist-performance-fill missed"
              style={{ 
                width: `${stats.total > 0 ? (stats.falta / (stats.realizado + stats.falta) * 100) : 0}%` 
              }}
            ></div>
          </div>
          <div className="daily-checklist-performance-value missed">
            {stats.realizado + stats.falta > 0 
              ? `${((stats.falta / (stats.realizado + stats.falta)) * 100).toFixed(1)}%` 
              : '0%'}
          </div>
        </div>
      </div>

      {/* AGENDAMENTOS PENDENTES */}
      {(viewMode === 'summary' || viewMode === 'all') && (
        <div className="daily-checklist-section">
          <div className="daily-checklist-section-header">
            <h3 className="daily-checklist-section-title">
              ⏳ Agendamentos Pendentes ({agendados.length})
            </h3>
            <div className="daily-checklist-section-subtitle">
              Valor total pendente: {formatCurrency(stats.valorAgendado)}
            </div>
          </div>
          
          {agendados.length === 0 ? (
            <div className="daily-checklist-empty-state">
              <div className="daily-checklist-empty-icon">🎉</div>
              <div className="daily-checklist-empty-title">Tudo em dia!</div>
              <div className="daily-checklist-empty-message">
                Nenhum agendamento pendente encontrado para o período selecionado.
              </div>
            </div>
          ) : (
            <div className="daily-checklist-grid">
              {agendados.map(service => (
                <div key={service.id} className="daily-checklist-card">
                  <div className="daily-checklist-card-header">
                    <div className="daily-checklist-card-status pending">PENDENTE</div>
                    <div className="daily-checklist-card-date">
                      {formatDate(service.data)}
                    </div>
                  </div>
                  
                  <div className="daily-checklist-card-body">
                    <div className="daily-checklist-client">
                      <div className="daily-checklist-client-name">
                        {service.clientes?.nome || `Cliente ${service.cliente_id?.substring(0, 8)}...`}
                      </div>
                      {service.clientes?.telefone && (
                        <div className="daily-checklist-client-phone">
                          📱 {service.clientes.telefone}
                        </div>
                      )}
                    </div>
                    
                    <div className="daily-checklist-service">
                      <span className="daily-checklist-service-name">
                        {service.servicos?.nome || 'Serviço'}
                      </span>
                      <span className={`daily-checklist-service-type ${
                        service.tipo === 'salao' 
                          ? 'salao' 
                          : 'indicacao'
                      }`}>
                        {service.tipo === 'salao' ? '💈 Salão' : '👥 Indicação'}
                      </span>
                    </div>
                    
                    <div className="daily-checklist-value">
                      {formatCurrency(service.valor)}
                    </div>
                  </div>
                  
                  <div className="daily-checklist-card-actions">
                    <button
                      onClick={() => updateStatusWithRetry(service.id, 'realizado')}
                      className="daily-checklist-action-button success"
                    >
                      <span className="daily-checklist-action-icon">✓</span>
                      Realizado
                    </button>
                    <button
                      onClick={() => updateStatusWithRetry(service.id, 'falta')}
                      className="daily-checklist-action-button danger"
                    >
                      <span className="daily-checklist-action-icon">✗</span>
                      Falta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TODOS OS REGISTROS */}
      {(viewMode === 'details' || viewMode === 'all') && (
        <div className="daily-checklist-section">
          <div className="daily-checklist-section-header">
            <h3 className="daily-checklist-section-title">
              📋 Todos os Registros ({services.length})
            </h3>
            <div className="daily-checklist-section-subtitle">
              Período: {monthRange.label}
            </div>
          </div>
          
          <div className="daily-checklist-table-container">
            <table className="daily-checklist-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={service.id} className={`daily-checklist-table-row ${service.status}`}>
                    <td className="daily-checklist-table-index">{index + 1}</td>
                    <td className="daily-checklist-table-client">
                      <div className="daily-checklist-table-client-name">
                        {service.clientes?.nome || 'N/A'}
                      </div>
                      {service.clientes?.telefone && (
                        <div className="daily-checklist-table-client-phone">
                          {service.clientes.telefone}
                        </div>
                      )}
                    </td>
                    <td className="daily-checklist-table-service">
                      {service.servicos?.nome || 'N/A'}
                    </td>
                    <td className="daily-checklist-table-date">
                      {formatDate(service.data)}
                    </td>
                    <td className="daily-checklist-table-status">
                      <span className={`daily-checklist-status-badge ${service.status}`}>
                        {service.status === 'agendado' ? '⏳ Pendente' :
                         service.status === 'realizado' ? '✅ Realizado' :
                         '❌ Falta'}
                      </span>
                    </td>
                    <td className="daily-checklist-table-type">
                      <span className={`daily-checklist-type-badge ${service.tipo}`}>
                        {service.tipo === 'salao' ? '💈' : '👥'}
                      </span>
                    </td>
                    <td className="daily-checklist-table-value">
                      {formatCurrency(service.valor)}
                    </td>
                    <td className="daily-checklist-table-actions">
                      {service.status === 'agendado' && (
                        <>
                          <button
                            onClick={() => updateStatusWithRetry(service.id, 'realizado')}
                            className="daily-checklist-table-action success"
                            title="Marcar como realizado"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => updateStatusWithRetry(service.id, 'falta')}
                            className="daily-checklist-table-action danger"
                            title="Marcar como falta"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      {service.status !== 'agendado' && (
                        <button
                          onClick={() => updateStatusWithRetry(service.id, 'agendado')}
                          className="daily-checklist-table-action warning"
                          title="Reverter para pendente"
                        >
                          ↩️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {services.length === 0 && (
            <div className="daily-checklist-empty-state">
              <div className="daily-checklist-empty-icon">📭</div>
              <div className="daily-checklist-empty-title">Nenhum registro</div>
              <div className="daily-checklist-empty-message">
                Nenhum agendamento encontrado para o período selecionado.
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESUMO FINANCEIRO */}
      <div className="daily-checklist-section financial">
        <div className="daily-checklist-section-header">
          <h3 className="daily-checklist-section-title">💰 Resumo Financeiro</h3>
        </div>
        
        <div className="daily-checklist-financial-grid">
          <div className="daily-checklist-financial-card">
            <div className="daily-checklist-financial-label">Receita Potencial</div>
            <div className="daily-checklist-financial-value pending">
              {formatCurrency(stats.valorAgendado)}
            </div>
            <div className="daily-checklist-financial-desc">
              Valor total dos agendamentos pendentes
            </div>
          </div>
          
          <div className="daily-checklist-financial-card">
            <div className="daily-checklist-financial-label">Receita Realizada</div>
            <div className="daily-checklist-financial-value completed">
              {formatCurrency(stats.valorRealizado)}
            </div>
            <div className="daily-checklist-financial-desc">
              Valor total já realizado
            </div>
          </div>
          
          <div className="daily-checklist-financial-card">
            <div className="daily-checklist-financial-label">Perdas por Faltas</div>
            <div className="daily-checklist-financial-value missed">
              {formatCurrency(stats.valorFalta)}
            </div>
            <div className="daily-checklist-financial-desc">
              Valor perdido com ausências
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default DailyChecklist