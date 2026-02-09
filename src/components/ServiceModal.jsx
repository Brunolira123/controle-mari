// src/components/ServiceModal.jsx - VERSÃO COM TESOURA PERSONALIZADA
import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Modal from './Modal.jsx'
import './ServiceModal.css'

// ✅ Caminho correto para GitHub Pages + PWA + iOS
const logoImage = `${import.meta.env.BASE_URL || ''}image.png`

export function ServiceModal({ 
  isOpen, 
  onClose, 
  onServiceCreated,
  defaultService = null 
}) {
  const [form, setForm] = useState({
    nome: defaultService?.nome || '',
    valor: defaultService?.valor || '',
    comissao_salao: defaultService?.comissao_salao || '',
    comissao_indicacao: defaultService?.comissao_indicacao || ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Calcula comissões automaticamente
  const calcularComissoes = (valor) => {
    const valorNum = parseFloat(valor) || 0
    return {
      comissao_salao: (valorNum * 0.4).toFixed(2),
      comissao_indicacao: (valorNum * 0.6).toFixed(2)
    }
  }

  // Validação do formulário
  const validarFormulario = () => {
    const novosErros = {}
    
    if (!form.nome.trim()) {
      novosErros.nome = 'Descrição do serviço é obrigatória'
    }
    
    if (!form.valor) {
      novosErros.valor = 'Valor do serviço é obrigatório'
    } else if (parseFloat(form.valor) <= 0) {
      novosErros.valor = 'Valor deve ser maior que zero'
    }
    
    setErrors(novosErros)
    return Object.keys(novosErros).length === 0
  }

  // Handler de mudança nos campos
  const handleChange = (field, value) => {
    if (field === 'valor') {
      const comissoes = calcularComissoes(value)
      setForm(prev => ({
        ...prev,
        valor: value,
        ...comissoes
      }))
    } else {
      setForm(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
    // Limpa erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Cadastro do serviço
  const handleSubmit = async () => {
    if (!validarFormulario()) return
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('servicos')
        .insert({
          nome: form.nome.trim(),
          comissao_salao: parseFloat(form.comissao_salao),
          comissao_indicacao: parseFloat(form.comissao_indicacao)
        })
        .select()
      
      if (error) throw error

      if (data && data[0]) {
        // Limpa formulário
        setForm({
          nome: '',
          valor: '',
          comissao_salao: '',
          comissao_indicacao: ''
        })
        
        // Fecha modal e notifica sucesso
        onClose()
        if (onServiceCreated) {
          onServiceCreated(data[0])
        }
        
        // Feedback visual
        alert('✅ Serviço cadastrado com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao cadastrar serviço:', error)
      alert('❌ Erro ao cadastrar serviço: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Formata valor em reais
  const formatarMoeda = (valor) => {
    return parseFloat(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <Modal 
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="service-modal-header">
          <div className="service-modal-logo-container">
            {/* ✅ LOGO IGUAL AO HEADER */}
            <img
              src={logoImage}
              alt="Logo do Salão"
              className="service-modal-logo"
              loading="eager"
              onError={(e) => {
                console.error('Erro ao carregar logo:', logoImage)
                e.currentTarget.style.display = 'none'

                const fallback =
                  e.currentTarget.parentElement.querySelector(
                    '.service-modal-logo-fallback'
                  )

                if (fallback) fallback.style.display = 'flex'
              }}
            />

            {/* FALLBACK (só aparece se REALMENTE quebrar) */}
            <div
              className="service-modal-logo-fallback"
              aria-hidden="true"
              style={{ display: 'none' }}
            >
              ✂️
            </div>
          </div>
          <div>
            <h2 className="service-modal-title">
              {defaultService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
            </h2>
            <p className="service-modal-subtitle">
              {defaultService ? 'Atualize os dados do serviço' : 'Preencha os dados abaixo'}
            </p>
          </div>
        </div>
      }
      className="service-modal"
      maxWidth="600px"
    >
      <div className="service-modal-content">
        {/* FORMULÁRIO - AGORA EM COLUNA */}
        <div className="service-modal-form-section">
          <div className="form-group-vertical">
            <div className="form-group">
              <label className="form-label">
                Descrição do Serviço
                <span className="required-indicator">*</span>
              </label>
              <div className={`input-container ${errors.nome ? 'has-error' : ''}`}>
                <span className="input-icon">✏️</span>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Ex: Escova com babyliss, Cacheada e etc."
                  className="form-input"
                  disabled={loading}
                  autoFocus
                />
              </div>
              {errors.nome && (
                <div className="error-message">{errors.nome}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Valor do Serviço
                <span className="required-indicator">*</span>
              </label>
              <div className={`input-container ${errors.valor ? 'has-error' : ''}`}>
                <span className="input-icon">💰</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => handleChange('valor', e.target.value)}
                  placeholder="0,00"
                  className="form-input"
                  disabled={loading}
                />
                <span className="input-suffix">R$</span>
              </div>
              {errors.valor && (
                <div className="error-message">{errors.valor}</div>
              )}
              {form.valor && !errors.valor && (
                <div className="input-hint">Valor total cobrado do cliente</div>
              )}
            </div>
          </div>
        </div>

        {/* RESULTADO DAS COMISSÕES - AGORA EM LINHA */}
        <div className="comission-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">📊</span>
              Comissões Calculadas Automaticamente
            </h3>
            <div className="commission-badges">
              <span className="badge badge-salon">Salão 40%</span>
              <span className="badge badge-referral">Indicação 60%</span>
            </div>
          </div>

          {/* GRID DE COMISSÕES LADO A LADO */}
          <div className="commission-grid-inline">
            {/* CARD SALÃO */}
            <div className="commission-card-inline">
              <div className="commission-header-inline">
                <div className="commission-icon-inline salon-icon">
                  💈
                </div>
                <div className="commission-info-inline">
                  <h4 className="commission-title-inline">Comissão Salão</h4>
                  <span className="commission-percentage-inline">40% do valor</span>
                </div>
              </div>
              
              <div className="commission-body-inline">
                <div className="commission-amount-inline">
                  <span className="currency-inline">R$</span>
                  <span className="amount-inline">{formatarMoeda(form.comissao_salao)}</span>
                </div>
                
                <div className="commission-progress-inline">
                  <div className="progress-bar-inline">
                    <div 
                      className="progress-fill-inline salon-fill"
                      style={{ width: form.valor ? '40%' : '0%' }}
                    />
                  </div>
                  <span className="progress-label-inline">40%</span>
                </div>
                
                <div className="commission-footer-inline">
                  <span className="footer-icon-inline">👨‍💼</span>
                  <span>Valor recebido pelo profissional</span>
                </div>
              </div>
            </div>

            {/* SEPARADOR */}
            <div className="commission-separator">
              <div className="separator-line"></div>
              <div className="separator-line"></div>
            </div>

            {/* CARD INDICAÇÃO */}
            <div className="commission-card-inline">
              <div className="commission-header-inline">
                <div className="commission-icon-inline referral-icon">
                  👥
                </div>
                <div className="commission-info-inline">
                  <h4 className="commission-title-inline">Comissão Indicação</h4>
                  <span className="commission-percentage-inline">60% do valor</span>
                </div>
              </div>
              
              <div className="commission-body-inline">
                <div className="commission-amount-inline">
                  <span className="currency-inline">R$</span>
                  <span className="amount-inline">{formatarMoeda(form.comissao_indicacao)}</span>
                </div>
                
                <div className="commission-progress-inline">
                  <div className="progress-bar-inline">
                    <div 
                      className="progress-fill-inline referral-fill"
                      style={{ width: form.valor ? '60%' : '0%' }}
                    />
                  </div>
                  <span className="progress-label-inline">60%</span>
                </div>
                
                <div className="commission-footer-inline">
                  <span className="footer-icon-inline">👨‍💼</span>
                  <span>Valor recebido pelo profissional</span>
                </div>
              </div>
            </div>
          </div>

          {/* DIFERENÇA ENTRE COMISSÕES */}
          {form.valor && form.comissao_salao && form.comissao_indicacao && (
            <div className="commission-difference">
              <div className="difference-header">
                <span className="difference-icon">📈</span>
                <span className="difference-title">Vantagem da Indicação</span>
              </div>
              <div className="difference-content">
                <div className="difference-amount">
                  + R$ {formatarMoeda(parseFloat(form.comissao_indicacao) - parseFloat(form.comissao_salao))}
                </div>
                <div className="difference-description">
                  O profissional ganha <strong>20% a mais</strong> em atendimentos por indicação
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="modal-actions">
          <button
            onClick={handleSubmit}
            disabled={loading || !form.nome || !form.valor}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processando...
              </>
            ) : (
              <>
                <span className="btn-icon">✓</span>
                {defaultService ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>

        {/* INFORMAÇÕES ADICIONAIS */}
        <div className="modal-info">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <p>
              <strong>Como funciona:</strong> O valor total é dividido em duas comissões:
            </p>
            <ul>
              <li><strong>Salão (40%):</strong> Para atendimentos realizados no salão</li>
              <li><strong>Indicação (60%):</strong> Para clientes trazidos pelo profissional</li>
            </ul>
            <p>
              Esta diferença incentiva os profissionais a trazerem novos clientes.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ServiceModal