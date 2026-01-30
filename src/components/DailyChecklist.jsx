import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './DailyChecklist.css'

export function DailyChecklist() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ realizado: 0, falta: 0, total: 0 })

  const today = new Date().toISOString().split('T')[0]

  async function loadTodayServices() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        clientes(nome, telefone),
        servicos(nome)
      `)
      .eq('data', today)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao carregar:', error)
    } else {
      setServices(data || [])
      calculateTotals(data || [])
    }
    
    setLoading(false)
  }

  function calculateTotals(data) {
    const realizado = data
      .filter(s => s.status === 'realizado')
      .reduce((sum, s) => sum + parseFloat(s.valor), 0)
    
    const falta = data
      .filter(s => s.status === 'falta')
      .reduce((sum, s) => sum + parseFloat(s.valor), 0)
    
    const total = data
      .filter(s => s.status !== 'agendado')
      .reduce((sum, s) => sum + parseFloat(s.valor), 0)

    setTotals({ realizado, falta, total })
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      const updatedServices = services.map(service =>
        service.id === id 
          ? { ...service, status: newStatus }
          : service
      )
      
      setServices(updatedServices)
      calculateTotals(updatedServices)
      
      // Feedback visual
      const feedback = newStatus === 'realizado' ? '✅ Marcado como realizado!' : '❌ Marcado como falta.'
      alert(feedback)
    } else {
      alert('Erro ao atualizar: ' + error.message)
    }
  }

  useEffect(() => {
    loadTodayServices()
  }, [])

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const agendados = services.filter(s => s.status === 'agendado')
  const realizados = services.filter(s => s.status === 'realizado')
  const faltas = services.filter(s => s.status === 'falta')

  return (
    <div className="daily-checklist">
      <div className="daily-checklist-header">
        <h2 className="daily-checklist-title">✅ Fechamento do Dia</h2>
        <p className="daily-checklist-date">{formattedDate}</p>
        
        <button 
          onClick={loadTodayServices}
          className="daily-checklist-reload-button"
          disabled={loading}
        >
          {loading ? '🔄 Carregando...' : '🔄 Atualizar Lista'}
        </button>
      </div>

      {/* RESUMO */}
      <div className="daily-checklist-summary">
        <div className="daily-checklist-summary-item">
          <div className="daily-checklist-summary-label">Agendados</div>
          <div className="daily-checklist-summary-value">{agendados.length}</div>
        </div>
        <div className="daily-checklist-summary-item daily-checklist-summary-realizados">
          <div className="daily-checklist-summary-label">Realizados</div>
          <div className="daily-checklist-summary-value">{realizados.length}</div>
        </div>
        <div className="daily-checklist-summary-item daily-checklist-summary-faltas">
          <div className="daily-checklist-summary-label">Faltas</div>
          <div className="daily-checklist-summary-value">{faltas.length}</div>
        </div>
      </div>

      {/* PENDENTES */}
      <div className="daily-checklist-section">
        <h3 className="daily-checklist-section-title">
          ⏳ Pendentes ({agendados.length})
        </h3>
        
        {agendados.length === 0 ? (
          <div className="daily-checklist-empty">
            🎉 Nenhum agendamento pendente hoje!
          </div>
        ) : (
          <div className="daily-checklist-list">
            {agendados.map(service => (
              <div key={service.id} className="daily-checklist-card">
                <div className="daily-checklist-card-content">
                  <div className="daily-checklist-client-name">
                    {service.clientes?.nome || 'Cliente'}
                    {service.clientes?.telefone && (
                      <span style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        marginLeft: '8px'
                      }}>
                        📱 {service.clientes.telefone}
                      </span>
                    )}
                  </div>
                  <div className="daily-checklist-service-info">
                    <span>{service.servicos?.nome || 'Serviço'}</span>
                    <span className={`daily-checklist-service-type ${
                      service.tipo === 'salao' 
                        ? 'daily-checklist-service-type-salao' 
                        : 'daily-checklist-service-type-indicacao'
                    }`}>
                      {service.tipo === 'salao' ? '💈 Salão' : '👥 Indicação'}
                    </span>
                  </div>
                  <div className="daily-checklist-value">
                    R$ {parseFloat(service.valor).toFixed(2)}
                  </div>
                </div>
                
                <div className="daily-checklist-actions">
                  <button
                    onClick={() => updateStatus(service.id, 'realizado')}
                    className="daily-checklist-success-button"
                  >
                    ✓ Feito
                  </button>
                  <button
                    onClick={() => updateStatus(service.id, 'falta')}
                    className="daily-checklist-danger-button"
                  >
                    ✗ Falta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REALIZADOS */}
      {realizados.length > 0 && (
        <div className="daily-checklist-section">
          <h3 className="daily-checklist-section-title" style={{ color: '#10B981' }}>
            ✅ Realizados ({realizados.length})
          </h3>
          <div className="daily-checklist-completed-list">
            {realizados.map(service => (
              <div key={service.id} className="daily-checklist-completed-card">
                <span>{service.clientes?.nome}</span>
                <span style={{ fontWeight: 'bold', color: '#065F46' }}>
                  R$ {parseFloat(service.valor).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOTAIS */}
      <div className="daily-checklist-totals">
        <div className="daily-checklist-total-item">
          <span className="daily-checklist-total-label">Total Realizado:</span>
          <span className="daily-checklist-total-value">
            R$ {totals.realizado.toFixed(2)}
          </span>
        </div>
        <div className="daily-checklist-total-item">
          <span className="daily-checklist-total-label">Total Faltas:</span>
          <span className="daily-checklist-total-value daily-checklist-total-falta">
            R$ {totals.falta.toFixed(2)}
          </span>
        </div>
        <div className="daily-checklist-total-item daily-checklist-total-final">
          <span className="daily-checklist-total-label" style={{ fontWeight: 'bold' }}>
            TOTAL DO DIA:
          </span>
          <span className="daily-checklist-total-value" style={{ fontSize: '28px' }}>
            R$ {totals.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* FINALIZAR DIA */}
      <button 
        className="daily-checklist-finalize-button"
        onClick={() => {
          if (agendados.length > 0) {
            if (confirm(`⚠️ Ainda tem ${agendados.length} agendamento(s) pendente(s). Deseja finalizar mesmo assim?`)) {
              alert('🏁 Dia finalizado com sucesso!')
              loadTodayServices() // Recarrega a lista
            }
          } else {
            alert('🎉 ✅ Dia finalizado com sucesso! Todos os atendimentos foram processados.')
            loadTodayServices() // Recarrega a lista
          }
        }}
      >
        <span>🏁</span>
        Finalizar Dia
      </button>
    </div>
  )
}

export default DailyChecklist