### 🚀 1. Comandos para o GitHub

Execute estes comandos no terminal (PowerShell) na raiz do projeto (`D:\Projetos\Orquestrador2.0`):

```powershell
# 1. Adiciona as mudanças no Backend (API e Prompt) e Frontend
git add backend/api.py backend/prompt_generator.py backend/indicators.py frontend/src/App.jsx

# 2. Commit com mensagem técnica seguindo o padrão 'Conventional Commits'
git commit -m "feat: implementa Comitê de Especialistas com 3 estratégias simultâneas"

# 3. Cria uma nova Tag de versão para os alunos
git tag -a v2.5-multi-strategy -m "Versão com 3 Setups: Consolidação, Tendência e Scalper"

# 4. Envia para o seu repositório oficial
git push origin main --tags
```

---

### 📄 2. Documentação Técnica Atualizada (Docs)

Crie ou atualize o arquivo `DOCS_ATUALIZACAO_ABRIL_2026.md` na sua pasta de documentação:

# 📗 Documentação: Orquestrador 2.0 - Versão 2.5 (Comitê de Estratégias)

## 📋 Resumo do Sistema
O **Orquestrador 2.0** é agora um ecossistema full-stack que consome dados do **MetaTrader 5 (MT5)** via Python, armazena em **PostgreSQL (Docker)** e processa análises quantitativas que alimentam um painel **React + Tailwind v4**.

## 🛠️ Revisão das Engrenagens (O que construímos)

### 1. Motor de Mineração (`data_miner.py`)
* **Conexão:** Bridge direta com o MT5.
* **Loop Contínuo:** Atualização a cada 60 segundos via `while True`.
* **Estratégia de Carga:** Uso de `if_exists='replace'` para manter o banco leve e focado apenas nos dados operacionais recentes (últimos 500-1000 candles).

### 2. Motor Quantitativo (`indicators.py`)
* **Ordenação Crítica:** Corrigido para `ORDER BY time DESC` no SQL para garantir que o dashboard exiba o preço real de mercado (Ex: 66k) e não dados históricos (70k).
* **Indicadores:** SMA 9, SMA 21 e RSI 14 processados via Pandas.

### 3. Gerador de Prompt Multiestratégia (`prompt_generator.py`)
* **Snapshot Inteligente:** Coleta preço, médias, RSI e Range (Máxima/Mínima de 20p).
* **Engenharia de Prompt 2.0:** Instrução mestre que força a IA a assumir 3 personas:
    * **Consolidação:** Foco em reversão de Suporte/Resistência.
    * **Tendência:** Foco no cruzamento de Médias Móveis.
    * **Scalper:** Foco em momentum rápido e alvos curtos.

### 4. Interface Visual (`App.jsx`)
* **Grid de Decisões:** Renderização dinâmica de 3 cards de análise lado a lado.
* **Persistência Local:** Uso de `localStorage` para salvar o array de análises.
* **Polling de 30s:** Atualização automática do gráfico sem necessidade de F5.

---

## 📈 3. Guia de Operação (Para o Instrutor/Aluno)

Para colocar o sistema em "Voo Cruzeiro", os terminais devem estar configurados assim:

| Terminal | Comando | Responsabilidade |
| :--- | :--- | :--- |
| **01 - Banco** | `docker start postgres` | Armazenamento de dados |
| **02 - Miner** | `python data_miner.py` | Alimentar o banco via MT5 |
| **03 - API** | `uvicorn backend.api:app --reload` | Distribuir dados para a Web |
| **04 - Web** | `npm run dev` | Interface do Trader |

---

