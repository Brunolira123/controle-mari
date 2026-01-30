// src/components/Profile.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import './Profile.css'

function Profile({ user, onUpdate }) {
  const [form, setForm] = useState({
    nome: user.nome || '',
    telefone: user.telefone || '',
    comissao_padrao: user.comissao_padrao || 0.6,
    meta_mensal: user.meta_mensal || 5000
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profissionais')
        .upsert({
          id: user.id,
          ...form,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setMessage('✅ Perfil atualizado com sucesso!')
      onUpdate({ ...user, ...form })
      
      // Atualizar também os dados do usuário no auth
      await supabase.auth.updateUser({
        data: { nome: form.nome }
      })
      
    } catch (error) {
      setMessage('❌ Erro ao atualizar perfil: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>👤 Meu Perfil</h2>
        <p>Gerencie suas informações pessoais</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h3>Informações Pessoais</h3>
          
          <div className="form-group">
            <label>Nome Completo *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({...form, nome: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => setForm({...form, telefone: e.target.value})}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Configurações Profissionais</h3>
          
          <div className="form-group">
            <label>Comissão Padrão (%)</label>
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.comissao_padrao * 100}
                onChange={(e) => setForm({...form, comissao_padrao: e.target.value / 100})}
              />
              <span className="suffix">%</span>
            </div>
            <small>Porcentagem padrão para cálculo de comissões</small>
          </div>

          <div className="form-group">
            <label>Meta Mensal (R$)</label>
            <div className="input-with-prefix">
              <span className="prefix">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.meta_mensal}
                onChange={(e) => setForm({...form, meta_mensal: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : '💾 Salvar Alterações'}
          </button>
          
          <button 
            type="button" 
            className="secondary"
            onClick={() => window.history.back()}
          >
            ← Voltar
          </button>
        </div>
      </form>
    </div>
  )
}

export default Profile