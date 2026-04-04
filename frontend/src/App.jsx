import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const INTERVALO_MS = 30000;

// ── Helpers de Utilidade ──────────────────────────────────────────────────────

function parsearRespostaIA(texto) {
  try {
    const textoLimpo = texto.replace(/```json|```/g, "").trim();
    const match = textoLimpo.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (e) {
    console.error("Erro no Parse da IA:", e);
    return null;
  }
}

function formatarValor(valor) {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// ── Componente: Card de Resultado da Análise ─────────────────────────────────

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
          <span className={`text-xs font-black px-3 py-1 rounded-full ${estilo.badge}`}>
            {analise.forca_sinal ?? '—'}
          </span>
        </div>
      </div>

      {analise.acao !== 'AGUARDAR' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Entrada</p>
            <p className="text-sm font-black text-slate-800 font-mono">{analise.regiao_entrada ?? '—'}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-emerald-200 text-center">
            <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Alvo</p>
            <p className="text-sm font-black text-emerald-700 font-mono">{formatarValor(analise.alvo)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-200 text-center">
            <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Stop Loss</p>
            <p className="text-sm font-black text-rose-700 font-mono">{formatarValor(analise.stop_loss)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono italic">Justificativa da IA</p>
        <p className="text-sm text-slate-700 leading-relaxed italic">"{analise.racional}"</p>
      </div>
    </div>
  );
}

// ── Componente: Painel de Análise IA ─────────────────────────────────────────

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
    setErroParser(false);

    fetch(`http://127.0.0.1:8000/api/v1/prompt/${ativo}`)
      .then(res => res.json())
      .then(json => {
        if (json.erro) throw new Error(json.erro);
        setPrompt(json.prompt);
        setSnapshot(json.snapshot);
      })
      .catch(err => console.error('Erro ao gerar prompt:', err))
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
      setErroParser(false);
      localStorage.setItem(`analise_${ativo}`, JSON.stringify(resultado));
    } else {
      setErroParser(true);
    }
  };

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-xs">AI</div>
          Conselho de Inteligência Artificial
        </h2>
        <div className="flex gap-3">
          <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-violet-500 bg-violet-50 px-2 py-1 rounded">CLAUDE</a>
          <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">CHATGPT</a>
          <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">GEMINI</a>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passo 1 — Capturar Mercado</p>
        </div>
        <button
          onClick={gerarPrompt}
          disabled={gerandoPrompt}
          className="w-full md:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-violet-100"
        >
          {gerandoPrompt ? 'Processando Dados...' : '⚡ Gerar Prompt para IA'}
        </button>

        {snapshot && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 animate-in slide-in-from-top-2 duration-300">
            {[
              { label: 'Cotação', valor: snapshot.preco },
              { label: 'SMA 9', valor: snapshot.sma_9 },
              { label: 'SMA 21', valor: snapshot.sma_21 },
              { label: 'RSI 14', valor: snapshot.rsi },
              { label: 'Máx 20', valor: snapshot.maxima_range },
              { label: 'Mín 20', valor: snapshot.minima_range },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">{item.label}</p>
                <p className="text-xs font-black text-slate-700 font-mono">{formatarValor(item.valor)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {prompt && (
        <div className="space-y-3 animate-in fade-in duration-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passo 2 — Consultar IA</p>
          <div className="relative group">
            <textarea
              readOnly
              value={prompt}
              rows={4}
              className="w-full bg-slate-900 text-slate-400 font-mono text-[10px] p-4 rounded-xl border border-slate-800 resize-none focus:outline-none"
            />
            <button
              onClick={copiarPrompt}
              className={`absolute top-3 right-3 px-4 py-2 text-[10px] font-bold rounded-lg transition-all
                ${copiado ? 'bg-emerald-500 text-white scale-105' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {copiado ? '✓ COPIADO' : 'COPIAR PROMPT'}
            </button>
          </div>
        </div>
      )}

      {prompt && (
        <div className="space-y-3 animate-in fade-in duration-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passo 3 — Colar Resposta</p>
          <textarea
            value={respostaIA}
            onChange={e => setRespostaIA(e.target.value)}
            placeholder='Cole aqui o JSON da IA...'
            rows={3}
            className="w-full bg-white border-2 border-slate-100 text-slate-700 font-mono text-xs p-4 rounded-xl resize-none focus:outline-none focus:border-violet-300 transition-colors"
          />
          <button
            onClick={processarResposta}
            disabled={!respostaIA.trim()}
            className="w-full md:w-auto px-6 py-3 bg-slate-900 hover:bg-black disabled:opacity-30 text-white font-bold text-sm rounded-xl transition-all"
          >
            Processar Análise →
          </button>
        </div>
      )}

      {analise && <CardAnalise analise={analise} />}
    </section>
  );
}

// ── App Principal ─────────────────────────────────────────────────────────────

function App() {
  const [dados, setDados] = useState([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const buscarDados = useCallback(() => {
    fetch(`http://127.0.0.1:8000/api/v1/sinais/btcusd?t=${Date.now()}`)
      .then(res => res.json())
      .then(json => {
        if (json.sinais) {
          setDados([...json.sinais]);
          setUltimaAtualizacao(new Date());
        }
      })
      .catch(err => console.error("Erro de conexão:", err));
  }, []);

  useEffect(() => {
    buscarDados();
    const intervalo = setInterval(buscarDados, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [buscarDados]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans antialiased text-slate-900">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="h-10 w-2 bg-blue-600 rounded-full"></div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
               Orquestrador <span className="text-blue-600">2.0</span>
             </h1>
          </div>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-[0.2em] italic ml-5">
            Quantitative System • Multi-Asset Analytics
          </p>
        </div>
        <div className="text-left md:text-right bg-white p-3 rounded-2xl border border-slate-100 shadow-sm min-w-[200px]">
          <div className="flex items-center md:justify-end gap-2 text-blue-600 font-black text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            CONECTADO AO TERMINAL
          </div>
          <p className="text-[10px] text-slate-400 font-bold font-mono mt-1 uppercase">
            {ultimaAtualizacao 
              ? `Sincronismo: ${ultimaAtualizacao.toLocaleTimeString('pt-BR')}` 
              : 'Buscando sinal...'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        
        <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 font-mono uppercase italic">
              Market View Strategy
            </h2>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono italic">Live Chart Feed</span>
          </div>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide={true} />
                <YAxis
                  domain={['auto', 'auto']}
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val.toLocaleString('pt-BR')}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" align="right" height={40} iconType="circle" />
                <Line type="monotone" dataKey="close"  name="Preço" stroke="#0f172a" strokeWidth={4} dot={false} animationDuration={1000} />
                <Line type="monotone" dataKey="sma_9"  name="SMA 9 (Rápida)"   stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="6 4" />
                <Line type="monotone" dataKey="sma_21" name="SMA 21 (Lenta)"  stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <PainelAnaliseIA ativo="btcusd" />

        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Fluxo de Dados</h2>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
           </div>
           <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...dados].reverse().map((sinal, index) => (
               <div key={index} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                 <div className="flex justify-between items-center mb-6">
                   <span className="text-[10px] font-mono text-slate-400 font-black bg-slate-50 px-2 py-1 rounded italic">{sinal.time.split(' ')[1]}</span>
                   <span className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm ${sinal.tendencia.includes('ALTA') ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                     {sinal.tendencia}
                   </span>
                 </div>
                 <div className="mb-6">
                   <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1 italic">Cotação Atual</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tight">{formatarValor(sinal.close)}</p>
                 </div>
                 <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                   <div>
                     <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.2em]">RSI (14)</p>
                     <p className="text-xl font-black text-blue-600 italic">{sinal.rsi_14.toFixed(2)}</p>
                   </div>
                   <div className="text-right">
                     <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                       {sinal.momentum}
                     </span>
                   </div>
                 </div>
               </div>
             ))}
           </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-20 pb-12 text-center">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">
           Soluções em Dados · PrepAção © 2026
         </p>
      </footer>
    </div>
  );
}

export default App;