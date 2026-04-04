import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const INTERVALO_MS = 30000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsearRespostaIA(texto) {
  try {
    const match = texto.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function formatarPreco(valor) {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('en-US', { minimumFractionDigits: 2 });
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
    <div className={`rounded-2xl border-2 ${estilo.borda} ${estilo.bg} p-6 space-y-5`}>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{estilo.icone}</span>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Sinal da IA</p>
            <p className="text-2xl font-black text-slate-800">{analise.acao}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Força</p>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${estilo.badge}`}>
            {analise.forca_sinal ?? '—'}
          </span>
        </div>
      </div>

      {/* Níveis operacionais — só exibe se não for AGUARDAR */}
      {analise.acao !== 'AGUARDAR' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Região de Entrada</p>
            <p className="text-sm font-black text-slate-800 font-mono">{analise.regiao_entrada ?? '—'}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-emerald-200 text-center">
            <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Alvo</p>
            <p className="text-sm font-black text-emerald-700 font-mono">{formatarPreco(analise.alvo)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-200 text-center">
            <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Stop Loss</p>
            <p className="text-sm font-black text-rose-700 font-mono">{formatarPreco(analise.stop_loss)}</p>
          </div>
        </div>
      )}

      {/* Risco/Retorno */}
      {analise.acao !== 'AGUARDAR' && analise.risco_retorno && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Risco / Retorno:</span>
          <span className="text-sm font-black text-slate-700 font-mono">{analise.risco_retorno}</span>
        </div>
      )}

      {/* Racional */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Racional da Operação</p>
        <p className="text-sm text-slate-700 leading-relaxed">{analise.racional}</p>
      </div>
    </div>
  );
}

// ── Componente: Painel de Análise IA ─────────────────────────────────────────

function PainelAnaliseIA({ ativo }) {
  const [prompt, setPrompt]             = useState('');
  const [snapshot, setSnapshot]         = useState(null);
  const [respostaIA, setRespostaIA]     = useState('');
  const [analise, setAnalise]           = useState(null);
  const [erroParser, setErroParser]     = useState(false);
  const [copiado, setCopiado]           = useState(false);
  const [gerandoPrompt, setGerandoPrompt] = useState(false);

  const gerarPrompt = useCallback(() => {
    setGerandoPrompt(true);
    setAnalise(null);
    setRespostaIA('');
    setErroParser(false);

    fetch(`http://127.0.0.1:8000/api/v1/prompt/${ativo}`)
      .then(res => res.json())
      .then(json => {
        if (json.erro) { console.error(json.erro); return; }
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
    } else {
      setErroParser(true);
    }
  };

  return (
    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">

      {/* Título */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 bg-violet-600 rounded-full"></span>
          Análise por Inteligência Artificial
        </h2>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
          Claude · ChatGPT · Gemini · DeepSeek
        </span>
      </div>

      {/* PASSO 1 */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Passo 1 — Gere o prompt com os dados do mercado
        </p>
        <button
          onClick={gerarPrompt}
          disabled={gerandoPrompt}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
        >
          {gerandoPrompt ? 'Lendo o mercado...' : '⚡ Gerar Prompt'}
        </button>

        {snapshot && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
            {[
              { label: 'Preço',   valor: snapshot.preco },
              { label: 'SMA 9',  valor: snapshot.sma_9 },
              { label: 'SMA 21', valor: snapshot.sma_21 },
              { label: 'RSI 14', valor: snapshot.rsi },
              { label: 'Máx 20', valor: snapshot.maxima_range },
              { label: 'Mín 20', valor: snapshot.minima_range },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <p className="text-[9px] uppercase font-bold text-slate-400">{item.label}</p>
                <p className="text-xs font-black text-slate-700 font-mono">{formatarPreco(item.valor)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PASSO 2 */}
      {prompt && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Passo 2 — Copie e cole em qualquer IA
          </p>
          <div className="relative">
            <textarea
              readOnly
              value={prompt}
              rows={8}
              className="w-full bg-slate-900 text-slate-300 font-mono text-xs p-4 rounded-xl border border-slate-700 resize-none focus:outline-none"
            />
            <button
              onClick={copiarPrompt}
              className={`absolute top-3 right-3 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all
                ${copiado ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {copiado ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* PASSO 3 */}
      {prompt && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Passo 3 — Cole a resposta da IA aqui
          </p>
          <textarea
            value={respostaIA}
            onChange={e => setRespostaIA(e.target.value)}
            placeholder='Cole aqui o JSON retornado pela IA...'
            rows={6}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs p-4 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          {erroParser && (
            <p className="text-xs text-rose-500 font-semibold">
              ⚠️ Não foi possível interpretar a resposta. Certifique-se que a IA retornou apenas o JSON.
            </p>
          )}
          <button
            onClick={processarResposta}
            disabled={!respostaIA.trim()}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all"
          >
            Processar Análise →
          </button>
        </div>
      )}

      {/* Resultado */}
      {analise && <CardAnalise analise={analise} />}

    </section>
  );
}

// ── App Principal ─────────────────────────────────────────────────────────────

function App() {
  const [dados, setDados]                         = useState([]);
  const [carregando, setCarregando]               = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const buscarDados = useCallback(() => {
    fetch('http://127.0.0.1:8000/api/v1/sinais/btcusd')
      .then(res => res.json())
      .then(json => {
        if (json.sinais) {
          setDados([...json.sinais]);
          setUltimaAtualizacao(new Date());
          setCarregando(false);
        }
      })
      .catch(err => console.error(err));
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            ORQUESTRADOR <span className="text-blue-600">2.0</span>
          </h1>
          <p className="text-slate-500 font-medium uppercase text-xs tracking-widest mt-1 italic">
            Visual Intelligence & Market Analytics
          </p>
        </div>
        <div className="hidden md:block text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status do Mercado</span>
          <div className="flex items-center gap-2 text-emerald-500 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE: BTC/USD
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            {ultimaAtualizacao
              ? `Atualizado às ${ultimaAtualizacao.toLocaleTimeString('pt-BR')}`
              : 'Sincronizando...'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-10">

        {/* GRÁFICO — intacto */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            Análise de Tendência (Cruzamento de Médias)
          </h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide={true} />
                <YAxis
                  domain={['auto', 'auto']}
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" align="right" height={36} />
                <Line type="monotone" dataKey="close"  name="Preço"            stroke="#0f172a" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="sma_9"  name="Média 9 (Rápida)" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="sma_21" name="Média 21 (Lenta)" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* PAINEL DE ANÁLISE IA */}
        <PainelAnaliseIA ativo="btcusd" />

        {/* CARDS DE SINAIS — intactos */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...dados].reverse().map((sinal, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-slate-400 font-bold">{sinal.time.split(' ')[1]}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${sinal.tendencia.includes('ALTA') ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {sinal.tendencia}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Price</p>
                <p className="text-2xl font-black text-slate-800">$ {sinal.close.toLocaleString('en-US')}</p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">RSI (14)</p>
                  <p className="text-xl font-black text-blue-600">{sinal.rsi_14.toFixed(2)}</p>
                </div>
                <div className="text-right text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {sinal.momentum}
                </div>
              </div>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}

export default App;