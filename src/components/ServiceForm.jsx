// src/components/ServiceForm.jsx - VERSÃO CORRIGIDA E MELHORADA
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
  
  // CORREÇÃO DA DATA: Função para obter data atual correta
  const getTodayDate = () => {
    const now = new Date()
    // Ajusta para o fuso horário de Brasília (UTC-3)
    const offset = -3 * 60 // UTC-3 em minutos
    const localTime = new Date(now.getTime() + offset * 60000)
    return localTime.toISOString().split('T')[0]
  }

  // Formulário principal
  const [form, setForm] = useState({
    cliente_id: '',
    servico_id: '',
    profissional_id: '',
    tipo: 'salao',
    data: getTodayDate(), // Usa função corrigida
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
        alert('✅ Cliente cadastrado com sucesso!')
      }
    } catch (error) {
      alert('❌ Erro ao cadastrar cliente: ' + error.message)
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
        alert('✅ Serviço cadastrado com sucesso!')
      }
    } catch (error) {
      alert('❌ Erro ao cadastrar serviço: ' + error.message)
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
      alert('⚠️ Preencha todos os campos obrigatórios!')
      return
    }

    setLoading(true)
    
    try {
      // CORREÇÃO: Garante que a data será enviada corretamente
      const dataFormatada = new Date(form.data)
      const dataCorrigida = dataFormatada.toISOString().split('T')[0]
      
      const { error } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: form.cliente_id,
          servico_id: form.servico_id,
          profissional_id: form.profissional_id,
          tipo: form.tipo,
          data: dataCorrigida, // Usa data corrigida
          valor: valor,
          status: 'agendado',
          observacao: form.observacao.trim()
        })
      
      if (error) throw error
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      
      // Limpa apenas alguns campos, mantendo data e profissional
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
      alert('❌ Erro ao salvar: ' + error.message)
      console.error('Erro detalhado:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar data corretamente
  const formatarDataExibicao = (dateString) => {
    try {
      const data = new Date(dateString)
      // Ajusta para o fuso horário local
      const dataAjustada = new Date(data.getTime() + data.getTimezoneOffset() * 60000)
      return dataAjustada.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    } catch (e) {
      return dateString
    }
  }

  const dataFormatada = formatarDataExibicao(form.data)

  return (
    <div className="service-form-page">
      {/* ANIMAÇÃO DE SUCESSO */}
      {showSuccess && (
        <div className="service-form-success-overlay animate-fade-in">
          <div className="service-form-success-message animate-slide-down">
            <div className="service-form-success-icon">✨</div>
            <div className="service-form-success-text">Atendimento salvo com sucesso!</div>
            <div className="service-form-success-subtext">📅 {dataFormatada}</div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO PROFISSIONAL */}
      <ProfissionalCadastro 
        isOpen={showProfissionalModal}
        onClose={() => setShowProfissionalModal(false)}
        onSuccess={handleProfissionalCadastrado}
      />

      {/* MODAL CADASTRO SERVIÇO */}
      <Modal 
        isOpen={showServicoModal}
        onClose={() => setShowServicoModal(false)}
        title="💇 Cadastrar Novo Serviço"
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
              autoFocus
            />
          </div>
          
          <div className="modal-comissao-group">
            <div className="modal-comissao-field">
              <label>
                <span className="comissao-icon">💈</span>
                Comissão Salão (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={novoServico.comissao_salao}
                onChange={e => setNovoServico({...novoServico, comissao_salao: e.target.value})}
                placeholder="0.00"
                className="modal-input comissao-input"
                required
              />
            </div>
            
            <div className="modal-comissao-field">
              <label>
                <span className="comissao-icon">👥</span>
                Comissão Indicação (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={novoServico.comissao_indicacao}
                onChange={e => setNovoServico({...novoServico, comissao_indicacao: e.target.value})}
                placeholder="0.00"
                className="modal-input comissao-input"
                required
              />
            </div>
          </div>
          
          {novoServico.comissao_salao && novoServico.comissao_indicacao && (
            <div className="comissao-diferenca-card">
              <div className="comissao-diferenca-header">
                <span className="diferenca-icon">📈</span>
                <span className="diferenca-title">Diferença de Comissão</span>
              </div>
              <div className="comissao-diferenca-valor">
                Indicação paga <strong>R$ {(parseFloat(novoServico.comissao_indicacao) - parseFloat(novoServico.comissao_salao)).toFixed(2)} a mais</strong>
              </div>
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
      <div className="service-form-container">
        <div className="form-header-card">
          <div className="form-header-content">
            <h1 className="form-title">📋 Novo Atendimento</h1>
            <div className="form-date-info">
              <span className="date-icon">📅</span>
              <span className="date-text">{dataFormatada}</span>
            </div>
          </div>
          <div className="form-header-tip">
            <span className="tip-icon">💡</span>
            <span>Preencha todos os campos com *</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          {/* DATA E PROFISSIONAL EM LINHA */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">
                <span className="form-label-icon">📅</span>
                Data *
              </label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm({...form, data: e.target.value})}
                className="form-input"
                required
                title="Data do agendamento"
              />
              <div className="date-hint">Selecionada: {dataFormatada}</div>
            </div>

            <div className="form-field">
              <div className="field-header">
                <label className="form-label">
                  <span className="form-label-icon">👨‍💼</span>
                  Profissional *
                </label>
                <button
                  type="button"
                  onClick={() => setShowProfissionalModal(true)}
                  className="add-new-small"
                  title="Cadastrar novo profissional"
                >
                  +
                </button>
              </div>
              
              {loadingProfissionais ? (
                <div className="loading-state">
                  <span className="loading-spinner">⏳</span>
                  Carregando...
                </div>
              ) : (
                <select
                  value={form.profissional_id}
                  onChange={e => setForm({...form, profissional_id: e.target.value})}
                  className="form-select"
                  required
                >
                  <option value="">Selecione...</option>
                  {profissionais.map(profissional => (
                    <option key={profissional.id} value={profissional.id}>
                      {profissional.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* CLIENTE */}
          <div className="form-field-group">
            <div className="field-header-with-action">
              <button
                type="button"
                onClick={() => setShowClienteModal(true)}
                className="add-new-button"
              >
                <span className="add-icon">➕</span>
                Novo Cliente
              </button>
            </div>
            
            <ClientSelector
              onSelect={(clienteId) => setForm({...form, cliente_id: clienteId})}
              value={form.cliente_id}
              required={true}
            />
          </div>

          {/* SERVIÇO */}
          <div className="form-field-group">
            <div className="field-header-with-action">
              <label className="form-label">
                <span className="form-label-icon">💇</span>
                Serviço *
              </label>
              <button
                type="button"
                onClick={() => setShowServicoModal(true)}
                className="add-new-button"
              >
                <span className="add-icon">➕</span>
                Novo Serviço
              </button>
            </div>
            
            {loadingServicos ? (
              <div className="loading-state">
                <span className="loading-spinner">⏳</span>
                Carregando serviços...
              </div>
            ) : (
              <select
                value={form.servico_id}
                onChange={e => setForm({...form, servico_id: e.target.value})}
                className="form-select"
                required
              >
                <option value="">Selecione um serviço...</option>
                {servicos.map(servico => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome} 
                    {servico.comissao_salao && servico.comissao_indicacao && 
                      ` | 💈 R$${servico.comissao_salao} | 👥 R$${servico.comissao_indicacao}`
                    }
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* TIPO DE COMISSÃO */}
          <div className="form-field-group">
            <label className="form-label">
              <span className="form-label-icon">💰</span>
              Tipo de Comissão *
            </label>
            <div className="comissao-cards">
              <button
                type="button"
                onClick={() => setForm({...form, tipo: 'salao'})}
                className={`comissao-card ${form.tipo === 'salao' ? 'comissao-card-active' : ''} ${form.tipo === 'salao' ? 'comissao-card-salao' : ''}`}
              >
                <div className="comissao-card-icon">💈</div>
                <div className="comissao-card-content">
                  <div className="comissao-card-title">Salão</div>
                  <div className="comissao-card-value">
                    {servicoSelecionado 
                      ? `R$ ${servicoSelecionado.comissao_salao.toFixed(2)}`
                      : '--'
                    }
                  </div>
                </div>
                {form.tipo === 'salao' && (
                  <div className="comissao-card-check">✓</div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setForm({...form, tipo: 'indicacao'})}
                className={`comissao-card ${form.tipo === 'indicacao' ? 'comissao-card-active' : ''} ${form.tipo === 'indicacao' ? 'comissao-card-indicacao' : ''}`}
              >
                <div className="comissao-card-icon">👥</div>
                <div className="comissao-card-content">
                  <div className="comissao-card-title">Indicação</div>
                  <div className="comissao-card-value">
                    {servicoSelecionado 
                      ? `R$ ${servicoSelecionado.comissao_indicacao.toFixed(2)}`
                      : '--'
                    }
                  </div>
                </div>
                {form.tipo === 'indicacao' && (
                  <div className="comissao-card-check">✓</div>
                )}
              </button>
            </div>

            {diferenca > 0 && (
              <div className="comissao-diferenca-info">
                <span className="diferenca-icon">📈</span>
                <span className="diferenca-text">
                  Indicação paga <strong>R$ {diferenca.toFixed(2)} a mais</strong>
                </span>
              </div>
            )}
          </div>

          {/* RESUMO FINANCEIRO */}
          {servicoSelecionado && (
            <div className="resumo-financeiro-card">
              <div className="resumo-header">
                <div className="resumo-icon">💰</div>
                <div className="resumo-title">Resumo do Atendimento</div>
              </div>
              
              <div className="resumo-content">
                <div className="resumo-item">
                  <span className="resumo-label">Cliente:</span>
                  <span className="resumo-value">{form.cliente_id ? 'Selecionado' : '--'}</span>
                </div>
                
                <div className="resumo-item">
                  <span className="resumo-label">Profissional:</span>
                  <span className="resumo-value">
                    {profissionalSelecionado ? profissionalSelecionado.nome : '--'}
                  </span>
                </div>
                
                <div className="resumo-item">
                  <span className="resumo-label">Tipo:</span>
                  <span className="resumo-value">
                    {form.tipo === 'salao' ? '💈 Salão' : '👥 Indicação'}
                  </span>
                </div>
                
                <div className="resumo-valor-total">
                  <span className="valor-total-label">Valor a Receber:</span>
                  <span className="valor-total">R$ {valor.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* OBSERVAÇÃO */}
          <div className="form-field-group">
            <label className="form-label">
              <span className="form-label-icon">📝</span>
              Observação (opcional)
            </label>
            <textarea
              value={form.observacao}
              onChange={e => setForm({...form, observacao: e.target.value})}
              placeholder="Ex: Cliente vai trazer o próprio produto, preferências, alergias, etc."
              className="form-textarea"
              rows="3"
            />
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || !form.cliente_id || !form.servico_id || !form.profissional_id}
              className="submit-button"
            >
              {loading ? (
                <>
                  <span className="button-spinner">⏳</span>
                  <span className="button-text">Salvando...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">💾</span>
                  <span className="button-text">Salvar Atendimento</span>
                  <span className="button-hint">({dataFormatada})</span>
                </>
              )}
            </button>
            
            <div className="secondary-actions">
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
                className="clear-button"
              >
                <span className="button-icon">🗑️</span>
                Limpar
              </button>
              
              <button
                type="button"
                onClick={() => setForm({...form, data: getTodayDate()})}
                className="today-button"
              >
                <span className="button-icon">🔄</span>
                Hoje
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* DICAS RÁPIDAS */}
      <div className="quick-tips-section">
        <h3 className="tips-title">
          <span className="tips-title-icon">💡</span>
          Como funciona?
        </h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-card-icon">1️⃣</div>
            <div className="tip-card-content">
              <div className="tip-card-title">Escolha o Profissional</div>
              <div className="tip-card-text">
                Selecione quem vai atender
              </div>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-card-icon">2️⃣</div>
            <div className="tip-card-content">
              <div className="tip-card-title">Cadastre se precisar</div>
              <div className="tip-card-text">
                Cliente, serviço ou profissional
              </div>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-card-icon">3️⃣</div>
            <div className="tip-card-content">
              <div className="tip-card-title">Selecione o tipo</div>
              <div className="tip-card-text">
                💈 Salão ou 👥 Indicação
              </div>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-card-icon">4️⃣</div>
            <div className="tip-card-content">
              <div className="tip-card-title">Confira o valor</div>
              <div className="tip-card-text">
                Indicação sempre paga mais
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceForm