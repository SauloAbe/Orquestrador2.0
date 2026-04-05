import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const INTERVALO_MS = 30000;

function parsearRespostaIA(texto) {
  try {
    const textoLimpo = texto.replace(/```json|```/g, "").trim();
    const match = textoLimpo.match(/\[[\s\S]*\]/); 
    return match ? JSON.parse(match[0]) : null;
  } catch (e) { return null; }
}

function formatarValor(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '—';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CardAnalise({ analise, ativo }) {
  const [registrando, setRegistrando] = useState(false);

  const config = {
    COMPRA:   { borda: 'border-emerald-500', bg: 'bg-emerald-50',  badge: 'bg-emerald-500 text-white', icone: '📈' },
    VENDA:    { borda: 'border-rose-500',    bg: 'bg-rose-50',     badge: 'bg-rose-500 text-white',    icone: '📉' },
    AGUARDAR: { borda: 'border-slate-300',   bg: 'bg-slate-50',    badge: 'bg-slate-500 text-white',   icone: '⏳' },
  };
  const estilo = config[analise.acao] || config.AGUARDAR;

  const validarEstrategia = () => {
    setRegistrando(true);
    const entradaLimpa = parseFloat(analise.regiao_entrada.toString().replace(/[^0-9.]/g, '')) || 0;

    fetch('http://127.0.0.1:8000/api/v1/auditoria/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ativo: ativo,
        estrategia: analise.estrategia,
        acao: analise.acao,
        preco_entrada: entradaLimpa,
        alvo: parseFloat(analise.alvo) || 0,
        stop_loss: parseFloat(analise.stop_loss) || 0
      })
    })
    .then(() => alert(`✅ Auditoria Registrada: ${analise.estrategia}`))
    .catch(err => alert("Erro ao registrar: " + err))
    .finally(() => setRegistrando(false));
  };

  return (
    <div className={`rounded-2xl border-2 ${estilo.borda} ${estilo.bg} p-5 space-y-4 shadow-sm animate-in fade-in duration-300`}>
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-black bg-white border px-2 py-1 rounded text-slate-500 uppercase tracking-tighter">
          Setup: {analise.estrategia}
        </span>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${estilo.badge}`}>{analise.forca_sinal}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{estilo.icone}</span>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{analise.acao}</h3>
      </div>
      {analise.acao !== 'AGUARDAR' && (
        <div className="grid grid-cols-1 gap-2 text-[11px] font-mono">
          <div className="flex justify-between bg-white/60 p-2 rounded"><span>Entrada:</span> <b>{analise.regiao_entrada}</b></div>
          <div className="flex justify-between bg-white/60 p-2 rounded text-emerald-700"><span>Alvo:</span> <b>{formatarValor(analise.alvo)}</b></div>
          <div className="flex justify-between bg-white/60 p-2 rounded text-rose-700"><span>Stop:</span> <b>{formatarValor(analise.stop_loss)}</b></div>
          <button onClick={validarEstrategia} disabled={registrando} className="w-full mt-2 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-black uppercase tracking-widest active:scale-95 transition-all">
            {registrando ? 'Registrando...' : '🎯 Validar Estratégia'}
          </button>
        </div>
      )}
      <p className="text-[11px] text-slate-600 leading-tight italic">"{analise.racional}"</p>
    </div>
  );
}

function PainelAnaliseIA({ ativo }) {
  const [prompt, setPrompt] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [respostaIA, setRespostaIA] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [analises, setAnalises] = useState(() => {
    const salva = localStorage.getItem(`analises_${ativo}`);
    return salva ? JSON.parse(salva) : null;
  });
  const [gerandoPrompt, setGerandoPrompt] = useState(false);

  const gerarPrompt = useCallback(() => {
    setGerandoPrompt(true);
    fetch(`http://127.0.0.1:8000/api/v1/prompt/${ativo}`)
      .then(res => res.json())
      .then(json => {
        setPrompt(json.prompt);
        setSnapshot(json.snapshot);
        setCopiado(false);
      }).finally(() => setGerandoPrompt(false));
  }, [ativo]);

  const copiarPrompt = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const processarResposta = () => {
    const resultado = parsearRespostaIA(respostaIA);
    if (resultado && Array.isArray(resultado)) {
      setAnalises(resultado);
      localStorage.setItem(`analises_${ativo}`, JSON.stringify(resultado));
      setRespostaIA('');
    } else { alert("Resposta inválida. A IA deve retornar um Array JSON."); }
  };

  const limparPainel = () => {
    setPrompt('');
    setSnapshot(null);
    setRespostaIA('');
    setCopiado(false);
  };

  return (
    <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Comitê Orquestrador</h2>
        <div className="flex gap-3">
          {(prompt || snapshot) && (
            <button onClick={limparPainel} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">🧹 Limpar</button>
          )}
          <button onClick={gerarPrompt} disabled={gerandoPrompt} className="px-6 py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-100 active:scale-95 transition-all">
            {gerandoPrompt ? 'Processando...' : '⚡ Gerar Prompt Multiestratégia'}
          </button>
        </div>
      </div>

      {snapshot && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          {Object.entries(snapshot).filter(([k])=>k!=='time').map(([key, val]) => (
            <div key={key} className="text-center bg-white p-2 rounded-xl border border-slate-100">
              <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">{key}</p>
              <p className="text-xs font-black text-slate-700 font-mono">{formatarValor(val)}</p>
            </div>
          ))}
        </div>
      )}

      {prompt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          <div className="space-y-3 relative group">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. Copiar Prompt Mestre</p>
            <textarea readOnly value={prompt} className="w-full bg-slate-900 text-slate-500 font-mono text-[9px] p-4 rounded-xl h-44 resize-none border border-slate-800 focus:outline-none" />
            <button onClick={copiarPrompt} className={`absolute top-10 right-3 px-4 py-1.5 text-[9px] font-bold rounded-lg transition-all ${copiado ? 'bg-emerald-500 text-white scale-105' : 'bg-slate-700 text-slate-300'}`}>
              {copiado ? '✓ COPIADO' : 'COPIAR'}
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Colar Resposta JSON</p>
            <textarea value={respostaIA} onChange={e=>setRespostaIA(e.target.value)} placeholder="Cole o Array JSON retornado pela IA..." className="w-full border-2 border-slate-100 p-4 rounded-xl h-44 text-[10px] font-mono focus:border-violet-300 outline-none transition-colors resize-none" />
            <button onClick={processarResposta} disabled={!respostaIA.trim()} className="w-full py-2.5 bg-slate-800 text-white text-[10px] font-bold rounded-xl hover:bg-black active:scale-95 transition-all">PROCESSAR COMITÊ →</button>
          </div>
        </div>
      )}

      {analises && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-4">
          {analises.map((item, idx) => <CardAnalise key={idx} analise={item} ativo={ativo} />)}
        </div>
      )}
    </section>
  );
}

