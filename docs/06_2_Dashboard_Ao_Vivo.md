# Módulo 6.2: O Dashboard Vivo - Atualização Automática em Tempo Real

## 🎯 Objetivo da Aula
Transformar o nosso painel estático em um **sistema de monitoramento contínuo**. O dashboard atual captura os dados uma única vez no carregamento da página. Vamos implementar o mecanismo de **Polling** para que o gráfico e os cards se atualizem automaticamente a cada intervalo de tempo, refletindo o estado real do mercado.

---

## 🧠 Conceito: Polling vs WebSocket

No desenvolvimento de sistemas financeiros em tempo real, existem duas estratégias principais de atualização:

| Estratégia | Como funciona | Quando usar |
|---|---|---|
| **Polling** | O Frontend pergunta ao Backend em intervalos fixos: *"Tem novidade?"* | Dados que atualizam a cada 15s, 30s ou minutos (candles M1, M5, M15) |
| **WebSocket** | A conexão fica aberta permanentemente. O Backend *empurra* os dados quando há novidade | Dados tick-a-tick, livro de ofertas (DOM), streaming de preço puro |

**Para o Orquestrador 2.0**, trabalharemos com **Polling**: é mais simples de implementar, suficiente para timeframes de minutos, e adequado para nosso servidor FastAPI sem configuração adicional.

---

## 🛠️ Execução Prática

### 1. A Engenharia do `useEffect` com Intervalo

O segredo do auto-refresh no React está na combinação de dois mecanismos do hook `useEffect`:
1. **`setInterval`**: Chama uma função repetidamente a cada N milissegundos.
2. **Função de Limpeza (Cleanup)**: O `return` dentro do `useEffect` garante que o intervalo seja destruído quando o componente for desmontado, **evitando vazamento de memória** — um bug clássico e fatal em aplicações de longa duração.

Atualize o bloco de busca de dados no seu `App.jsx`:

```javascript
import { useState, useEffect, useCallback } from 'react';

// Constante de configuração: intervalo em milissegundos
const INTERVALO_ATUALIZACAO_MS = 30000; // 30 segundos

function App() {
  const [dados, setDados] = useState([]);
  const [ativoSelecionado, setAtivoSelecionado] = useState('btcusd');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // useCallback garante que a função não seja recriada a cada render
  // evitando disparos duplicados do intervalo
  const buscarDados = useCallback(() => {
    setCarregando(true);
    fetch(`http://127.0.0.1:8000/api/v1/sinais/${ativoSelecionado}`)
      .then(res => res.json())
      .then(json => {
        setDados(json.sinais.reverse());
        setUltimaAtualizacao(new Date()); // Registra o timestamp da atualização
      })
      .catch(err => console.error("Erro de conexão com a API:", err))
      .finally(() => setCarregando(false));
  }, [ativoSelecionado]);

  useEffect(() => {
    // 1. Busca imediata ao montar o componente ou trocar de ativo
    buscarDados();

    // 2. Agenda as buscas subsequentes no intervalo configurado
    const intervalo = setInterval(buscarDados, INTERVALO_ATUALIZACAO_MS);

    // 3. Função de Limpeza (OBRIGATÓRIA): cancela o intervalo ao desmontar
    return () => clearInterval(intervalo);
  }, [buscarDados]); // Reexecuta sempre que o ativo mudar

  // ... resto do componente
}
```

---

### 2. O Indicador Visual de Status

Um sistema profissional **sempre comunica seu estado ao usuário**. Vamos adicionar um indicador de "pulso" que mostra se o sistema está vivo e quando foi a última leitura do mercado.

Adicione este bloco no topo do seu painel principal no `App.jsx`:

```jsx
{/* Barra de Status do Sistema */}
<div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700 mb-4">
  <div className="flex items-center gap-2">
    {/* Ponto pulsante: verde = ativo, cinza = carregando */}
    <span className={`w-2.5 h-2.5 rounded-full ${carregando ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
    <span className="text-slate-300 text-sm font-mono">
      {carregando ? 'Sincronizando com o mercado...' : 'Sistema Online'}
    </span>
  </div>
  <div className="text-slate-500 text-xs font-mono">
    {ultimaAtualizacao
      ? `Última leitura: ${ultimaAtualizacao.toLocaleTimeString('pt-BR')}`
      : 'Aguardando primeira leitura...'}
  </div>
</div>
```

---

### 3. Seletor de Ativo (Preparando para os Agentes)

Para que os Agentes de IA do próximo módulo analisem diferentes ativos, precisamos de um **seletor de ativo** que dispare o re-fetch automaticamente. Adicione o controle ao seu layout:

```jsx
const ATIVOS_DISPONIVEIS = [
  { id: 'btcusd', label: 'BTC/USD', emoji: '₿' },
  { id: 'xauusd', label: 'XAU/USD', emoji: '🥇' },
  { id: 'eurusd', label: 'EUR/USD', emoji: '💶' },
];

{/* Seletor de Ativos */}
<div className="flex gap-2 mb-6">
  {ATIVOS_DISPONIVEIS.map(ativo => (
    <button
      key={ativo.id}
      onClick={() => setAtivoSelecionado(ativo.id)}
      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all
        ${ativoSelecionado === ativo.id
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        }`}
    >
      {ativo.emoji} {ativo.label}
    </button>
  ))}
</div>
```

> **Nota Técnica:** Perceba que ao trocar de ativo, o `useEffect` detecta a mudança (via `[buscarDados]` que depende de `[ativoSelecionado]`), cancela o intervalo antigo e cria um novo já com o ativo correto. Esse encadeamento é a elegância do React.

---

## ⚠️ Troubleshooting

**O intervalo dispara duas vezes no ambiente de desenvolvimento:**
Isso é comportamento esperado no modo `StrictMode` do React (Vite ativa por padrão). Ele monta, desmonta e remonta os componentes para detectar efeitos colaterais. Em produção (`npm run build`), esse comportamento **não ocorre**. Se quiser desativar durante o desenvolvimento, remova as tags `<React.StrictMode>` no `main.jsx`.

**Os dados não atualizam ao trocar de ativo:**
Verifique se o `useCallback` está com `[ativoSelecionado]` na lista de dependências. Se estiver vazio `[]`, a função é "congelada" na primeira execução e nunca lerá o novo ativo.

---

## 💾 Salvando o Progresso (Git)

```bash
git add frontend/src/App.jsx
git commit -m "feat: Implementa polling com auto-refresh a cada 30s e indicador de status"
```

---
**✅ Conclusão do Módulo:** O painel agora respira. Os dados se atualizam automaticamente, o sistema comunica seu estado ao usuário e a troca de ativos já está preparada para receber a maior evolução do projeto: o **Conselho de Inteligência Artificial**.