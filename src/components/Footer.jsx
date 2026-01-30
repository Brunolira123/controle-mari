import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import './Footer.css';

function Footer({ currentView, onNavigate, user }) {
  const [stats, setStats] = useState({
    hoje: 0,
    semana: 0,
    mes: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Carregar estatísticas rápidas
  useEffect(() => {
    if (user && currentView !== 'login') {
      loadQuickStats();
    }
  }, [user, currentView]);

  async function loadQuickStats() {
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];
    
    try {
      // Agendamentos de hoje
      const { data: hojeData } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', hoje)
        .eq('status', 'agendado');

      // Total da semana
      const semanaPassada = new Date();
      semanaPassada.setDate(semanaPassada.getDate() - 7);
      
      const { data: semanaData } = await supabase
        .from('agendamentos')
        .select('valor')
        .gte('data', semanaPassada.toISOString().split('T')[0])
        .eq('status', 'realizado');

      // Total do mês
      const primeiroDiaMes = new Date();
      primeiroDiaMes.setDate(1);
      
      const { data: mesData } = await supabase
        .from('agendamentos')
        .select('valor')
        .gte('data', primeiroDiaMes.toISOString().split('T')[0])
        .eq('status', 'realizado');

      const totalSemana = semanaData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0;
      const totalMes = mesData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0;

      setStats({
        hoje: hojeData?.length || 0,
        semana: totalSemana,
        mes: totalMes
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  // Não mostrar footer na página de login
  if (currentView === 'login' || !user) {
    return null;
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Seção de Navegação Rápida */}
        <div className="footer-section">

          
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} Salão App • v1.0</p>
            <p className="footer-version">Sistema de Gestão Profissional</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;