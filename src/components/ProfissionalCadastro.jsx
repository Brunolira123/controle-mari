// src/components/ProfissionalCadastro.jsx - VERSÃO PARA UUID
import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Modal from './Modal.jsx'
import './ProfissionalCadastro.css'

export function ProfissionalCadastro({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    comissao_padrao: '',
    meta_mensal: '',
    ativo: true
  })

  async function handleSubmit(e) {
  e.preventDefault()
  
  if (!form.nome.trim()) {
    alert('Nome do profissional é obrigatório!')
    return
  }

  setLoading(true)
  
  try {
    // Gere um ID manual temporário
    const manualId = Math.floor(Math.random() * 1000000);
    
    const { error } = await supabase
      .from('profissionais')
      .insert({
        id: manualId, // ID manual temporário
        nome: form.nome,
        telefone: form.telefone || null,
        comissao_padrao: form.comissao_padrao ? parseFloat(form.comissao_padrao) : 0,
        meta_mensal: form.meta_mensal ? parseFloat(form.meta_mensal) : 0,
        ativo: form.ativo
      })
    
    if (error) throw error

    alert('Profissional cadastrado com sucesso!')
    setForm({
      nome: '',
      telefone: '',
      comissao_padrao: '',
      meta_mensal: '',
      ativo: true
    })
    
    if (onSuccess) {
      onSuccess()
    }
    
    onClose()
    
  } catch (error) {
    alert('Erro ao cadastrar profissional: ' + error.message)
    console.error('Erro detalhado:', error)
  } finally {
    setLoading(false)
  }
}

  return (
    <Modal 
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Profissional"
    >
      <form onSubmit={handleSubmit} className="profissional-form">
        <div className="profissional-field">
          <label>Nome *</label>
          <input
            type="text"
            value={form.nome}
            onChange={e => setForm({...form, nome: e.target.value})}
            placeholder="Ex: Maria Silva"
            className="profissional-input"
            required
          />
        </div>
        
        <div className="profissional-field">
          <label>Telefone</label>
          <input
            type="tel"
            value={form.telefone}
            onChange={e => setForm({...form, telefone: e.target.value})}
            placeholder="(11) 99999-9999"
            className="profissional-input"
          />
        </div>
        
        <div className="profissional-field">
          <label>Comissão Padrão (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.comissao_padrao}
            onChange={e => setForm({...form, comissao_padrao: e.target.value})}
            placeholder="0.00"
            className="profissional-input"
          />
        </div>
        
        <div className="profissional-field">
          <label>Meta Mensal (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.meta_mensal}
            onChange={e => setForm({...form, meta_mensal: e.target.value})}
            placeholder="0.00"
            className="profissional-input"
          />
        </div>
        
        <div className="profissional-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={e => setForm({...form, ativo: e.target.checked})}
              className="profissional-checkbox"
            />
            <span className="checkbox-text">Ativo</span>
          </label>
        </div>
        
        <div className="profissional-actions">
          <button
            type="submit"
            disabled={loading}
            className="profissional-submit-button"
          >
            {loading ? (
              <>
                <span className="submit-spinner">⏳</span>
                <span>Cadastrando...</span>
              </>
            ) : (
              <>
                <span className="submit-icon">✓</span>
                <span>Cadastrar Profissional</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="profissional-cancel-button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ProfissionalCadastro