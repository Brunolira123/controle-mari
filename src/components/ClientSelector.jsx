import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import './ClientSelector.css'

export function ClientSelector({ onSelect, value, required = false }) {
  const [clientes, setClientes] = useState([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClientes('')
  }, [])

  async function loadClientes(searchTerm) {
    setLoading(true)
    
    let query = supabase
      .from('clientes')
      .select('id, nome, telefone')
      .order('nome', { ascending: true })
      .limit(20)

    if (searchTerm.trim()) {
      query = query.ilike('nome', `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (!error) {
      setClientes(data || [])
    } else {
      console.error('Erro ao buscar clientes:', error)
    }
    
    setLoading(false)
  }

  async function addClienteRapido() {
    const nome = prompt('Nome do cliente:')
    if (!nome || !nome.trim()) return

    const telefone = prompt('Telefone (opcional):')

    setLoading(true)
    
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ nome: nome.trim(), telefone }])
      .select()

    if (error) {
      alert('Erro ao cadastrar cliente: ' + error.message)
    } else if (data?.[0]) {
      setClientes([data[0], ...clientes])
      onSelect(data[0].id)
      setSearch(data[0].nome)
      setShowDropdown(false)
    }
    
    setLoading(false)
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCliente = clientes.find(c => c.id === value)

  return (
    <div className="client-selector-container">
      <label className="client-selector-label">
        <span className="client-selector-label-icon">👤</span>
        Cliente {required && <span className="client-selector-required">*</span>}
      </label>
      
      <div className="client-selector-input-container">
        <input
          type="text"
          value={search || selectedCliente?.nome || ''}
          onChange={(e) => {
            setSearch(e.target.value)
            setShowDropdown(true)
            if (!e.target.value) {
              onSelect('')
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar ou cadastrar cliente..."
          className="client-selector-input"
          required={required}
        />
        
        <button
          type="button"
          onClick={addClienteRapido}
          className="client-selector-add-button"
          title="Adicionar novo cliente"
        >
          ➕
        </button>
      </div>

      {showDropdown && (search || filteredClientes.length > 0) && (
        <div className="client-selector-dropdown">
          {loading ? (
            <div className="client-selector-loading">Carregando...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="client-selector-no-results">
              <div>Nenhum cliente encontrado</div>
              <button
                onClick={addClienteRapido}
                className="client-selector-add-from-search"
              >
                ➕ Cadastrar "{search}"
              </button>
            </div>
          ) : (
            <>
              {filteredClientes.map(cliente => (
                <div
                  key={cliente.id}
                  className={`client-selector-dropdown-item ${
                    value === cliente.id ? 'client-selector-dropdown-item-selected' : ''
                  }`}
                  onClick={() => {
                    onSelect(cliente.id)
                    setSearch(cliente.nome)
                    setShowDropdown(false)
                  }}
                >
                  <div className="client-selector-cliente-info">
                    <div className="client-selector-cliente-nome">{cliente.nome}</div>
                    {cliente.telefone && (
                      <div className="client-selector-cliente-telefone">{cliente.telefone}</div>
                    )}
                  </div>
                  {value === cliente.id && (
                    <div className="client-selector-selected-badge">✓</div>
                  )}
                </div>
              ))}
              
              {search && !filteredClientes.some(c => 
                c.nome.toLowerCase() === search.toLowerCase()
              ) && (
                <div
                  className="client-selector-add-new-item"
                  onClick={addClienteRapido}
                >
                  <div className="client-selector-add-new-icon">➕</div>
                  <div>Cadastrar "{search}"</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedCliente && (
        <div className="client-selector-selected-info">
          <div className="client-selector-selected-name">
            <span>✓</span>
            {selectedCliente.nome}
            {selectedCliente.telefone && (
              <span className="client-selector-selected-phone">
                • {selectedCliente.telefone}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect('')
              setSearch('')
            }}
            className="client-selector-clear-button"
          >
            ✕ Limpar
          </button>
        </div>
      )}
    </div>
  )
}

export default ClientSelector