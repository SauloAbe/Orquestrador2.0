import { useState, useEffect } from 'react';

function App() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/sinais/btcusd')
      .then(resposta => resposta.json())
      .then(json => {
        // Inverte a ordem para a vela mais nova aparecer primeiro no topo
        if (json.sinais) {
          const sinaisOrdenados = [...json.sinais].reverse();
          setDados(sinaisOrdenados);
        }
        setCarregando(false);
      })
      .catch(erro => {
        console.error("Erro ao conectar com a API:", erro);
        setCarregando(false);
      });
  }, []);

  // Helpers de Estilização Profissional
  const getEstiloTendencia = (tendencia) => {
    const isAlta = tendencia.includes('ALTA');
    return isAlta 
      ? 'bg-emerald-500 text-white shadow-emerald-200' 
      : 'bg-rose-500 text-white shadow-rose-200';
  };

  const getEstiloMomentum = (momentum) => {
    if (momentum.includes('SOBRECOMPRADO')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (momentum.includes('SOBREVENDIDO')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      
      {/* Cabeçalho Estilizado */}
      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-2 bg-blue-600 rounded-full"></div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              ORQUESTRADOR <span className="text-blue-600">2.0</span>
            </h1>
            <p className="text-slate-500 font-medium uppercase text-xs tracking-widest mt-1">
              Intelligence Data Analysis • BTC/USD Market
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {carregando ? (
          /* Skeleton Loading elegante */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dados.map((sinal, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Topo do Card: Time e Badge */}
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-400 font-mono italic">
                    {sinal.time.split(' ')[1]} {/* Pega apenas a hora */}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${getEstiloTendencia(sinal.tendencia)}`}>
                    {sinal.tendencia}
                  </span>
                </div>

                <div className="p-6">
                  {/* Preço Principal */}
                  <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Price</label>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">
                      $ {sinal.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Médias Móveis em Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">SMA 9</p>
                      <p className="text-sm font-bold text-slate-700">{sinal.sma_9.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">SMA 21</p>
                      <p className="text-sm font-bold text-slate-700">{sinal.sma_21.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Rodapé do Card: RSI e Momentum */}
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">RSI:</span>
                      <span className="text-lg font-black text-blue-600 italic">{sinal.rsi_14.toFixed(2)}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${getEstiloMomentum(sinal.momentum)}`}>
                      {sinal.momentum}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pb-8 text-center text-slate-400 text-xs font-medium border-t border-slate-200 pt-8">
        © 2026 Soluções em Dados - Orquestrador 2.0 • Status: <span className="text-emerald-500">Live Engine</span>
      </footer>
    </div>
  );
}

export default App;