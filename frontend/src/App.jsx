import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const INTERVALO_MS = 30000;

function parsearRespostaIA(texto) {
  try {
    const textoLimpo = texto.replace(/```json|```/g, "").trim();
    const match = textoLimpo.match(/\[[\s\S]*\]/); // Agora busca um Array [ ]
    return match ? JSON.parse(match[0]) : null;
  } catch (e) { return null; }
}

function formatarValor(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '—';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function CardAnalise({ analise }) {
  const config = {
    COMPRA:   { borda: 'border-emerald-500', bg: 'bg-emerald-50',  badge: 'bg-emerald-500 text-white', icone: '📈' },
    VENDA:    { borda: 'border-rose-500',    bg: 'bg-rose-50',     badge: 'bg-rose-500 text-white',    icone: '📉' },
    AGUARDAR: { borda: 'border-slate-300',   bg: 'bg-slate-50',    badge: 'bg-slate-500 text-white',   icone: '⏳' },
  };
  const estilo = config[analise.acao] || config.AGUARDAR;

  return (
    <div className={`rounded-2xl border-2 ${estilo.borda} ${estilo.bg} p-5 space-y-4 shadow-sm`}>
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-black bg-white border px-2 py-1 rounded text-slate-500 uppercase tracking-tighter">
          Setup: {analise.estrategia}
        </span>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${estilo.badge}`}>{analise.forca_sinal}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{estilo.icone}</span>
        <h3 className="text-xl font-black text-slate-800">{analise.acao}</h3>
      </div>
      {analise.acao !== 'AGUARDAR' && (
        <div className="grid grid-cols-1 gap-2 text-[11px] font-mono">
          <div className="flex justify-between bg-white/50 p-2 rounded"><span>Entrada:</span> <b>{analise.regiao_entrada}</b></div>
          <div className="flex justify-between bg-white/50 p-2 rounded text-emerald-700"><span>Alvo:</span> <b>{formatarValor(analise.alvo)}</b></div>
          <div className="flex justify-between bg-white/50 p-2 rounded text-rose-700"><span>Stop:</span> <b>{formatarValor(analise.stop_loss)}</b></div>
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
  const [analises, setAnalises] = useState(() => {
    const salva = localStorage.getItem(`analise_${ativo}`);
    return salva ? JSON.parse(salva) : null;
  });
  const [erroParser, setErroParser] = useState(false);
  const [gerandoPrompt, setGerandoPrompt] = useState(false);

  const gerarPrompt = useCallback(() => {
    setGerandoPrompt(true);
    fetch(`http://127.0.0.1:8000/api/v1/prompt/${ativo}`)
      .then(res => res.json())
      .then(json => {
        setPrompt(json.prompt);
        setSnapshot(json.snapshot);
      }).finally(() => setGerandoPrompt(false));
  }, [ativo]);

  const processarResposta = () => {
    const resultado = parsearRespostaIA(respostaIA);
    if (resultado && Array.isArray(resultado)) {
      setAnalises(resultado);
      localStorage.setItem(`analise_${ativo}`, JSON.stringify(resultado));
      setErroParser(false);
    } else { setErroParser(true); }
  };

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Comitê de Especialistas IA</h2>
        <button onClick={gerarPrompt} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-all">
          {gerandoPrompt ? 'Capturando Mercado...' : '⚡ Gerar Prompt Multiestratégia'}
        </button>
      </div>

      {snapshot && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(snapshot).filter(([k])=>k!=='time').map(([key, val]) => (
            <div key={key} className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <p className="text-[8px] uppercase font-bold text-slate-400">{key}</p>
              <p className="text-xs font-black text-slate-700 font-mono">{formatarValor(val)}</p>
            </div>
          ))}
        </div>
      )}

      {prompt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. Copie o Prompt</p>
            <textarea readOnly value={prompt} className="w-full bg-slate-900 text-slate-500 font-mono text-[9px] p-3 rounded-xl h-32 resize-none" />
            <button onClick={() => navigator.clipboard.writeText(prompt)} className="w-full py-2 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200">COPIAR TEXTO</button>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Cole o Resultado</p>
            <textarea value={respostaIA} onChange={e=>setRespostaIA(e.target.value)} placeholder="Cole o JSON retornado pela IA..." className="w-full border-2 p-3 rounded-xl h-32 text-[10px] font-mono focus:border-violet-300 outline-none" />
            <button onClick={processarResposta} className="w-full py-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg hover:bg-black">PROCESSAR COMITÊ →</button>
          </div>
        </div>
      )}

      {erroParser && <p className="text-rose-500 text-[10px] font-bold">⚠️ Formato de resposta inválido. A IA deve retornar um Array JSON.</p>}

      {analises && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          {analises.map((item, idx) => <CardAnalise key={idx} analise={item} />)}
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
      }).catch(err => console.error("Erro na API:", err));
  }, []);

  useEffect(() => {
    buscarDados();
    const intervalo = setInterval(buscarDados, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [buscarDados]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans antialiased text-slate-900">
      <header className="max-w-7xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ORQUESTRADOR <span className="text-blue-600">2.0</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] italic">Comitê de Estratégias Quantitativas</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-2 justify-end">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Terminal Live
          </p>
          <p className="text-[10px] font-mono text-slate-400">{ultimaAtualizacao?.toLocaleTimeString() || 'Sincronizando...'}</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto space-y-12">
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="close" name="Preço" stroke="#0f172a" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="sma_9" name="SMA 9" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="sma_21" name="SMA 21" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <PainelAnaliseIA ativo="btcusd" />
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...dados].reverse().slice(0, 6).map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-400">{s.time.split(' ')[1]}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full text-white ${s.tendencia.includes('ALTA') ? 'bg-emerald-500' : 'bg-rose-500'}`}>{s.tendencia}</span>
              </div>
              <p className="text-2xl font-black text-slate-900 mb-4">{formatarValor(s.close)}</p>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-blue-600">RSI: {s.rsi_14.toFixed(2)}</span>
                <span className="bg-slate-50 p-1 rounded uppercase">{s.momentum}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;