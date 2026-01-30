import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import './QuinzenalReport.css'

export function QuinzenalReport() {
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(false)
  const [resumoDiario, setResumoDiario] = useState([])

  // Gera anos de 2024 a 2030
  const anos = Array.from({length: 7}, (_, i) => 2024 + i)
  const meses = [
    {id: 1, nome: 'Janeiro'},
    {id: 2, nome: 'Fevereiro'},
    {id: 3, nome: 'Março'},
    {id: 4, nome: 'Abril'},
    {id: 5, nome: 'Maio'},
    {id: 6, nome: 'Junho'},
    {id: 7, nome: 'Julho'},
    {id: 8, nome: 'Agosto'},
    {id: 9, nome: 'Setembro'},
    {id: 10, nome: 'Outubro'},
    {id: 11, nome: 'Novembro'},
    {id: 12, nome: 'Dezembro'}
  ]

  function getCurrentPeriod() {
    const hoje = new Date()
    const dia = hoje.getDate()
    return dia <= 15 ? 1 : 2
  }

  function getPeriodDates(period, year, month) {
    const mesStr = month.toString().padStart(2, '0')
    const anoStr = year.toString().slice(2) // Pega só os últimos 2 dígitos
    
    if (period === 1) {
      return {
        inicio: `${year}-${mesStr}-01`,
        fim: `${year}-${mesStr}-15`,
        label: `01/${mesStr}/${anoStr} a 15/${mesStr}/${anoStr}`,
        labelHeader: `01/${mesStr}/${anoStr} á 15/${mesStr}/${anoStr}`
      }
    } else {
      // Último dia do mês
      const ultimoDia = new Date(year, month, 0).getDate()
      return {
        inicio: `${year}-${mesStr}-16`,
        fim: `${year}-${mesStr}-${ultimoDia.toString().padStart(2, '0')}`,
        label: `16/${mesStr}/${anoStr} a ${ultimoDia}/${mesStr}/${anoStr}`,
        labelHeader: `16/${mesStr}/${anoStr} á ${ultimoDia}/${mesStr}/${anoStr}`
      }
    }
  }

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
        setDados(data)
        agruparPorDia(data)
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      alert('Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }

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

    // Converter para array e ordenar por data
    const arrayAgrupado = Object.values(agrupado)
      .sort((a, b) => new Date(a.data) - new Date(b.data))
    
    setResumoDiario(arrayAgrupado)
  }

  function calcularTotalGeral() {
    return resumoDiario.reduce((total, dia) => total + dia.totalDia, 0)
  }

  // Formatar nome do serviço conforme seu exemplo
  function formatarNomeServico(servicoNome, quantidade, tipo) {
    let nomeFormatado = servicoNome
    
    // Remover valores entre parênteses se existir
    nomeFormatado = nomeFormatado.replace(/\(.*?\)/g, '').trim()
    
    // Adicionar ano se mencionado no nome original
    const anoMatch = servicoNome.match(/202[0-9]/)
    if (anoMatch) {
      nomeFormatado += ` ${anoMatch[0]}`
    }
    
    // Verificar se é "penteado" e formatar plural
    if (nomeFormatado.toLowerCase().includes('penteado')) {
      if (quantidade > 1) {
        nomeFormatado = nomeFormatado.replace('penteado', 'penteados')
      }
    }
    
    // Adicionar tipo se for ajuda
    if (servicoNome.toLowerCase().includes('ajuda')) {
      const ajudaMatch = servicoNome.match(/\(ajuda (.*?)\)/)
      if (ajudaMatch) {
        nomeFormatado = `meio ${nomeFormatado.replace(/\(ajuda.*?\)/, '').trim()} (ajuda ${ajudaMatch[1]})`
      }
    }
    
    // Adicionar tipo se for deslocamento
    if (servicoNome.toLowerCase().includes('deslocamento')) {
      nomeFormatado = 'deslocamento'
    }
    
    return nomeFormatado.trim()
  }

  // Função para exportar como texto NO FORMATO EXATO DO SEU EXEMPLO
  function exportarComoTexto() {
    const { labelHeader } = getPeriodDates(periodo, ano, mes)
    let texto = `Fechamento ${labelHeader}\n\n`
    
    let totalGeral = 0
    
    resumoDiario.forEach(dia => {
      const dataFormatada = new Date(dia.data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      }).replace(/\//g, '/')
      
      texto += `${dataFormatada}\n`
      
      // Agrupar serviços iguais no mesmo dia
      const servicosAgrupados = dia.itens.reduce((acc, item) => {
        const servicoNome = formatarNomeServico(item.servicos.nome, 1, item.tipo)
        const key = servicoNome
        
        if (!acc[key]) {
          acc[key] = {
            nome: servicoNome,
            quantidade: 0,
            valorUnitario: item.valor,
            total: 0
          }
        }
        acc[key].quantidade++
        acc[key].total += parseFloat(item.valor || 0)
        return acc
      }, {})
      
      // Adicionar serviços agrupados no formato correto
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
    
    // Criar e baixar arquivo
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fechamento_${ano}_${mes}_quinzena_${periodo}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Nova função para visualizar no formato exato
  function renderizarFormatoExemplo() {
    const { labelHeader } = getPeriodDates(periodo, ano, mes)
    const totalGeral = calcularTotalGeral()
    
    return (
      <div className="exemplo-format">
        <div className="exemplo-header">
          <h3>Fechamento {labelHeader}</h3>
        </div>
        
        <div className="exemplo-content">
          {resumoDiario.map(dia => {
            const dataFormatada = new Date(dia.data).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit'
            }).replace(/\//g, '/')
            
            // Agrupar serviços
            const servicosAgrupados = dia.itens.reduce((acc, item) => {
              const servicoNome = formatarNomeServico(item.servicos.nome, 1, item.tipo)
              const key = servicoNome
              
              if (!acc[key]) {
                acc[key] = {
                  nome: servicoNome,
                  quantidade: 0,
                  valorUnitario: item.valor,
                  total: 0
                }
              }
              acc[key].quantidade++
              acc[key].total += parseFloat(item.valor || 0)
              return acc
            }, {})
            
            return (
              <div key={dia.data} className="exemplo-dia">
                <div className="exemplo-data">{dataFormatada}</div>
                
                {Object.values(servicosAgrupados).map((servico, idx) => {
                  const quantidadeTexto = servico.quantidade > 1 ? `${servico.quantidade} ` : '1 '
                  const nomeServico = servico.quantidade > 1 
                    ? servico.nome.replace('penteado', 'penteados')
                    : servico.nome
                  
                  return (
                    <div key={idx} className="exemplo-servico">
                      <span className="exemplo-quantidade">{quantidadeTexto}</span>
                      <span className="exemplo-nome">{nomeServico}</span>
                      <span className="exemplo-igual"> = </span>
                      <span className="exemplo-valor">{servico.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )
                })}
                
                <div className="exemplo-espaco"></div>
              </div>
            )
          })}
          
          <div className="exemplo-total">
            <div className="exemplo-total-label">TOTAL</div>
            <div className="exemplo-total-valor">{totalGeral.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    carregarRelatorio()
  }, [periodo, ano, mes])

  const totalGeral = calcularTotalGeral()

  return (
    <div className="quinzenal-report">
      {/* CABEÇALHO COM CONTROLES */}
      <div className="report-controls">
        <div className="controls-header">
          <h2>📊 Relatório Quinzenal</h2>
          <div className="controls-subtitle">Formato de fechamento</div>
        </div>
        
        <div className="period-filters">
          <div className="filter-group">
            <label>Mês:</label>
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
          
          <div className="filter-group">
            <label>Ano:</label>
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
          
          <div className="period-buttons">
            <button 
              onClick={() => setPeriodo(1)}
              className={`period-button ${periodo === 1 ? 'active' : ''}`}
            >
              1ª Quinzena
            </button>
            <button 
              onClick={() => setPeriodo(2)}
              className={`period-button ${periodo === 2 ? 'active' : ''}`}
            >
              2ª Quinzena
            </button>
          </div>
          
          <button 
            onClick={carregarRelatorio}
            className="reload-button"
            disabled={loading}
          >
            {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
          </button>
        </div>
      </div>

      {/* VISUALIZAÇÃO NO FORMATO DO EXEMPLO */}
      <div className="formato-exemplo-container">
        {loading ? (
          <div className="loading-state">Carregando dados...</div>
        ) : resumoDiario.length === 0 ? (
          <div className="empty-state">
            📭 Nenhum atendimento registrado neste período
          </div>
        ) : (
          <>
            {renderizarFormatoExemplo()}
            
            {/* RESUMO ESTATÍSTICO */}
            <div className="resumo-estatistico">
              <div className="estatistica-card">
                <div className="estatistica-icon">📅</div>
                <div className="estatistica-content">
                  <div className="estatistica-valor">{resumoDiario.length}</div>
                  <div className="estatistica-label">dias trabalhados</div>
                </div>
              </div>
              
              <div className="estatistica-card">
                <div className="estatistica-icon">💇</div>
                <div className="estatistica-content">
                  <div className="estatistica-valor">
                    {resumoDiario.reduce((total, dia) => total + dia.itens.length, 0)}
                  </div>
                  <div className="estatistica-label">serviços realizados</div>
                </div>
              </div>
              
              <div className="estatistica-card total">
                <div className="estatistica-icon">💰</div>
                <div className="estatistica-content">
                  <div className="estatistica-valor">R$ {totalGeral.toFixed(2)}</div>
                  <div className="estatistica-label">total quinzena</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="action-buttons">
        <button 
          onClick={exportarComoTexto}
          className="action-button export"
          disabled={resumoDiario.length === 0}
        >
          📥 Exportar .TXT (formato exemplo)
        </button>
        
        <button 
          onClick={() => {
            // Função para copiar no formato
            const { labelHeader } = getPeriodDates(periodo, ano, mes)
            let texto = `Fechamento ${labelHeader}\n\n`
            
            resumoDiario.forEach(dia => {
              const dataFormatada = new Date(dia.data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
              }).replace(/\//g, '/')
              
              texto += `${dataFormatada}\n`
              
              const servicosAgrupados = dia.itens.reduce((acc, item) => {
                const servicoNome = formatarNomeServico(item.servicos.nome, 1, item.tipo)
                const key = servicoNome
                
                if (!acc[key]) {
                  acc[key] = {
                    nome: servicoNome,
                    quantidade: 0,
                    valorUnitario: item.valor,
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
            })
            
            texto += `\nTOTAL ${totalGeral.toFixed(2).replace('.', ',')}\n`
            
            navigator.clipboard.writeText(texto)
            alert('Relatório copiado para a área de transferência!')
          }}
          className="action-button copy"
          disabled={resumoDiario.length === 0}
        >
          📋 Copiar Formato
        </button>
        
        <button 
          onClick={() => window.print()}
          className="action-button print"
          disabled={resumoDiario.length === 0}
        >
          🖨️ Imprimir
        </button>
      </div>

      {/* ESTILOS PARA IMPRESSÃO */}
      <style>{`
        @media print {
          .report-controls,
          .action-buttons,
          .resumo-estatistico {
            display: none !important;
          }
          
          .formato-exemplo-container {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .exemplo-format {
            font-family: 'Courier New', monospace !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default QuinzenalReport