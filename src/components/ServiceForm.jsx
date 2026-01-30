// src/components/ServiceForm.jsx - VERSÃO ATUALIZADA
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import ClientSelector from './ClientSelector.jsx'
import './ServiceForm.css'

export function ServiceForm({ onSuccess }) {
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [form, setForm] = useState({
    cliente_id: '',
    servico_id: '',
    tipo: 'salao',
    data: new Date().toISOString().split('T')[0],
    observacao: ''
  })

  useEffect(() => {
    loadServicos()
  }, [])

  async function loadServicos() {
    const { data } = await supabase
      .from('servicos')
      .select('*')
      .order('nome')
    setServicos(data || [])
  }

  const servicoSelecionado = servicos.find(s => s.id === form.servico_id)
  const valor = servicoSelecionado 
    ? form.tipo === 'salao' 
      ? servicoSelecionado.comissao_salao
      : servicoSelecionado.comissao_indicacao
    : 0

  const diferenca = servicoSelecionado 
    ? servicoSelecionado.comissao_indicacao - servicoSelecionado.comissao_salao
    : 0

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!form.cliente_id || !form.servico_id) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_id: form.cliente_id,
          servico_id: form.servico_id,
          tipo: form.tipo,
          data: form.data,
          valor: valor,
          status: 'agendado',
          observacao: form.observacao.trim()
        }])
      
      if (error) throw error
      
      // Mostrar animação de sucesso
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      
      // Limpar formulário
      setForm({
        ...form,
        cliente_id: '',
        servico_id: '',
        observacao: ''
      })
      
      // Chamar callback de sucesso se existir
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000)
      }
      
      // Recarregar serviços (caso tenha algum cache)
      loadServicos()
      
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const dataFormatada = new Date(form.data).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="service-form-page">
      {/* ANIMAÇÃO DE SUCESSO */}
      {showSuccess && (
        <div className="service-form-success-overlay">
          <div className="service-form-success-message">
            <div className="service-form-success-icon">✨</div>
            <div className="service-form-success-text">Atendimento salvo com sucesso!</div>
          </div>
        </div>
      )}

      {/* FORMULÁRIO */}
      <div className="service-form-container animate-slide-up">
        <div className="form-header-info">
          <div className="form-date-display">
            <span className="date-icon">📅</span>
            <span className="date-text">{dataFormatada}</span>
          </div>
          <div className="form-instructions">
            <span className="instruction-icon">💡</span>
            <span>Preencha todos os campos obrigatórios (*)</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          {/* DATA */}
          <div className="service-form-field-group">
            <label className="service-form-label">
              <span className="service-form-label-icon">📅</span>
              Data do Atendimento *
            </label>
            <input
              type="date"
              value={form.data}
              onChange={e => setForm({...form, data: e.target.value})}
              className="service-form-input"
              required
            />
            <div className="date-preview">
              {dataFormatada}
            </div>
          </div>

          {/* CLIENTE */}
          <div className="service-form-field-group">
            <label className="service-form-label">
              <span className="service-form-label-icon">👤</span>
              Cliente *
            </label>
            <ClientSelector
              onSelect={(clienteId) => setForm({...form, cliente_id: clienteId})}
              value={form.cliente_id}
              required={true}
            />
          </div>

          {/* SERVIÇO */}
          <div className="service-form-field-group">
            <label className="service-form-label">
              <span className="service-form-label-icon">💇</span>
              Serviço *
            </label>
            <select
              value={form.servico_id}
              onChange={e => setForm({...form, servico_id: e.target.value})}
              className="service-form-select"
              required
            >
              <option value="">Selecione um serviço...</option>
              {servicos.map(servico => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome} 
                  {servico.comissao_salao && servico.comissao_indicacao && 
                    ` (💈 R$${servico.comissao_salao} | 👥 R$${servico.comissao_indicacao})`
                  }
                </option>
              ))}
            </select>
          </div>

          {/* TIPO DE COMISSÃO */}
          <div className="service-form-field-group">
            <label className="service-form-label">
              <span className="service-form-label-icon">💰</span>
              Tipo de Comissão *
            </label>
            <div className="service-form-tipo-container">
              <button
                type="button"
                onClick={() => setForm({...form, tipo: 'salao'})}
                className={`service-form-tipo-button ${form.tipo === 'salao' ? 'service-form-tipo-button-active-salao' : ''}`}
              >
                <div className="service-form-tipo-icon">💈</div>
                <div className="service-form-tipo-content">
                  <div className="service-form-tipo-title">Salão</div>
                  <div className="service-form-tipo-value">
                    {servicoSelecionado 
                      ? `R$ ${servicoSelecionado.comissao_salao}`
                      : '--'
                    }
                  </div>
                </div>
                {form.tipo === 'salao' && (
                  <div className="service-form-selected-dot" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setForm({...form, tipo: 'indicacao'})}
                className={`service-form-tipo-button ${form.tipo === 'indicacao' ? 'service-form-tipo-button-active-indicacao' : ''}`}
              >
                <div className="service-form-tipo-icon">👥</div>
                <div className="service-form-tipo-content">
                  <div className="service-form-tipo-title">Indicação</div>
                  <div className="service-form-tipo-value">
                    {servicoSelecionado 
                      ? `R$ ${servicoSelecionado.comissao_indicacao}`
                      : '--'
                    }
                  </div>
                </div>
                {form.tipo === 'indicacao' && (
                  <div className="service-form-selected-dot" />
                )}
              </button>
            </div>

            {diferenca > 0 && (
              <div className="diferenca-info">
                <span className="diferenca-icon">📈</span>
                <span className="diferenca-text">
                  Indicação paga <strong>R$ {diferenca.toFixed(2)} a mais</strong>
                </span>
              </div>
            )}
          </div>

          {/* VALOR CALCULADO */}
          {servicoSelecionado && (
            <div className="service-form-valor-container">
              <div className="service-form-valor-header">
                <div className="service-form-valor-icon">💵</div>
                <div>
                  <div className="service-form-valor-label">Valor a Receber</div>
                  <div className="service-form-valor-subtitle">
                    {form.tipo === 'salao' ? 'Comissão Salão' : 'Comissão por Indicação'}
                  </div>
                </div>
              </div>
              <div className="service-form-valor-principal">R$ {valor.toFixed(2)}</div>
            </div>
          )}

          {/* OBSERVAÇÃO */}
          <div className="service-form-field-group">
            <label className="service-form-label">
              <span className="service-form-label-icon">📝</span>
              Observação (opcional)
            </label>
            <textarea
              value={form.observacao}
              onChange={e => setForm({...form, observacao: e.target.value})}
              placeholder="Ex: Cliente vai trazer o próprio produto, preferências, alergias, etc."
              className="service-form-textarea"
              rows="3"
            />
          </div>

          {/* BOTÃO SALVAR */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || !form.cliente_id || !form.servico_id}
              className="service-form-submit-button"
            >
              {loading ? (
                <>
                  <span className="submit-spinner">⏳</span>
                  <span className="submit-text">Salvando...</span>
                </>
              ) : (
                <>
                  <span className="submit-icon">💾</span>
                  <span className="submit-text">Salvar Atendimento</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setForm({
                  cliente_id: '',
                  servico_id: '',
                  tipo: 'salao',
                  data: new Date().toISOString().split('T')[0],
                  observacao: ''
                })
              }}
              className="form-clear-button"
            >
              <span className="clear-icon">🗑️</span>
              <span className="clear-text">Limpar</span>
            </button>
          </div>
        </form>
      </div>

        {/* DICAS RÁPIDAS */}
        <div className="service-form-tips">
          <h3 className="tips-title">💡 Dicas Rápidas</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🚀</div>
              <div className="tip-content">
                <div className="tip-title">Cadastre rápido</div>
                <div className="tip-text">
                  Use o autocomplete de clientes para agilizar
                </div>
              </div>
            </div>
         
            <div className="tip-card">
              <div className="tip-icon">⏰</div>
              <div className="tip-content">
                <div className="tip-title">Horário certo</div>
                <div className="tip-text">
                  Fechamento diário às 21h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
}

export default ServiceForm