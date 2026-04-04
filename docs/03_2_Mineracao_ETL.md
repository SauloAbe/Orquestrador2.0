# Módulo 3.2: A Mineração de Dados - Construindo o Pipeline ETL

## 🎯 Objetivo da Aula
Construir nosso primeiro script de mineração automatizada. Vamos conectar o MetaTrader 5 (origem) ao PostgreSQL (destino) utilizando o **Pandas** como motor de transformação. Este é o nascimento do nosso banco de dados histórico para futuros backtests e treinamentos de Inteligência Artificial.

## 🧠 Conceito: O Processo ETL
Na Engenharia de Dados, chamamos esse fluxo de **ETL**:
1. **Extract (Extrair):** Puxar os dados brutos da corretora (velas/candles).
2. **Transform (Transformar):** Limpar os dados, ajustar fusos horários e corrigir tipos de variáveis (Tipagem).
3. **Load (Carregar):** Injetar a tabela formatada no banco de dados de forma otimizada.

---

## 🛠️ Execução Prática

### 1. O Script de Mineração (`data_miner.py`)
No diretório `backend/`, criamos o arquivo que executará a nossa extração. Este script une as credenciais do `.env`, a leitura do MT5 e a gravação via SQLAlchemy.

```python
import MetaTrader5 as mt5
import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

# Credenciais
LOGIN = int(os.getenv("MT5_LOGIN"))
PASSWORD = os.getenv("MT5_PASSWORD")
SERVER = os.getenv("MT5_SERVER")

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def extrair_e_carregar(ativo="BTCUSD", timeframe=mt5.TIMEFRAME_M15, qtd_velas=1000):
    print(f"🔄 Iniciando processo ETL para o ativo {ativo}...")

    # --- 1. EXTRACT (Extração) ---
    if not mt5.initialize(login=LOGIN, server=SERVER, password=PASSWORD):
        print(f"❌ Falha ao iniciar MT5. Erro: {mt5.last_error()}")
        return

    dados_brutos = mt5.copy_rates_from_pos(ativo, timeframe, 0, qtd_velas)
    mt5.shutdown() 

    if dados_brutos is None or len(dados_brutos) == 0:
        print("⚠️ Nenhum dado retornado da corretora.")
        return

    # --- 2. TRANSFORM (Transformação) ---
    df = pd.DataFrame(dados_brutos)
    
    # Conversão do Timestamp de máquina para Data/Hora legível
    df['time'] = pd.to_datetime(df['time'], unit='s')
    
    # HIGIENIZAÇÃO DE TIPAGEM (Proteção para o Banco de Dados)
    # Converte números gigantes sem sinal (uint64) para inteiros padrão (int64)
    for coluna in df.select_dtypes(include=['uint64']).columns:
        df[coluna] = df[coluna].astype('int64')
    
    print(f"✅ {len(df)} velas formatadas com sucesso. Preparando injeção no banco...")

    # --- 3. LOAD (Carga) ---
    engine = create_engine(DATABASE_URL)
    nome_tabela = f"historico_{ativo.lower()}" 

    try:
        # if_exists='replace' atualiza a tabela inteira. Para produção, usaremos 'append'
        df.to_sql(nome_tabela, engine, if_exists='replace', index=False)
        print(f"💾 SUCESSO! Dados salvos na tabela '{nome_tabela}' no PostgreSQL.")
    except Exception as e:
        print(f"❌ Erro ao salvar no banco de dados: {e}")

if __name__ == "__main__":
    extrair_e_carregar(ativo="BTCUSD", timeframe=mt5.TIMEFRAME_M15, qtd_velas=1000)
```

## ⚠️ Tratamento de Erros e Tipagem (O "Pulo do Gato")

Durante testes em ambientes reais, é muito comum encontrar o seguinte erro no console:
> `Unsigned 64 bit integer datatype is not supported`

**Por que isso acontece?**
O MetaTrader envia informações de volume de mercado como `uint64` (inteiros de 64 bits sem sinal). No entanto, o banco de dados PostgreSQL não possui suporte nativo direto para esse tipo específico ao tentar criar a tabela magicamente via Pandas.

**A Solução (A etapa de Transformação):**
Aplicamos um filtro rigoroso antes de enviar os dados para o cofre. O laço `for` inserido na etapa de Transformação varre a tabela em busca de colunas `uint64` e as rebaixa para `int64` (suportado universalmente), impedindo o choque de arquiteturas e garantindo a carga perfeita.

## 💾 Salvando o Progresso (Git)
Consolidamos nossa rotina ETL no histórico de versão:
```bash
git add backend/data_miner.py
git commit -m "feat: Adiciona pipeline ETL com higienizacao de tipagem uint64 para int64"
```
```