function App() {
  const [dados, setDados] = useState([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const buscarDados = useCallback(() => {
    fetch(`http://127.0.0.1:8000/api/v1/sinais/btcusd?t=${Date.now()}`)
      .then(res => res.json())
      .then(json => {
        if (json.sinais) {
          setDados(json.sinais);
          setUltimaAtualizacao(new Date());
        }
      }).catch(err => console.error("Erro API:", err));
  }, []);

  useEffect(() => {
    buscarDados();
    const intervalo = setInterval(buscarDados, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [buscarDados]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans antialiased text-slate-900">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Orquestrador <span className="text-blue-600">2.0</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-1">Advanced Audit System</p>
        </div>
        <div className="text-right hidden md:block bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-2 justify-end mb-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Terminal Live
          </p>
          <p className="text-[10px] font-mono text-slate-400 uppercase font-black">{ultimaAtualizacao?.toLocaleTimeString() || 'Sincronizando...'}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        <section className="bg-white p-7 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="close" name="Preço" stroke="#0f172a" strokeWidth={4} dot={false} animationDuration={800} />
                <Line type="monotone" dataKey="sma_9" name="SMA 9" stroke="#3b82f6" strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="sma_21" name="SMA 21" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <PainelAnaliseIA ativo="btcusd" />
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...dados].reverse().slice(0, 9).map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded italic">{s.time.split(' ')[1]}</span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full text-white ${s.tendencia.includes('ALTA') ? 'bg-emerald-500' : 'bg-rose-500'}`}>{s.tendencia}</span>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight mb-6">{formatarValor(s.close)}</p>
              <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                <span className="text-[11px] font-bold text-blue-600">RSI: {s.rsi_14.toFixed(2)}</span>
                <span className="text-[9px] font-black bg-slate-100 p-2 rounded-lg uppercase text-slate-500">{s.momentum}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
      <footer className="max-w-7xl mx-auto mt-24 pb-12 text-center">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Orquestrador 2.0 · PrepAção © 2026</p>
      </footer>
    </div>
  );
}

export default App;