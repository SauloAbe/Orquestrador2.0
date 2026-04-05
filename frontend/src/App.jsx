import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const INTERVALO_MS = 30000;

function parsearRespostaIA(texto) {
  try {
    const textoLimpo = texto.replace(/```json|```/g, "").trim();
    const match = textoLimpo.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) { return null; }
}

function formatarValor(valor) {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CardAnalise({ analise }) {
  const config = {
    COMPRA:   { borda: 'border-emerald-500', bg: 'bg-emerald-50',  badge: 'bg-emerald-500 text-white', icone: '📈' },
    VENDA:    { borda: 'border-rose-500',    bg: 'bg-rose-50',     badge: 'bg-rose-500 text-white',    icone: '📉' },
    AGUARDAR: { borda: 'border-slate-300',   bg: 'bg-slate-50',    badge: 'bg-slate-500 text-white',   icone: '⏳' },
  };
  const estilo = config[analise.acao] || config.AGUARDAR;

  return (
    <div className={`rounded-2xl border-2 ${estilo.borda} ${estilo.bg} p-6 mt-6 space-y-5 shadow-sm animate-in fade-in duration-500`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{estilo.icone}</span>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Veredito da IA</p>
            <p className="text-2xl font-black text-slate-800">{analise.acao}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Confiança</p>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${estilo.badge}`}>{analise.forca_sinal ?? '—'}</span>
        </div>
      </div>
      {analise.acao !== 'AGUARDAR' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-center font-mono">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Entrada</p>
            <p className="text-sm font-black text-slate-800">{analise.regiao_entrada ?? '—'}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-emerald-200 text-center font-mono">
            <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Alvo</p>
            <p className="text-sm font-black text-emerald-700">{formatarValor(analise.alvo)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-200 text-center font-mono">
            <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Stop</p>
            <p className="text-sm font-black text-rose-700">{formatarValor(analise.stop_loss)}</p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <p className="text-sm text-slate-700 leading-relaxed italic">"{analise.racional}"</p>
      </div>
    </div>
  );
}

function PainelAnaliseIA({ ativo }) {
  const [prompt, setPrompt] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [respostaIA, setRespostaIA] = useState('');
  const [analise, setAnalise] = useState(() => {
    const salva = localStorage.getItem(`analise_${ativo}`);
    return salva ? JSON.parse(salva) : null;
  });
  const [erroParser, setErroParser] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [gerandoPrompt, setGerandoPrompt] = useState(false);

  const gerarPrompt = useCallback(() => {
    setGerandoPrompt(true);
    fetch(`http://127.0.0.1:8000/api/v1/prompt/${ativo}`)
      .then(res => res.json())
      .then(json => {
        setPrompt(json.prompt);
        setSnapshot(json.snapshot);
      })
      .finally(() => setGerandoPrompt(false));
  }, [ativo]);

  const copiarPrompt = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const processarResposta = () => {
    const resultado = parsearRespostaIA(respostaIA);
    if (resultado) {
      setAnalise(resultado);
      localStorage.setItem(`analise_${ativo}`, JSON.stringify(resultado));
      setErroParser(false);
    } else { setErroParser(true); }
  };

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-xs">AI</div>
          Conselho Estratégico
        </h2>
        <div className="flex gap-2">
          <a href="https://claude.ai" target="_blank" className="text-[9px] font-bold bg-slate-100 p-1 rounded">CLAUDE</a>
          <a href="https://chatgpt.com" target="_blank" className="text-[9px] font-bold bg-slate-100 p-1 rounded">GPT</a>
        </div>
      </div>
      <button onClick={gerarPrompt} disabled={gerandoPrompt} className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg">
        {gerandoPrompt ? 'Capturando Dados...' : '⚡ Gerar Prompt para IA'}
      </button>
      {snapshot && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(snapshot).filter(([k]) => k !== 'time').map(([key, val]) => (
            <div key={key} className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
              <p className="text-[8px] uppercase font-bold text-slate-400">{key}</p>
              <p className="text-xs font-black text-slate-700 font-mono">{formatarValor(val)}</p>
            </div>
          ))}
        </div>
      )}
      {prompt && (
        <div className="space-y-3">
          <textarea readOnly value={prompt} rows={3} className="w-full bg-slate-900 text-slate-400 font-mono text-[10px] p-4 rounded-xl resize-none" />
          <button onClick={copiarPrompt} className={`w-full py-2 text-xs font-bold rounded-lg ${copiado ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
            {copiado ? '✓ COPIADO' : 'COPIAR PROMPT'}
          </button>
          <textarea value={respostaIA} onChange={e => setRespostaIA(e.target.value)} placeholder="Cole o JSON da IA aqui..." className="w-full border-2 p-4 rounded-xl text-xs font-mono" rows={3} />
          <button onClick={processarResposta} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">Processar Análise →</button>
        </div>
      )}
      {analise && <CardAnalise analise={analise} />}
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
      });
  }, []);

  useEffect(() => {
    buscarDados();
    const intervalo = setInterval(buscarDados, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [buscarDados]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Orquestrador <span className="text-blue-600">2.0</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">PrepAção · MT5 Quant System</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-blue-600 uppercase">● Live Terminal</p>
          <p className="text-[10px] font-mono text-slate-400 uppercase">{ultimaAtualizacao?.toLocaleTimeString() || 'Sincronizando...'}</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto space-y-10">
        <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
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
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-400">{s.time.split(' ')[1]}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full text-white ${s.tendencia.includes('ALTA') ? 'bg-emerald-500' : 'bg-rose-500'}`}>{s.tendencia}</span>
              </div>
              <p className="text-2xl font-black text-slate-800 mb-4">{formatarValor(s.close)}</p>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-blue-600">RSI: {s.rsi_14.toFixed(2)}</span>
                <span className="bg-slate-100 p-1 rounded uppercase">{s.momentum}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;