// src/components/QuinzenalReportMobile.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import './QuinzenalReportMobile.css'

export function QuinzenalReportMobile() {
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [resumoDiario, setResumoDiario] = useState([])
  const [expandedDay, setExpandedDay] = useState(null)
  const [viewMode, setViewMode] = useState('cards') // 'cards' ou 'text'

  const anos = [2023, 2024, 2025, 2026, 2027]
  const meses = [
    {id: 1, nome: 'Jan'},
    {id: 2, nome: 'Fev'},
    {id: 3, nome: 'Mar'},
    {id: 4, nome: 'Abr'},
    {id: 5, nome: 'Mai'},
    {id: 6, nome: 'Jun'},
    {id: 7, nome: 'Jul'},
    {id: 8, nome: 'Ago'},
    {id: 9, nome: 'Set'},
    {id: 10, nome: 'Out'},
    {id: 11, nome: 'Nov'},
    {id: 12, nome: 'Dez'}
  ]

  // FUNÇÃO CORRIGIDA para obter data atual corretamente
  function getCurrentPeriod() {
    const hoje = new Date()
    const dia = hoje.getDate()
    return dia <= 15 ? 1 : 2
  }

  // FUNÇÃO AUXILIAR CORRIGIDA para formatar datas
  const formatarDataSegura = (dataString, opcoes = {}) => {
    if (!dataString) return 'Sem data'
    
    try {
      // Divide a string ISO "YYYY-MM-DD"
      const [ano, mes, dia] = dataString.split('-').map(Number)
      
      // Validação
      if (isNaN(ano) || isNaN(mes) || isNaN(dia)) {
        return dataString
      }
      
      // Cria data LOCAL (evita timezone bugs)
      const data = new Date(ano, mes - 1, dia)
      
      // Opções padrão para exibição
      const opcoesPadrao = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...opcoes
      }
      
      return data.toLocaleDateString('pt-BR', opcoesPadrao)
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return dataString
    }
  }

  // Função para datas curtas (dia/mês)
  const formatarDataCurta = (dataString) => {
    if (!dataString) return ''
    
    try {
      const [ano, mes, dia] = dataString.split('-').map(Number)
      return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}`
    } catch (error) {
      return dataString
    }
  }

  // FUNÇÃO CORRIGIDA para datas do período
  function getPeriodDates(period, year, month) {
    const mesStr = month.toString().padStart(2, '0')
    
    if (period === 1) {
      return {
        inicio: `${year}-${mesStr}-01`,
        fim: `${year}-${mesStr}-15`,
        label: `01/${mesStr}/${year} a 15/${mesStr}/${year}`,
        labelShort: `1ª Quinzena`
      }
    } else {
      const ultimoDia = new Date(year, month, 0).getDate()
      return {
        inicio: `${year}-${mesStr}-16`,
        fim: `${year}-${mesStr}-${ultimoDia.toString().padStart(2, '0')}`,
        label: `16/${mesStr}/${year} a ${ultimoDia}/${mesStr}/${year}`,
        labelShort: `2ª Quinzena`
      }
    }
  }

  // Carregar dados do relatório
  async function carregarRelatorio() {
    setLoading(true)
    const { inicio, fim } = getPeriodDates(periodo, ano, mes)
    
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes!inner(nome),
          servicos!inner(nome, comissao_salao, comissao_indicacao)
        `)
        .eq('status', 'realizado')
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: true })

      if (error) throw error

      if (data) {
        agruparPorDia(data)
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      alert('Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar dados por dia
  function agruparPorDia(dados) {
    const agrupado = dados.reduce((acc, item) => {
      const data = item.data
      if (!acc[data]) {
        acc[data] = {
          data: data,
          itens: [],
          totalDia: 0
        }
      }
      acc[data].itens.push(item)
      acc[data].totalDia += parseFloat(item.valor || 0)
      return acc
    }, {})

    const arrayAgrupado = Object.values(agrupado)
      .sort((a, b) => {
        const dataA = a.data.split('-').map(Number)
        const dataB = b.data.split('-').map(Number)
        return new Date(dataA[0], dataA[1] - 1, dataA[2]) - 
               new Date(dataB[0], dataB[1] - 1, dataB[2])
      })
    
    setResumoDiario(arrayAgrupado)
    setExpandedDay(null) // Fecha qualquer dia expandido
  }

  // Calcular total geral
  function calcularTotalGeral() {
    return resumoDiario.reduce((total, dia) => total + dia.totalDia, 0)
  }

  // Formatar nome do serviço
  function formatarNomeServico(servicoNome, quantidade) {
    let nome = servicoNome.replace(/\(.*?\)/g, '').trim()
    
    if (nome.toLowerCase().includes('penteado') && quantidade > 1) {
      nome = nome.replace('penteado', 'penteados')
    }
    
    if (servicoNome.toLowerCase().includes('ajuda')) {
      const ajudaMatch = servicoNome.match(/\(ajuda (.*?)\)/)
      if (ajudaMatch) {
        nome = `meio ${nome} (ajuda ${ajudaMatch[1]})`
      }
    }
    
    return nome.trim()
  }

  // Exportar como texto (CORRIGIDO)
  function exportarComoTexto() {
    const { label } = getPeriodDates(periodo, ano, mes)
    let texto = `Fechamento ${label}\n\n`
    
    let totalGeral = 0
    
    resumoDiario.forEach(dia => {
      // USANDO FUNÇÃO CORRIGIDA
      const dataFormatada = formatarDataCurta(dia.data)
      
      texto += `${dataFormatada}\n`
      
      const servicosAgrupados = dia.itens.reduce((acc, item) => {
        const servicoNome = formatarNomeServico(item.servicos.nome, 1)
        const key = servicoNome
        
        if (!acc[key]) {
          acc[key] = {
            nome: servicoNome,
            quantidade: 0,
            total: 0
          }
        }
        acc[key].quantidade++
        acc[key].total += parseFloat(item.valor || 0)
        return acc
      }, {})
      
      Object.values(servicosAgrupados).forEach(servico => {
        const quantidadeTexto = servico.quantidade > 1 ? `${servico.quantidade} ` : '1 '
        const nomeServico = servico.quantidade > 1 
          ? servico.nome.replace('penteado', 'penteados')
          : servico.nome
        
        texto += `${quantidadeTexto}${nomeServico} = ${servico.total.toFixed(2).replace('.', ',')}\n`
      })
      
      texto += '\n'
      totalGeral += dia.totalDia
    })
    
    texto += `\nTOTAL ${totalGeral.toFixed(2).replace('.', ',')}\n`
    
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fechamento_${ano}_${mes}_quinzena_${periodo}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    alert('Relatório exportado com sucesso!')
  }

  // Copiar para clipboard (CORRIGIDO)
  function copiarParaClipboard() {
    const { label } = getPeriodDates(periodo, ano, mes)
    let texto = `Fechamento ${label}\n\n`
    
    let totalGeral = 0
    
    resumoDiario.forEach(dia => {
      // USANDO FUNÇÃO CORRIGIDA
      const dataFormatada = formatarDataCurta(dia.data)
      
      texto += `${dataFormatada}\n`
      
      const servicosAgrupados = dia.itens.reduce((acc, item) => {
        const servicoNome = formatarNomeServico(item.servicos.nome, 1)
        const key = servicoNome
        
        if (!acc[key]) {
          acc[key] = {
            nome: servicoNome,
            quantidade: 0,
            total: 0
          }
        }
        acc[key].quantidade++
        acc[key].total += parseFloat(item.valor || 0)
        return acc
      }, {})
      
      Object.values(servicosAgrupados).forEach(servico => {
        const quantidadeTexto = servico.quantidade > 1 ? `${servico.quantidade} ` : '1 '
        const nomeServico = servico.quantidade > 1 
          ? servico.nome.replace('penteado', 'penteados')
          : servico.nome
        
        texto += `${quantidadeTexto}${nomeServico} = ${servico.total.toFixed(2).replace('.', ',')}\n`
      })
      
      texto += '\n'
      totalGeral += dia.totalDia
    })
    
    texto += `\nTOTAL ${totalGeral.toFixed(2).replace('.', ',')}\n`
    
    navigator.clipboard.writeText(texto)
    alert('Relatório copiado para a área de transferência!')
  }

  // Efeito para carregar relatório quando filtros mudam
  useEffect(() => {
    carregarRelatorio()
  }, [periodo, ano, mes])

  const totalGeral = calcularTotalGeral()
  const { labelShort } = getPeriodDates(periodo, ano, mes)
  const totalServicos = resumoDiario.reduce((total, dia) => total + dia.itens.length, 0)

  return (
    <div className="quinzenal-mobile">
      {/* Header Compacto */}
      <div className="report-header">
        <div className="header-title">
          <span className="header-icon">📊</span>
          <div className="header-text">
            <h1>Relatório</h1>
            <p className="header-subtitle">{labelShort}</p>
          </div>
        </div>
        
        <button 
          onClick={carregarRelatorio}
          className="header-refresh"
          disabled={loading}
        >
          {loading ? '🔄' : '🔄'}
        </button>
      </div>

      {/* Filtros Compactos */}
      <div className="filters-compact">
        <div className="filter-row">
          <div className="filter-item">
            <label>Mês</label>
            <select 
              value={mes} 
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="filter-select"
            >
              {meses.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label>Ano</label>
            <select 
              value={ano} 
              onChange={(e) => setAno(parseInt(e.target.value))}
              className="filter-select"
            >
              {anos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="period-toggle">
          <button 
            onClick={() => setPeriodo(1)}
            className={`toggle-btn ${periodo === 1 ? 'active' : ''}`}
          >
            1ª Quinzena
          </button>
          <button 
            onClick={() => setPeriodo(2)}
            className={`toggle-btn ${periodo === 2 ? 'active' : ''}`}
          >
            2ª Quinzena
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button 
          onClick={() => setViewMode('cards')}
          className={`mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
        >
          📋 Cards
        </button>
        <button 
          onClick={() => setViewMode('text')}
          className={`mode-btn ${viewMode === 'text' ? 'active' : ''}`}
        >
          📄 Texto
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && resumoDiario.length > 0 && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{resumoDiario.length}</div>
            <div className="stat-label">Dias</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💇</div>
            <div className="stat-value">{totalServicos}</div>
            <div className="stat-label">Serviços</div>
          </div>
          
          <div className="stat-card total">
            <div className="stat-icon">💰</div>
            <div className="stat-value">R$ {totalGeral.toFixed(0)}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
      )}

      {/* Loading/Empty State */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Carregando dados...</p>
        </div>
      ) : resumoDiario.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Nenhum atendimento</h3>
          <p>Não há dados para este período</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="days-list">
          {resumoDiario.map((dia, index) => (
            <div 
              key={dia.data} 
              className={`day-card ${expandedDay === index ? 'expanded' : ''}`}
              onClick={() => setExpandedDay(expandedDay === index ? null : index)}
            >
              <div className="day-header">
                {/* CORRIGIDO: Usando função segura */}
                <div className="day-date">
                  {formatarDataSegura(dia.data, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
                <div className="day-total">
                  R$ {dia.totalDia.toFixed(2)}
                </div>
                <div className="day-arrow">
                  {expandedDay === index ? '↑' : '↓'}
                </div>
              </div>
              
              {expandedDay === index && (
                <div className="day-services">
                  {dia.itens.map((item, idx) => (
                    <div key={idx} className="service-item">
                      <div className="service-info">
                        <div className="service-name">
                          {item.clientes?.nome?.split(' ')[0] || 'Cliente'}
                        </div>
                        <div className="service-desc">
                          {item.servicos?.nome?.split(' ')[0] || 'Serviço'}
                          <span className={`service-type ${item.tipo}`}>
                            {item.tipo === 'salao' ? '💈' : '👥'}
                          </span>
                        </div>
                      </div>
                      <div className="service-value">
                        R$ {parseFloat(item.valor || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Text View */
        <div className="text-view">
          <div className="text-header">
            <h3>Fechamento {labelShort}</h3>
          </div>
          
          <div className="text-content">
            {resumoDiario.map(dia => {
              // CORRIGIDO: Usando função segura
              const dataFormatada = formatarDataCurta(dia.data)
              
              const servicosAgrupados = dia.itens.reduce((acc, item) => {
                const servicoNome = formatarNomeServico(item.servicos.nome, 1)
                const key = servicoNome
                
                if (!acc[key]) {
                  acc[key] = {
                    nome: servicoNome,
                    quantidade: 0,
                    total: 0
                  }
                }
                acc[key].quantidade++
                acc[key].total += parseFloat(item.valor || 0)
                return acc
              }, {})
              
              return (
                <div key={dia.data} className="text-day">
                  <div className="text-date">{dataFormatada}</div>
                  {Object.values(servicosAgrupados).map((servico, idx) => {
                    const quantidadeTexto = servico.quantidade > 1 ? `${servico.quantidade} ` : '1 '
                    const nomeServico = servico.quantidade > 1 
                      ? servico.nome.replace('penteado', 'penteados')
                      : servico.nome
                    
                    return (
                      <div key={idx} className="text-service">
                        <span className="text-quantity">{quantidadeTexto}</span>
                        <span className="text-name">{nomeServico}</span>
                        <span className="text-equals"> = </span>
                        <span className="text-value">{servico.total.toFixed(2)}</span>
                      </div>
                    )
                  })}
                  <div className="text-spacer"></div>
                </div>
              )
            })}
            
            <div className="text-total">
              <div className="text-total-label">TOTAL</div>
              <div className="text-total-value">{totalGeral.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons (Fixed at bottom) */}
      {resumoDiario.length > 0 && (
        <div className="action-buttons-compact">
          <button 
            onClick={exportarComoTexto}
            className="action-btn export"
          >
            <span className="btn-icon">📥</span>
            <span className="btn-text">Exportar</span>
          </button>
          
          <button 
            onClick={copiarParaClipboard}
            className="action-btn copy"
          >
            <span className="btn-icon">📋</span>
            <span className="btn-text">Copiar</span>
          </button>
          
          <button 
            onClick={() => window.print()}
            className="action-btn print"
          >
            <span className="btn-icon">🖨️</span>
            <span className="btn-text">Imprimir</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default QuinzenalReportMobile