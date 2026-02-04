import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'
import ServiceForm from './components/ServiceForm.jsx'
import DailyChecklist from './components/DailyChecklist.jsx'
import QuinzenalReportMobile from './components/QuinzenalReportMobile.jsx' // Nova versão
import Header from './components/Header.jsx'
import FooterMobile from './components/FooterMobile.jsx'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('login')

  // Verificar se já tem usuário salvo no localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('mock_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        setCurrentView('dashboard')
      } catch (err) {
        console.log('Não foi possível restaurar sessão')
        localStorage.removeItem('mock_user')
        localStorage.removeItem('mock_token')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentView('dashboard')
    console.log(`👋 Bem-vindo(a), ${userData.nome}!`)
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('login')
    localStorage.removeItem('mock_user')
    localStorage.removeItem('mock_token')
    console.log('👋 Logout realizado')
  }

  const views = {
    login: <Login onLogin={handleLogin} />,
    dashboard: user ? <Dashboard onNavigate={setCurrentView} user={user} /> : null,
    agendar: user ? <ServiceForm onSuccess={() => setCurrentView('dashboard')} user={user} /> : null,
    fechar: user ? <DailyChecklist onBack={() => setCurrentView('dashboard')} /> : null,
    quinzenal: user ? <QuinzenalReportMobile onBack={() => setCurrentView('dashboard')} /> : null, // Nova versão
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">✂️</div>
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="app">
      {user && currentView !== 'login' && (
        <Header 
          title={getTitle(currentView)}
          user={user}
          onBack={currentView !== 'dashboard' ? () => setCurrentView('dashboard') : null}
          onLogout={handleLogout}
        />
      )}
      
      <main className="main-content">
        {views[currentView] || views.login}
      </main>

      {/* Footer Mobile otimizado para celular */}
      <FooterMobile 
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
      />
    </div>
  )
}

function getTitle(view) {
  const titles = {
    dashboard: 'Dashboard',
    agendar: 'Agendar',
    fechar: 'Fechar',
    quinzenal: 'Relatórios',
    perfil: 'Perfil'
  }
  return titles[view] || 'Salão App'
}

export default App