// src/components/ServiceForm.jsx - VERSÃO COMPLETA E CORRIGIDA
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import ClientSelector from './ClientSelector.jsx'
import Modal from './Modal.jsx'
import ProfissionalCadastro from './ProfissionalCadastro.jsx'
import './ServiceForm.css'

export function ServiceForm({ onSuccess, user }) {
  const [servicos, setServicos] = useState([])
  const [profissionais, setProfissionais] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loadingProfissionais, setLoadingProfissionais] = useState(true)
  const [loadingServicos, setLoadingServicos] = useState(true)
  
  // Estados para os modais
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [showServicoModal, setShowServicoModal] = useState(false)
  const [showProfissionalModal, setShowProfissionalModal] = useState(false)
  
  // Formulário principal
  const [form, setForm] = useState({
    cliente_id: '',
    servico_id: '',
    profissional_id: '',
    tipo: 'salao',
    data: new Date().toISOString().split('T')[0],
    observacao: ''
  })

  // Formulário para novo cliente
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    telefone: ''
  })

  // Formulário para novo serviço
  const [novoServico, setNovoServico] = useState({
    nome: '',
    comissao_salao: '',
    comissao_indicacao: ''
  })

  useEffect(() => {
    loadServicos()
    loadProfissionais()
  }, [])

  async function loadServicos() {
    setLoadingServicos(true)
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome')
      
      if (error) {
        console.error('Erro ao buscar serviços:', error)
        return
      }
      
      setServicos(data || [])
    } catch (err) {
      console.error('Erro no carregamento de serviços:', err)
    } finally {
      setLoadingServicos(false)
    }
  }

  async function loadProfissionais() {
    setLoadingProfissionais(true)
    try {
      const { data: profissionaisData, error } = await supabase
        .from('profissionais')
        .select('id, nome, ativo')
        .eq('ativo', true)
        .order('nome')
      
      if (error) {
        console.error('Erro ao buscar profissionais:', error)
        return
      }
      
      console.log('Profissionais carregados:', profissionaisData)
      setProfissionais(profissionaisData || [])
      
      // Se não houver profissional selecionado e houver profissionais, seleciona o primeiro
      if (!form.profissional_id && profissionaisData && profissionaisData.length > 0) {
        setForm(prev => ({ ...prev, profissional_id: profissionaisData[0].id }))
      }
    } catch (err) {
      console.error('Erro no carregamento de profissionais:', err)
    } finally {
      setLoadingProfissionais(false)
    }
  }

  const servicoSelecionado = servicos.find(s => s.id === form.servico_id)
  const profissionalSelecionado = profissionais.find(p => p.id === form.profissional_id)
  
  const valor = servicoSelecionado 
    ? form.tipo === 'salao' 
      ? servicoSelecionado.comissao_salao
      : servicoSelecionado.comissao_indicacao
    : 0

  const diferenca = servicoSelecionado 
    ? servicoSelecionado.comissao_indicacao - servicoSelecionado.comissao_salao
    : 0

  // Função para cadastrar novo cliente
  async function cadastrarCliente() {
    if (!novoCliente.nome.trim()) {
      alert('Nome do cliente é obrigatório!')
      return
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: novoCliente.nome,
          telefone: novoCliente.telefone || null
        })
        .select()
      
      if (error) throw error

      if (data && data[0]) {
        setForm({ ...form, cliente_id: data[0].id })
        setNovoCliente({ nome: '', telefone: '' })
        setShowClienteModal(false)
        alert('Cliente cadastrado com sucesso!')
      }
    } catch (error) {
      alert('Erro ao cadastrar cliente: ' + error.message)
      console.error('Erro detalhado:', error)
    }
  }

  // Função para cadastrar novo serviço
  async function cadastrarServico() {
    if (!novoServico.nome.trim()) {
      alert('Nome do serviço é obrigatório!')
      return
    }

    if (!novoServico.comissao_salao || !novoServico.comissao_indicacao) {
      alert('Preencha os valores de comissão!')
      return
    }

    try {
      const { data, error } = await supabase
        .from('servicos')
        .insert({
          nome: novoServico.nome,
          comissao_salao: parseFloat(novoServico.comissao_salao),
          comissao_indicacao: parseFloat(novoServico.comissao_indicacao)
        })
        .select()
      
      if (error) throw error

      if (data && data[0]) {
        await loadServicos()
        setForm({ ...form, servico_id: data[0].id })
        setNovoServico({ nome: '', comissao_salao: '', comissao_indicacao: '' })
        setShowServicoModal(false)
        alert('Serviço cadastrado com sucesso!')
      }
    } catch (error) {
      alert('Erro ao cadastrar serviço: ' + error.message)
      console.error('Erro detalhado:', error)
    }
  }

  // Função para recarregar profissionais após cadastro
  const handleProfissionalCadastrado = () => {
    loadProfissionais()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!form.cliente_id || !form.servico_id || !form.profissional_id) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: form.cliente_id,
          servico_id: form.servico_id,
          profissional_id: form.profissional_id,
          tipo: form.tipo,
          data: form.data,
          valor: valor,
          status: 'agendado',
          observacao: form.observacao.trim()
        })
      
      if (error) throw error
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      
      setForm({
        ...form,
        cliente_id: '',
        servico_id: '',
        observacao: ''
      })
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000)
      }
      
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
      console.error('Erro detalhado:', error)
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

      {/* MODAL CADASTRO PROFISSIONAL */}
      <ProfissionalCadastro 
        isOpen={showProfissionalModal}
        onClose={() => setShowProfissionalModal(false)}
        onSuccess={handleProfissionalCadastrado}
      />

      {/* MODAL CADASTRO CLIENTE */}
      <Modal 
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        title="Cadastrar Novo Cliente"
      >
        <div className="modal-form">
          <div className="modal-field">
            <label>Nome *</label>
            <input
              type="text"
              value={novoCliente.nome}
              onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})}
              placeholder="Nome completo"
              className="modal-input"
              required
            />
          </div>
          
          <div className="modal-field">
            <label>Telefone</label>
            <input
              type="tel"
              value={novoCliente.telefone}
              onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})}
              placeholder="(11) 99999-9999"
              className="modal-input"
            />
          </div>
          
          <div className="modal-actions">
            <button
              onClick={cadastrarCliente}
              className="modal-submit-button"
            >
              <span className="modal-submit-icon">✓</span>
              Cadastrar Cliente
            </button>
            
            <button
              onClick={() => setShowClienteModal(false)}
              className="modal-cancel-button"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL CADASTRO SERVIÇO */}
      <Modal 
        isOpen={showServicoModal}
        onClose={() => setShowServicoModal(false)}
        title="Cadastrar Novo Serviço"
      >
        <div className="modal-form">
          <div className="modal-field">
            <label>Nome do Serviço *</label>
            <input
              type="text"
              value={novoServico.nome}
              onChange={e => setNovoServico({...novoServico, nome: e.target.value})}
              placeholder="Ex: Corte Masculino, Luzes, Progressiva"
              className="modal-input"
              required
            />
          </div>
          
          <div className="modal-field">
            <label>Comissão Salão (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={novoServico.comissao_salao}
              onChange={e => setNovoServico({...novoServico, comissao_salao: e.target.value})}
              placeholder="0.00"
              className="modal-input"
              required
            />
          </div>
          
          <div className="modal-field">
            <label>Comissão Indicação (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={novoServico.comissao_indicacao}
              onChange={e => setNovoServico({...novoServico, comissao_indicacao: e.target.value})}
              placeholder="0.00"
              className="modal-input"
              required
            />
          </div>
          
          {novoServico.comissao_salao && novoServico.comissao_indicacao && (
            <div className="comissao-diferenca">
              <span className="diferenca-icon">📈</span>
              <span className="diferenca-text">
                Indicação paga <strong>R$ {(parseFloat(novoServico.comissao_indicacao) - parseFloat(novoServico.comissao_salao)).toFixed(2)} a mais</strong>
              </span>
            </div>
          )}
          
          <div className="modal-actions">
            <button
              onClick={cadastrarServico}
              className="modal-submit-button"
            >
              <span className="modal-submit-icon">➕</span>
              Cadastrar Serviço
            </button>
            
            <button
              onClick={() => setShowServicoModal(false)}
              className="modal-cancel-button"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* FORMULÁRIO PRINCIPAL */}
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

          {/* PROFISSIONAL */}
          <div className="service-form-field-group">
            <div className="field-header-with-action">
              <label className="service-form-label">
                <span className="service-form-label-icon">👨‍💼</span>
                Profissional *
              </label>
              <button
                type="button"
                onClick={() => setShowProfissionalModal(true)}
                className="add-new-button"
              >
                <span className="add-icon">➕</span>
                <span className="add-text">Novo Profissional</span>
              </button>
            </div>
            
            {loadingProfissionais ? (
              <div className="loading-select">
                <span className="loading-spinner-small">⏳</span>
                Carregando profissionais...
              </div>
            ) : (
              <>
                <select
                  value={form.profissional_id}
                  onChange={e => setForm({...form, profissional_id: e.target.value})}
                  className="service-form-select"
                  required
                >
                  <option value="">Selecione o profissional...</option>
                  {profissionais.map(profissional => (
                    <option key={profissional.id} value={profissional.id}>
                      {profissional.nome}
                    </option>
                  ))}
                </select>
                
                {profissionais.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon">👨‍💼</span>
                    <span className="empty-text">Nenhum profissional cadastrado</span>
                    <span className="empty-hint">
                      Clique em "Novo Profissional" para cadastrar
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CLIENTE */}
          <div className="service-form-field-group">
            <div className="field-header-with-action">
              <label className="service-form-label">
                <span className="service-form-label-icon">👤</span>
                Cliente *
              </label>
              <button
                type="button"
                onClick={() => setShowClienteModal(true)}
                className="add-new-button"
              >
                <span className="add-icon">➕</span>
                <span className="add-text">Novo Cliente</span>
              </button>
            </div>
            
            <ClientSelector
              onSelect={(clienteId) => setForm({...form, cliente_id: clienteId})}
              value={form.cliente_id}
              required={true}
            />
          </div>

          {/* SERVIÇO */}
          <div className="service-form-field-group">
            <div className="field-header-with-action">
              <label className="service-form-label">
                <span className="service-form-label-icon">💇</span>
                Serviço *
              </label>
              <button
                type="button"
                onClick={() => setShowServicoModal(true)}
                className="add-new-button"
              >
                <span className="add-icon">➕</span>
                <span className="add-text">Novo Serviço</span>
              </button>
            </div>
            
            {loadingServicos ? (
              <div className="loading-select">
                <span className="loading-spinner-small">⏳</span>
                Carregando serviços...
              </div>
            ) : (
              <>
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
                
                {servicos.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon">💇</span>
                    <span className="empty-text">Nenhum serviço cadastrado</span>
                    <span className="empty-hint">
                      Clique em "Novo Serviço" para cadastrar
                    </span>
                  </div>
                )}
              </>
            )}
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
                      ? `R$ ${servicoSelecionado.comissao_salao.toFixed(2)}`
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
                      ? `R$ ${servicoSelecionado.comissao_indicacao.toFixed(2)}`
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
                  {profissionalSelecionado && (
                    <div className="profissional-info">
                      <span className="profissional-icon">👨‍💼</span>
                      <span>{profissionalSelecionado.nome}</span>
                    </div>
                  )}
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

          {/* BOTÕES DE AÇÃO */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || !form.cliente_id || !form.servico_id || !form.profissional_id}
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
                  ...form,
                  cliente_id: '',
                  servico_id: '',
                  observacao: ''
                })
              }}
              className="form-clear-button"
            >
              <span className="clear-icon">🗑️</span>
              <span className="clear-text">Limpar Campos</span>
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
              <div className="tip-title">Cadastro rápido</div>
              <div className="tip-text">
                Cadastre profissionais, clientes e serviços na hora
              </div>
            </div>
          </div>
       
          <div className="tip-card">
            <div className="tip-icon">💰</div>
            <div className="tip-content">
              <div className="tip-title">Comissões</div>
              <div className="tip-text">
                Indicação sempre paga mais que salão
              </div>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-icon">👨‍💼</div>
            <div className="tip-content">
              <div className="tip-title">Profissional</div>
              <div className="tip-text">
                Selecione quem realizará o atendimento
              </div>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-icon">📱</div>
            <div className="tip-content">
              <div className="tip-title">Prático</div>
              <div className="tip-text">
                Tudo feito direto pelo celular
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceForm