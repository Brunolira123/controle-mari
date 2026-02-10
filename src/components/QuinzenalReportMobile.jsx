// src/components/QuinzenalReportMobile.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import jsPDF from 'jspdf'
import './QuinzenalReportMobile.css'

export function QuinzenalReportMobile() {
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [resumoDiario, setResumoDiario] = useState([])
  const [expandedDay, setExpandedDay] = useState(null)
  const [viewMode, setViewMode] = useState('cards')
  const [generatingPDF, setGeneratingPDF] = useState(false)

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

  function getCurrentPeriod() {
    const hoje = new Date()
    const dia = hoje.getDate()
    return dia <= 15 ? 1 : 2
  }

  // Função para verificar se uma data existe
  function dataExiste(year, month, day) {
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day
  }

  // Função para obter o último dia válido de um mês
  function getUltimoDiaMes(year, month) {
    return new Date(year, month, 0).getDate()
  }

  // FUNÇÃO SEGURA para obter datas do período
  function getPeriodDates(period, year, month) {
    const mesStr = month.toString().padStart(2, '0')
    const anoStr = year.toString().slice(2, 4)
    
    if (period === 1) {
      // 1ª Quinzena: 01 a 15 (sempre válido)
      return {
        inicio: `${year}-${mesStr}-01`,
        fim: `${year}-${mesStr}-15`,
        label: `01/${mesStr}/${anoStr} a 15/${mesStr}/${anoStr}`,
        labelShort: `1ª Quinzena`,
        periodo: 1
      }
    } else {
      // 2ª Quinzena: Lógica inteligente
      const ultimoDiaReal = getUltimoDiaMes(year, month)
      
      // Se o mês tem menos de 30 dias (fevereiro), ajusta
      if (ultimoDiaReal < 30) {
        // Para meses com menos de 30 dias, 2ª quinzena é 16 até o último dia
        return {
          inicio: `${year}-${mesStr}-16`,
          fim: `${year}-${mesStr}-${ultimoDiaReal.toString().padStart(2, '0')}`,
          label: `16/${mesStr}/${anoStr} a ${ultimoDiaReal}/${mesStr}/${anoStr}`,
          labelShort: `2ª Quinzena`,
          periodo: 2,
          temApenas16aUltimo: true
        }
      } else {
        // Para meses com 30+ dias, 2ª quinzena é 16 a 30 (ignora 31)
        return {
          inicio: `${year}-${mesStr}-16`,
          fim: `${year}-${mesStr}-30`,
          label: `16/${mesStr}/${anoStr} a 30/${mesStr}/${anoStr}`,
          labelShort: `2ª Quinzena`,
          periodo: 2,
          temApenas16a30: true
        }
      }
    }
  }

  const formatarDataSegura = (dataString, opcoes = {}) => {
    if (!dataString) return 'Sem data'
    
    try {
      const [ano, mes, dia] = dataString.split('-').map(Number)
      
      if (!dataExiste(ano, mes, dia)) {
        return dataString
      }
      
      const data = new Date(ano, mes - 1, dia)
      
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

  const formatarDataCurta = (dataString) => {
    if (!dataString) return ''
    
    try {
      const [ano, mes, dia] = dataString.split('-').map(Number)
      return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}`
    } catch (error) {
      return dataString
    }
  }

  // FUNÇÃO ROBUSTA para carregar relatório
  async function carregarRelatorio() {
    setLoading(true)
    
    try {
      const { inicio, fim, periodo: periodoAtual, temApenas16a30, temApenas16aUltimo } = getPeriodDates(periodo, ano, mes)
      
      console.log('📅 Período selecionado:', {
        periodo: periodoAtual,
        inicio,
        fim,
        mes,
        ano
      })

      let todosDados = []

      // ESTRATÉGIA 1: Busca normal (para períodos com datas válidas)
      try {
        console.log('🔍 Tentando busca normal...')
        const { data: dadosBusca, error } = await supabase
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

        if (error) {
          console.warn('⚠️ Erro na busca normal:', error.message)
          throw error // Força ir para a estratégia 2
        }

        todosDados = dadosBusca || []
        console.log(`✅ Busca normal: ${todosDados.length} registros`)

      } catch (erroBusca) {
        console.log('🔄 Busca normal falhou, usando estratégia alternativa...')
        
        // ESTRATÉGIA 2: Busca por dias individuais (à prova de erros)
        todosDados = await buscarPorDiasIndividuais()
      }

      // APLICA REGRAS DE FILTRAGEM ESPECÍFICAS
      if (periodoAtual === 2) {
        console.log('🔧 Aplicando filtros para 2ª quinzena...')
        
        if (temApenas16a30) {
          // Filtra apenas dias 16-30 (remove qualquer 31)
          const antes = todosDados.length
          todosDados = todosDados.filter(item => {
            const dia = parseInt(item.data.split('-')[2])
            return dia >= 16 && dia <= 30
          })
          console.log(`🔧 Mantidos ${todosDados.length} de ${antes} registros (16-30)`)
        } else if (temApenas16aUltimo) {
          // Já está correto (16 até último dia do mês)
          console.log(`🔧 Período já correto: 16 até ${getUltimoDiaMes(ano, mes)}`)
        }
      }

      // ADICIONA DIA 31 DO MÊS ANTERIOR (para 1ª quinzena)
      if (periodoAtual === 1) {
        console.log('🔍 Verificando dia 31 do mês anterior...')
        
        let mesAnterior = mes - 1
        let anoAnterior = ano
        
        if (mesAnterior === 0) {
          mesAnterior = 12
          anoAnterior = ano - 1
        }
        
        // Verifica se o mês anterior tem dia 31
        if (getUltimoDiaMes(anoAnterior, mesAnterior) >= 31) {
          const mesAnteriorStr = mesAnterior.toString().padStart(2, '0')
          const dataDia31 = `${anoAnterior}-${mesAnteriorStr}-31`
          
          const { data: dadosDia31, error: error31 } = await supabase
            .from('agendamentos')
            .select(`
              *,
              clientes!inner(nome),
              servicos!inner(nome, comissao_salao, comissao_indicacao)
            `)
            .eq('status', 'realizado')
            .eq('data', dataDia31)

          if (!error31 && dadosDia31 && dadosDia31.length > 0) {
            console.log(`✅ Adicionando ${dadosDia31.length} atendimento(s) do dia 31`)
            todosDados = [...dadosDia31, ...todosDados]
          }
        }
      }

      console.log(`🎯 Dados processados: ${todosDados.length} registros`)
      agruparPorDia(todosDados)
      
    } catch (error) {
      console.error('❌ Erro crítico ao carregar relatório:', error)
      alert('Erro ao carregar relatório. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar dados por dias individuais (à prova de erros)
  async function buscarPorDiasIndividuais() {
    console.log('🔄 Buscando dados por dias individuais...')
    
    const mesStr = mes.toString().padStart(2, '0')
    let todosDados = []
    
    if (periodo === 1) {
      // 1ª Quinzena: dias 01 a 15
      for (let dia = 1; dia <= 15; dia++) {
        if (dataExiste(ano, mes, dia)) {
          const dataBusca = `${ano}-${mesStr}-${dia.toString().padStart(2, '0')}`
          const { data, error } = await buscarDiaEspecifico(dataBusca)
          if (!error && data) {
            todosDados = [...todosDados, ...data]
          }
        }
      }
    } else {
      // 2ª Quinzena: precisa determinar o intervalo correto
      const ultimoDiaMes = getUltimoDiaMes(ano, mes)
      const diaInicio = 16
      const diaFim = ultimoDiaMes >= 30 ? 30 : ultimoDiaMes
      
      console.log(`📅 Buscando dias ${diaInicio} a ${diaFim}...`)
      
      for (let dia = diaInicio; dia <= diaFim; dia++) {
        if (dataExiste(ano, mes, dia)) {
          const dataBusca = `${ano}-${mesStr}-${dia.toString().padStart(2, '0')}`
          const { data, error } = await buscarDiaEspecifico(dataBusca)
          if (!error && data) {
            todosDados = [...todosDados, ...data]
          }
        }
      }
    }
    
    console.log(`✅ Busca individual: ${todosDados.length} registros`)
    return todosDados
  }

  // Função auxiliar para buscar um dia específico
  async function buscarDiaEspecifico(data) {
    try {
      const { data: result, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes!inner(nome),
          servicos!inner(nome, comissao_salao, comissao_indicacao)
        `)
        .eq('status', 'realizado')
        .eq('data', data)
      
      return { data: result || [], error }
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar data ${data}:`, error.message)
      return { data: [], error }
    }
  }

  // DEBUG: Verificar dados do banco
  async function verificarDadosDebug() {
    console.log('=== 🐛 DEBUG COMPLETO ===')
    
    // Verifica dia 31/01/2026
    console.log('1. Buscando dia 31/01/2026...')
    const { data: dia31 } = await buscarDiaEspecifico('2026-01-31')
    console.log('Dia 31/01/2026:', dia31.data)
    
    // Verifica datas de fevereiro
    console.log('\n2. Verificando datas de fevereiro 2026...')
    const fevereiro2026 = []
    for (let dia = 1; dia <= 29; dia++) {
      if (dataExiste(2026, 2, dia)) {
        fevereiro2026.push(`${dia.toString().padStart(2, '0')}/02`)
      }
    }
    console.log('Datas válidas fev/2026:', fevereiro2026)
    
    // Verifica lógica do período
    console.log('\n3. Verificando lógica de períodos...')
    const periodosTeste = [
      { mes: 1, periodo: 2, ano: 2026 },
      { mes: 2, periodo: 2, ano: 2026 },
      { mes: 3, periodo: 2, ano: 2026 },
      { mes: 4, periodo: 2, ano: 2026 }
    ]
    
    for (const teste of periodosTeste) {
      const dates = getPeriodDates(teste.periodo, teste.ano, teste.mes)
      console.log(`${teste.mes}/${teste.ano} - ${teste.periodo}ª:`, {
        inicio: dates.inicio,
        fim: dates.fim,
        label: dates.label
      })
    }
    
    alert('✅ Debug completo! Verifique o console (F12)')
  }

  // Funções auxiliares (mantidas do código anterior)
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
    setExpandedDay(null)
  }

  function calcularTotalGeral() {
    return resumoDiario.reduce((total, dia) => total + dia.totalDia, 0)
  }

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

  // Gerar PDF
  function gerarPDF() {
    if (resumoDiario.length === 0) return
    
    setGeneratingPDF(true)
    
    try {
      const doc = new jsPDF()
      const { label } = getPeriodDates(periodo, ano, mes)
      const totalGeral = calcularTotalGeral()
      
      let y = 20
      const lineHeight = 7
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      
      // Título
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('FECHAMENTO QUINZENAL', margin, y)
      y += 10
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(label, margin, y)
      y += 15
      
      // Conteúdo
      doc.setFontSize(10)
      
      resumoDiario.forEach(dia => {
        if (y > pageHeight - 40) {
          doc.addPage()
          y = 20
        }
        
        const dataFormatada = formatarDataCurta(dia.data)
        doc.setFont('helvetica', 'bold')
        doc.text(dataFormatada, margin, y)
        y += lineHeight
        
        // Agrupar serviços
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
          if (y > pageHeight - 20) {
            doc.addPage()
            y = 20
          }
          
          const quantidadeTexto = servico.quantidade > 1 ? `${servico.quantidade} ` : '1 '
          const nomeServico = servico.quantidade > 1 
            ? servico.nome.replace('penteado', 'penteados')
            : servico.nome
          
          const linha = `${quantidadeTexto}${nomeServico} = R$ ${servico.total.toFixed(2).replace('.', ',')}`
          doc.setFont('helvetica', 'normal')
          doc.text(linha, margin + 5, y)
          y += lineHeight
        })
        
        y += 5
      })
      
      // Total
      if (y > pageHeight - 30) {
        doc.addPage()
        y = 20
      }
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL:', margin, y)
      doc.text(`R$ ${totalGeral.toFixed(2).replace('.', ',')}`, 150, y, { align: 'right' })
      
      const nomeArquivo = `fechamento_${ano}_${mes}_quinzena_${periodo}.pdf`
      doc.save(nomeArquivo)
      
      alert('✅ PDF gerado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('❌ Erro ao gerar PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  function exportarComoTexto() {
    const { label } = getPeriodDates(periodo, ano, mes)
    let texto = `Fechamento ${label}\n\n`
    
    let totalGeral = 0
    
    resumoDiario.forEach(dia => {
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

  function copiarParaClipboard() {
    const { label } = getPeriodDates(periodo, ano, mes)
    let texto = `Fechamento ${label}\n\n`
    
    let totalGeral = 0
    
    resumoDiario.forEach(dia => {
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

  useEffect(() => {
    carregarRelatorio()
  }, [periodo, ano, mes])

  const totalGeral = calcularTotalGeral()
  const { labelShort, label } = getPeriodDates(periodo, ano, mes)
  const totalServicos = resumoDiario.reduce((total, dia) => total + dia.itens.length, 0)
  const ultimoDiaMes = getUltimoDiaMes(ano, mes)

  return (
    <div className="quinzenal-mobile">
      {/* Header */}
      <div className="report-header">
        <div className="header-title">
          <span className="header-icon">📊</span>
          <div className="header-text">
            <h1>Relatório</h1>
            <p className="header-subtitle">{labelShort}</p>
          </div>
        </div>
        
        <div className="header-buttons">
          <button 
            onClick={carregarRelatorio}
            className="header-refresh"
            disabled={loading}
            title="Atualizar"
          >
            {loading ? '🔄' : '🔄'}
          </button>
          
          <button 
            onClick={verificarDadosDebug}
            className="debug-btn"
            title="Debug"
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              marginLeft: '8px',
              fontSize: '16px'
            }}
          >
            🐛
          </button>
        </div>
      </div>

      {/* Filtros */}
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
        
        {/* Info do período */}
        <div className="period-info" style={{
          background: '#e8f4fd',
          border: '1px solid #b6d4fe',
          borderRadius: '6px',
          padding: '8px',
          marginTop: '10px',
          fontSize: '12px',
          color: '#084298',
          textAlign: 'center'
        }}>
          <div><strong>{label}</strong></div>
          <small>
            {periodo === 2 && ultimoDiaMes < 30 && 
              `(Fevereiro tem apenas ${ultimoDiaMes} dias)`}
          </small>
        </div>
      </div>

      {/* View Mode */}
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

      {/* Stats */}
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

      {/* Loading/Empty */}
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
                          {formatarNomeServico(item.servicos?.nome || 'Serviço', 1)}
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
            <small>{label}</small>
          </div>
          
          <div className="text-content">
            {resumoDiario.map(dia => {
              const dataFormatada = formatarDataCurta(dia.data)
              
              return (
                <div key={dia.data} className="text-day">
                  <div className="text-date">{dataFormatada}</div>
                  
                  {Object.values(dia.itens.reduce((acc, item) => {
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
                  }, {})).map((servico, idx) => {
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

      {/* Action Buttons */}
      {resumoDiario.length > 0 && (
        <div className="action-buttons-compact">
          <button 
            onClick={exportarComoTexto}
            className="action-btn export"
            disabled={generatingPDF}
          >
            <span className="btn-icon">📥</span>
            <span className="btn-text">Exportar TXT</span>
          </button>
          
          <button 
            onClick={copiarParaClipboard}
            className="action-btn copy"
            disabled={generatingPDF}
          >
            <span className="btn-icon">📋</span>
            <span className="btn-text">Copiar</span>
          </button>
          
          <button 
            onClick={gerarPDF}
            className="action-btn pdf"
            disabled={generatingPDF}
          >
            <span className="btn-icon">
              {generatingPDF ? '⏳' : '📄'}
            </span>
            <span className="btn-text">
              {generatingPDF ? 'Gerando...' : 'Gerar PDF'}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default QuinzenalReportMobile