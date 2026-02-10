import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './VisitasModal.css'

function VisitasModal({ onClose, onRefresh }) {
  const [visitas, setVisitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVisita, setEditingVisita] = useState(null)

  // Form state
  const [form, setForm] = useState({
    cliente_nome: '',
    contato: '',
    data_visita: new Date().toISOString().split('T')[0],
    observacoes: ''
  })

  useEffect(() => {
    carregarVisitas()
  }, [])

  async function carregarVisitas() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('visitas')
        .select('*')
        .order('data_visita', { ascending: false })

      if (error) throw error

      setVisitas(data || [])
    } catch (error) {
      console.error('Erro ao carregar visitas:', error)
      alert('Erro ao carregar visitas')
      setVisitas([])
    } finally {
      setLoading(false)
    }
  }

  async function salvarVisita(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const visitaData = {
        cliente_nome: form.cliente_nome,
        contato: form.contato || null,
        data_visita: form.data_visita,
        observacoes: form.observacoes || null,
        fechou_contrato: null // SEMPRE inicia como NULL (sem resposta)
      }

      if (editingVisita) {
        const { error } = await supabase
          .from('visitas')
          .update(visitaData)
          .eq('id', editingVisita.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('visitas')
          .insert([visitaData])

        if (error) throw error
      }

      // Limpar form
      setForm({
        cliente_nome: '',
        contato: '',
        data_visita: new Date().toISOString().split('T')[0],
        observacoes: ''
      })
      
      setEditingVisita(null)
      setShowForm(false)
      carregarVisitas()
      onRefresh()
      alert('Visita salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar visita:', error)
      alert('Erro ao salvar visita: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function deletarVisita(id) {
    if (!confirm('Tem certeza que deseja excluir esta visita?')) return

    try {
      const { error } = await supabase
        .from('visitas')
        .delete()
        .eq('id', id)

      if (error) throw error

      carregarVisitas()
      onRefresh()
      alert('Visita excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir visita:', error)
      alert('Erro ao excluir visita')
    }
  }

  // FUNÇÕES PARA OS 3 ESTADOS
  async function marcarComoFechada(id) {
    if (!confirm('Marcar como CONTRATO FECHADO?\n\n✅ Cliente fechou serviço')) return

    try {
      const { error } = await supabase
        .from('visitas')
        .update({ 
          fechou_contrato: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      carregarVisitas()
      onRefresh()
      alert('✅ Marcado como CONTRATO FECHADO!')
    } catch (error) {
      console.error('Erro ao marcar como fechado:', error)
      alert('Erro ao atualizar visita')
    }
  }

  async function marcarComoNaoFechou(id) {
    if (!confirm('Marcar como NÃO FECHOU?\n\n❌ Visitou mas não fechou contrato')) return

    try {
      const { error } = await supabase
        .from('visitas')
        .update({ 
          fechou_contrato: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      carregarVisitas()
      onRefresh()
      alert('❌ Marcado como NÃO FECHOU!')
    } catch (error) {
      console.error('Erro ao marcar como não fechou:', error)
      alert('Erro ao atualizar visita')
    }
  }

  async function voltarParaAberto(id) {
    if (!confirm('Voltar para EM ABERTO?\n\n⏳ Remover resposta')) return

    try {
      const { error } = await supabase
        .from('visitas')
        .update({ 
          fechou_contrato: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      carregarVisitas()
      onRefresh()
      alert('⏳ Visita voltou para EM ABERTO!')
    } catch (error) {
      console.error('Erro ao voltar para aberto:', error)
      alert('Erro ao atualizar visita')
    }
  }

  function editarVisita(visita) {
    setForm({
      cliente_nome: visita.cliente_nome || '',
      contato: visita.contato || '',
      data_visita: visita.data_visita || new Date().toISOString().split('T')[0],
      observacoes: visita.observacoes || ''
    })
    setEditingVisita(visita)
    setShowForm(true)
  }

  function formatarTelefone(contato) {
    if (!contato) return ''
    const nums = contato.replace(/\D/g, '')
    
    if (nums.length === 11) {
      return `(${nums.substring(0,2)}) ${nums.substring(2,7)}-${nums.substring(7)}`
    } else if (nums.length === 10) {
      return `(${nums.substring(0,2)}) ${nums.substring(2,6)}-${nums.substring(6)}`
    }
    return contato
  }

  function formatarData(data) {
    if (!data) return ''
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function getContatoIcon(contato) {
    if (!contato) return '📱'
    if (contato.includes('@')) return '📧'
    if (/\d/.test(contato)) return '📞'
    return '📱'
  }

  function getStatusVisita(visita) {
    if (visita.fechou_contrato === true) {
      return { texto: '✅ Contrato Fechado', classe: 'status-fechado', icone: '✅' }
    } else if (visita.fechou_contrato === false) {
      return { texto: '❌ Não Fechou', classe: 'status-nao-fechou', icone: '❌' }
    } else {
      return { texto: '⏳ Em aberto', classe: 'status-aberto', icone: '⏳' }
    }
  }

  // Calcular estatísticas
  const stats = {
    total: visitas.length,
    fechadas: visitas.filter(v => v.fechou_contrato === true).length,
    nao_fechou: visitas.filter(v => v.fechou_contrato === false).length,
    abertas: visitas.filter(v => v.fechou_contrato === null).length,
    hoje: visitas.filter(v => v.data_visita === new Date().toISOString().split('T')[0]).length,
    taxaConversao: visitas.length > 0 ? 
      ((visitas.filter(v => v.fechou_contrato === true).length / visitas.length) * 100).toFixed(1) : 0
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content visitas-modal">
        <div className="modal-header">
          <h2>👥 Visitas</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="visitas-stats">
          <div className="visita-stat">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="visita-stat">
            <div className="stat-number">{stats.fechadas}</div>
            <div className="stat-label">Fechadas</div>
          </div>
          <div className="visita-stat">
            <div className="stat-number">{stats.nao_fechou}</div>
            <div className="stat-label">Não Fechou</div>
          </div>
          <div className="visita-stat">
            <div className="stat-number">{stats.taxaConversao}%</div>
            <div className="stat-label">Conversão</div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="modal-actions">
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            ➕ Nova Visita
          </button>
          <button 
            onClick={carregarVisitas}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? '🔄' : '🔄'} Atualizar
          </button>
        </div>

        {/* FORMULÁRIO */}
        {showForm && (
          <form onSubmit={salvarVisita} className="visita-form">
            <h3>{editingVisita ? 'Editar Visita' : 'Nova Visita'}</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Nome do Cliente *</label>
                <input
                  type="text"
                  value={form.cliente_nome}
                  onChange={e => setForm({...form, cliente_nome: e.target.value})}
                  required
                  placeholder="Nome completo"
                />
              </div>

              <div className="form-group">
                <label>Contato (Telefone ou Email)</label>
                <input
                  type="text"
                  value={form.contato}
                  onChange={e => setForm({...form, contato: e.target.value})}
                  placeholder="(11) 99999-9999 ou email@exemplo.com"
                />
              </div>

              <div className="form-group">
                <label>Data da Visita *</label>
                <input
                  type="date"
                  value={form.data_visita}
                  onChange={e => setForm({...form, data_visita: e.target.value})}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({...form, observacoes: e.target.value})}
                  placeholder="Detalhes da visita..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (editingVisita ? 'Atualizar' : 'Salvar')}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false)
                  setEditingVisita(null)
                  setForm({
                    cliente_nome: '',
                    contato: '',
                    data_visita: new Date().toISOString().split('T')[0],
                    observacoes: ''
                  })
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* LISTA DE VISITAS */}
        {!showForm && (
          <div className="visitas-list">
            <div className="list-header">
              <h3>Visitas ({visitas.length})</h3>
              <div className="list-filters">
                <span className="filter-info">
                  {stats.abertas} em aberto • {stats.fechadas} fechadas • {stats.nao_fechou} não fechou
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">Carregando visitas...</div>
            ) : visitas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>Nenhuma visita cadastrada</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  ➕ Criar Primeira Visita
                </button>
              </div>
            ) : (
              <div className="visitas-cards">
                {visitas.map(visita => {
                  const hoje = new Date().toISOString().split('T')[0]
                  const isHoje = visita.data_visita === hoje
                  const status = getStatusVisita(visita)
                  
                  return (
                    <div 
                      key={visita.id} 
                      className={`visita-card-item ${isHoje ? 'hoje' : ''} ${status.classe}`}
                    >
                      <div className="visita-card-header">
                        <div className="visita-card-cliente">
                          <strong>{visita.cliente_nome}</strong>
                          {visita.contato && (
                            <div className="visita-contato">
                              {getContatoIcon(visita.contato)} {formatarTelefone(visita.contato)}
                            </div>
                          )}
                        </div>
                        <div className="visita-card-data">
                          {formatarData(visita.data_visita)}
                          {isHoje && <span className="badge-hoje">HOJE</span>}
                        </div>
                      </div>
                      
                      {visita.observacoes && (
                        <div className="visita-observacoes">
                          {visita.observacoes}
                        </div>
                      )}
                      
                      <div className="visita-card-status">
                        <div className={status.classe}>
                          <span className="status-icon">{status.icone}</span>
                          <span className="status-text">{status.texto}</span>
                        </div>
                      </div>
                      
                      <div className="visita-card-actions">
                        <button 
                          onClick={() => editarVisita(visita)}
                          className="action-btn edit"
                          title="Editar dados"
                        >
                          ✏️
                        </button>
                        
                        {/* BOTÕES DE STATUS */}
                        {visita.fechou_contrato === null ? (
                          // EM ABERTO: pode marcar como FECHADO ou NÃO FECHOU
                          <>
                            <button 
                              onClick={() => marcarComoFechada(visita.id)}
                              className="action-btn success"
                              title="✅ Contrato Fechado"
                            >
                              ✅
                            </button>
                            <button 
                              onClick={() => marcarComoNaoFechou(visita.id)}
                              className="action-btn danger"
                              title="❌ Não Fechou"
                            >
                              ❌
                            </button>
                          </>
                        ) : (
                          // JÁ RESPONDIDO (true ou false): pode voltar para EM ABERTO
                          <button 
                            onClick={() => voltarParaAberto(visita.id)}
                            className="action-btn warning"
                            title="⏳ Voltar para Em Aberto"
                          >
                            ⏳
                          </button>
                        )}
                        
                        <button 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta visita?')) {
                              deletarVisita(visita.id)
                            }
                          }}
                          className="action-btn delete"
                          title="🗑️ Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VisitasModal