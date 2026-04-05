import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const INTERVALO_MS = 5000; 

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
const parsearRespostaIA = (texto) => {
  try {
    const textoLimpo = texto.replace(/```json|```/g, "").trim();
    const match = textoLimpo.match(/\[[\s\S]*\]/); 
    return match ? JSON.parse(match[0]) : null;
  } catch (e) { return null; }
};

// ── Componente: Sidebar de Configurações ──────────────────────────────────────
function SidebarConfig({ config, setConfig }) {
  const ativosFTMO = ["BTCUSD", "EURUSD", "XAUUSD", "US30", "GBPUSD"];
  const handleChange = (campo, valor) => setConfig(prev => ({ ...prev, [campo]: valor }));

  return (
    <aside className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6 overflow-y-auto max-h-[90vh] w-80 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
        <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-800 italic">Market Terminal</h3>
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-slate-400 uppercase px-1">Ativo (FTMO)</label>
        <select value={config.ativo} onChange={(e) => handleChange('ativo', e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-100">
          {ativosFTMO.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <hr className="border-slate-100" />
      <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic">Moving Averages</h3>
      {[1, 2, 3].map(num => (
        <div key={num} className={`p-4 rounded-2xl space-y-3 transition-all ${config[`ma${num}_on`] ? 'bg-slate-50 border-blue-100' : 'bg-slate-50/50 opacity-40'}`}>
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={config[`ma${num}_on`]} onChange={(e) => handleChange(`ma${num}_on`, e.target.checked)} className="rounded text-blue-600" />
              <span className="text-[10px] font-black text-slate-600 uppercase">MÉDIA {num === 3 ? '200' : num}</span>
            </label>
            <select value={config[`ma${num}_t`]} onChange={(e) => handleChange(`ma${num}_t`, e.target.value)} className="bg-transparent text-[10px] font-bold outline-none uppercase">
              <option value="SMA">SMA</option><option value="EMA">EMA</option>
            </select>
          </div>
          <input type="number" value={config[`ma${num}_p`]} onChange={(e) => handleChange(`ma${num}_p`, e.target.value)} className="w-full bg-white p-2 rounded-lg text-xs font-black border-none shadow-sm" />
        </div>
      ))}
      <div className={`p-4 rounded-2xl space-y-3 transition-all ${config.bb_on ? 'bg-slate-900 shadow-lg' : 'bg-slate-100 opacity-40'}`}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={config.bb_on} onChange={(e) => handleChange('bb_on', e.target.checked)} className="rounded text-emerald-500" />
          <span className={`text-[10px] font-black uppercase ${config.bb_on ? 'text-emerald-400' : 'text-slate-500'}`}>Bollinger Bands</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={config.bb_p} onChange={(e) => handleChange('bb_p', e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded-lg text-xs font-bold border-none outline-none" />
          <input type="number" step="0.1" value={config.bb_d} onChange={(e) => handleChange('bb_d', e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded-lg text-xs font-bold border-none outline-none" />
        </div>
      </div>
    </aside>
  );
}

// ── Componente: Monitor de Operações ──────────────────────────────────────────
function MonitorOperacoes({ ordens, precoAtual }) {
  if (!ordens || ordens.length === 0) return (
    <div className="bg-white p-6 rounded-[2rem] border border-dashed border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase italic">Nenhuma custódia ativa</div>
  );
  return (
    <div className="space-y-3">
      <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic px-2">Posições Ativas</h3>
      {ordens.map((o, i) => {
        const pnl = o.acao === 'COMPRA' ? (precoAtual - o.preco_entrada) : (o.preco_entrada - precoAtual);
        const pnlFin = pnl * (o.lote || 1);
        return (
          <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center animate-in slide-in-from-right-4">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase">{o.ativo} · {o.estrategia}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${o.acao === 'COMPRA' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{o.acao}</span>
                <span className="text-[10px] font-mono font-bold">@{o.preco_entrada.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-black font-mono ${pnlFin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {pnlFin >= 0 ? '+' : ''}{pnlFin.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </p>
              <p className="text-[8px] font-bold text-slate-300 uppercase">Lote: {o.lote || '1.00'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente Principal App ──────────────────────────────────────────────────
export default function App() {
  const [dados, setDados] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [saldoDia, setSaldoDia] = useState(0);
  const [ordensAbertas, setOrdensAbertas] = useState([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [respostaIA, setRespostaIA] = useState('');
  const [analises, setAnalises] = useState(null);
  const [gerandoPrompt, setGerandoPrompt] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [config, setConfig] = useState({
    ativo: "BTCUSD", tf: "M5", capital: 100000, riscoPerc: 1,
    ma1_p: 9, ma1_t: "SMA", ma1_on: true,
    ma2_p: 21, ma2_t: "EMA", ma2_on: true,
    ma3_p: 200, ma3_t: "SMA", ma3_on: true,
    bb_p: 20, bb_d: 2.0, bb_on: true
  });

  const riscoBase = config.capital * (config.riscoPerc / 100);
  const riscoTotal = riscoBase + saldoDia;

  const carregarDados = useCallback(async () => {
    const params = new URLSearchParams({ ma1_p: config.ma1_p, ma1_t: config.ma1_t, ma2_p: config.ma2_p, ma2_t: config.ma2_t, ma3_p: config.ma3_p, ma3_t: config.ma3_t, bb_p: config.bb_p, bb_d: config.bb_d });
    try {
      const [resS, resSl, resA] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/v1/sinais/${config.ativo.toLowerCase()}?${params}`),
        fetch('http://127.0.0.1:8000/api/v1/auditoria/saldo_hoje'),
        fetch('http://127.0.0.1:8000/api/v1/auditoria/abertas')
      ]);
      const dS = await resS.json(); const dSl = await resSl.json(); const dA = await resA.json();
      if (dS.sinais) {
        setDados(dS.sinais);
        const last = dS.sinais[dS.sinais.length - 1];
        if (last) setSnapshot({ preco: last.close, rsi: last.rsi_14, bb_pct: last.bb_pct });
      }
      setSaldoDia(dSl.saldo); setOrdensAbertas(dA); setUltimaAtualizacao(new Date());
    } catch (e) { console.error(e); }
  }, [config]);

  useEffect(() => {
    carregarDados(); const t = setInterval(carregarDados, INTERVALO_MS); return () => clearInterval(t);
  }, [carregarDados]);

  const resetTerminal = async () => {
    if (window.confirm("⚠️ ATENÇÃO: Deseja zerar o P&L do dia e limpar todas as ordens abertas no banco?")) {
      await fetch('http://127.0.0.1:8000/api/v1/auditoria/reset_diario', { method: 'DELETE' });
      setConfig({...config, capital: 100000}); // Volta ao capital padrão se desejar
      carregarDados();
    }
  };

  const registrarOperacao = (item) => {
    const precoE = parseFloat(item.regiao_entrada) || snapshot?.preco;
    const stopD = Math.abs(precoE - item.stop_loss);
    const loteC = (riscoBase / (stopD || 1)).toFixed(2);
    if (window.confirm(`EXECUTAR ${item.estrategia}?\nLote: ${loteC}\nRisco: ${formatarMoeda(riscoBase)}`)) {
      fetch('http://127.0.0.1:8000/api/v1/auditoria/registrar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: config.ativo, estrategia: item.estrategia, acao: item.acao, preco_entrada: precoE, alvo: item.alvo, stop_loss: item.stop_loss, lote: loteC })
      }).then(() => carregarDados());
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8 font-sans antialiased text-slate-900 flex flex-col xl:flex-row gap-8">
      <SidebarConfig config={config} setConfig={setConfig} />
      <main className="flex-1 space-y-10">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Orquestrador <span className="text-blue-600">2.0</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-1">Terminal Parametrizado · Módulo 10.4</p>
          </div>
          <div className="text-right bg-white p-3 rounded-2xl border min-w-[200px]">
            <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-2 justify-end mb-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {config.ativo}</p>
            <p className="text-[10px] font-mono text-slate-400 font-black uppercase tracking-widest">{ultimaAtualizacao?.toLocaleTimeString() || '--:--:--'}</p>
          </div>
        </header>
        <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{borderRadius: '20px'}} />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              {config.bb_on && (<><Line type="monotone" dataKey="bb_upper" stroke="#e2e8f0" dot={false} /><Line type="monotone" dataKey="bb_lower" stroke="#e2e8f0" dot={false} /></>)}
              {config.ma1_on && <Line type="monotone" dataKey="sma_9" stroke="#3b82f6" dot={false} strokeDasharray="5 5" />}
              {config.ma2_on && <Line type="monotone" dataKey="sma_21" stroke="#f43f5e" dot={false} />}
              {config.ma3_on && <Line type="monotone" dataKey="sma_200" stroke="#94a3b8" strokeWidth={2} dot={false} />}
              <Line type="monotone" dataKey="close" stroke="#0f172a" strokeWidth={4} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 uppercase italic">Comitê Multiestratégia</h2>
            <button onClick={() => { setGerandoPrompt(true); const q = new URLSearchParams({ ma1_p: config.ma1_p, ma1_t: config.ma1_t, ma2_p: config.ma2_p, ma2_t: config.ma2_t, ma3_p: config.ma3_p, ma3_t: config.ma3_t, bb_p: config.bb_p, bb_d: config.bb_d }); fetch(`http://127.0.0.1:8000/api/v1/prompt/${config.ativo.toLowerCase()}?${q}`).then(r => r.json()).then(j => { setPrompt(j.prompt); setGerandoPrompt(false); }); }} disabled={gerandoPrompt} className="px-6 py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-lg">⚡ ANALISAR CENÁRIO</button>
          </div>
          {prompt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <div className="relative"><textarea readOnly value={prompt} className="w-full bg-slate-900 text-slate-400 font-mono text-[9px] p-4 rounded-xl h-44 outline-none border-none" /><button onClick={() => { navigator.clipboard.writeText(prompt); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }} className={`absolute top-4 right-4 px-4 py-1.5 text-[9px] font-bold rounded-lg transition-all ${copiado ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{copiado ? '✓' : 'COPIAR'}</button></div>
              <div className="space-y-2"><textarea value={respostaIA} onChange={e=>setRespostaIA(e.target.value)} placeholder="Cole o JSON da IA..." className="w-full border-2 border-slate-100 p-4 rounded-xl h-44 text-[10px] outline-none" /><button onClick={() => { const res = parsearRespostaIA(respostaIA); if(res) { setAnalises(res); setRespostaIA(''); } }} className="w-full py-2.5 bg-slate-800 text-white text-[10px] font-bold rounded-xl">PROCESSAR</button></div>
            </div>
          )}
          {analises && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {analises.map((item, idx) => {
                const isA = item.acao === 'AGUARDAR'; const est = isA ? 'bg-slate-50 border-slate-200' : item.acao === 'COMPRA' ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500';
                return (
                  <div key={idx} className={`rounded-3xl border-2 p-5 space-y-4 shadow-sm ${est} animate-in fade-in`}>
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-slate-400">{item.estrategia}</span>{!isA && <span className="text-[10px] font-black text-slate-700">R/R {item.risco_retorno}</span>}</div>
                    <h3 className="text-xl font-black text-slate-800">{item.acao}</h3>
                    {!isA ? ( <div className="space-y-3"><div className="grid grid-cols-1 gap-1 text-[11px] font-mono bg-white/60 p-2 rounded"><div className="flex justify-between"><span>Entrada:</span> <b>{item.regiao_entrada || snapshot?.preco.toLocaleString()}</b></div><div className="flex justify-between text-emerald-700"><span>Alvo:</span> <b>{item.alvo.toLocaleString()}</b></div></div><button onClick={() => registrarOperacao(item)} className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl">🎯 AUDITAR</button></div> ) : <div className="py-4 italic text-slate-400 text-[10px] text-center">Aguardando...</div>}
                    <p className="text-[10px] text-slate-500 italic leading-tight">"{item.racional}"</p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <div className="w-full xl:w-80 shrink-0 space-y-6">
        <section className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6"><div className="w-2 h-6 bg-emerald-500 rounded-full"></div><h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 font-mono font-bold">Risk Manager</h2></div>
          <div className="space-y-6">
            <div className={`p-4 rounded-2xl border ${saldoDia >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">P&L Hoje</p><p className={`text-2xl font-black font-mono ${saldoDia >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatarMoeda(saldoDia)}</p></div>
            <div className="space-y-4">
              <label className="text-[9px] font-bold text-slate-500 uppercase px-1">Equity (USD)</label>
              <input type="number" value={config.capital} onChange={(e) => setConfig({...config, capital: Number(e.target.value)})} className="w-full bg-slate-800/50 border border-slate-700 p-3 rounded-xl text-lg font-black outline-none focus:border-emerald-500 text-emerald-50" />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase px-1"><span>Risco {config.riscoPerc}%</span><span className="text-emerald-400">{formatarMoeda(riscoBase)}</span></div>
              <input type="range" min="0.1" max="5" step="0.1" value={config.riscoPerc} onChange={(e) => setConfig({...config, riscoPerc: e.target.value})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 text-center shadow-inner">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest italic">Risco Disponível Agora</p>
              <span className={`font-black font-mono text-3xl ${riscoTotal >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{formatarMoeda(riscoTotal)}</span>
            </div>
            {/* BOTÃO RESET: Implementado aqui */}
            <button onClick={resetTerminal} className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest">
              ❌ Reset Terminal & P&L
            </button>
          </div>
        </section>
        <MonitorOperacoes ordens={ordensAbertas} precoAtual={snapshot?.preco} />
      </div>
    </div>
  );
}