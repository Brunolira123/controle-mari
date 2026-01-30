// src/components/Login.jsx - VERSÃO MOCKADA
import { useState } from 'react'
import './Login.css'

// Dados mockados dos usuários
const MOCK_USERS = [
  {
    username: 'Tayla',
    password: '@Marielle1',
    nome: 'Tayla',
    email: 'salaotayla@.com',
    comissao_padrao: 0.6,
    meta_mensal: 5000,
    avatar: '👩‍🦰'
  },
  {
    username: 'Demo',
    password: 'demo123',
    nome: 'Usuário Demo',
    email: 'demo@salaoapp.com',
    comissao_padrao: 0.6,
    meta_mensal: 3000,
    avatar: '👤'
  },
  {
    username: 'Admin',
    password: 'admin123',
    nome: 'Administrador',
    email: 'admin@salao.com',
    comissao_padrao: 0.7,
    meta_mensal: 8000,
    avatar: '👑'
  }
]

function Login({ onLogin }) {
  const [form, setForm] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simular delay de rede
    setTimeout(() => {
      try {
        // Validar campos vazios
        if (!form.username.trim() || !form.password.trim()) {
          throw new Error('Preencha todos os campos')
        }

        // Buscar usuário
        const user = MOCK_USERS.find(u => 
          u.username.toLowerCase() === form.username.toLowerCase().trim()
        )

        // Verificar se usuário existe
        if (!user) {
          throw new Error('Usuário não encontrado')
        }

        // Verificar senha
        if (user.password !== form.password) {
          throw new Error('Senha incorreta')
        }

        // Login bem-sucedido
        console.log(`✅ Login realizado: ${user.username}`)
        
        // Criar objeto de usuário para passar ao app
        const userData = {
          id: `mock_${user.username.toLowerCase()}`,
          username: user.username,
          nome: user.nome,
          email: user.email,
          avatar: user.avatar,
          comissao_padrao: user.comissao_padrao,
          meta_mensal: user.meta_mensal,
          isMock: true // Flag para identificar que é mock
        }

        // Salvar no localStorage (opcional)
        localStorage.setItem('mock_user', JSON.stringify(userData))
        localStorage.setItem('mock_token', 'mock_jwt_token_' + Date.now())

        // Chamar callback de sucesso
        onLogin(userData)

      } catch (err) {
        console.error('❌ Erro no login:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 800) // 800ms de delay para simular rede
  }

  const handleQuickLogin = (username, password) => {
    setForm({ username, password })
    
    // Aguardar um pouco para ver os campos preenchidos
    setTimeout(() => {
      handleSubmit(new Event('submit'))
    }, 300)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* CABEÇALHO */}
        <div className="login-header">
          <div className="login-icon">✂️</div>
          <h1 className="login-title">Salão App</h1>
          <p className="login-subtitle">Gestão profissional • Modo Offline</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">👤</span>
              Usuário
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})}
              className="form-input"
              placeholder="Digite seu usuário"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🔒</span>
              Senha
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="form-input"
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.username || !form.password}
            className="login-button"
          >
            {loading ? (
              <>
                <span className="spinner">⏳</span>
                Verificando...
              </>
            ) : (
              <>
                <span className="button-icon">🚪</span>
                Entrar
              </>
            )}
          </button>
        </form>

        {/* LOGINS RÁPIDOS */}
        <div className="quick-logins">
          <h3 className="quick-logins-title">👥 Acessos Rápidos</h3>
          
            </div>

        {/* DICAS */}
        <div className="login-tips">
          <div className="tip">
            <span className="tip-icon">💡</span>
            <strong>Tayla:</strong> Usuário: Tayla • Senha: @Marielle1
          </div>
          <div className="tip">
            <span className="tip-icon">📱</span>
            Modo offline • Dados salvos localmente
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="login-footer">
        <p>© {new Date().getFullYear()} Salão App • v1.0 • Modo Mock</p>
        <p className="footer-version">
          Usando autenticação local • Sem conexão com servidor
        </p>
      </div>
    </div>
  )
}

export default Login