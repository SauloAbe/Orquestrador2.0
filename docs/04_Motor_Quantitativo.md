# Módulo 4: Inteligência Quantitativa - O Cérebro do Robô

## 🎯 Objetivo da Aula
Transformar dados brutos em decisões de negócio. Aprenderemos a extrair o histórico armazenado no PostgreSQL e utilizar o Pandas para calcular indicadores técnicos clássicos (Médias Móveis), criando o primeiro "sinal" automatizado de compra ou venda do nosso sistema.

## 🧠 Conceitos Essenciais para o Quant
No desenvolvimento de sistemas de alta frequência (*day trade*), a latência é a nossa maior inimiga. 

* **O Problema do Loop (*For*):** Programadores iniciantes tentam calcular médias varrendo a tabela linha por linha. Isso consome muito processamento e atrasa a tomada de decisão.
* **A Solução (Vetorização):** O Pandas é construído em linguagem C++ por baixo dos panos. Ele permite executar cálculos em blocos inteiros de dados instantaneamente. O método `.rolling(window=X).mean()` é a ferramenta de vetorização que usaremos para calcular médias móveis com performance institucional.

---

## 🛠️ Execução Prática

### 1. O Motor Matemático (`indicators.py`)
No diretório `backend/`, criamos o arquivo responsável por gerar os sinais de trade:

```python
import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def calcular_indicadores(nome_tabela="historico_btcusd"):
    print(f"🧠 Iniciando o motor quantitativo na tabela '{nome_tabela}'...")

    try:
        engine = create_engine(DATABASE_URL)
        
        # Extrai as últimas 100 velas garantindo a ordem cronológica correta
        query = f"SELECT * FROM {nome_tabela} ORDER BY time ASC LIMIT 100;"
        df = pd.read_sql(query, engine)
        
        if df.empty:
            print("❌ Não há dados suficientes no banco.")
            return

        # --- O CÉREBRO MATEMÁTICO ---
        # SMA 9 (Rápida) e SMA 21 (Lenta)
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()

        # Lógica de Cruzamento: Rápida > Lenta = ALTA
        df['tendencia'] = df.apply(
            lambda row: 'ALTA 🟢' if row['sma_9'] > row['sma_21'] else 'BAIXA 🔴', axis=1
        )

        # Exibição: Puxamos apenas as 5 últimas velas com o tail()
        df_resultado = df[['time', 'close', 'sma_9', 'sma_21', 'tendencia']].tail(5)
        print(f"\n✅ Análise Concluída! Últimos 5 sinais do mercado:\n")
        print(df_resultado.to_string(index=False))
            
    except Exception as e:
        print(f"❌ Falha crítica: {e}")

if __name__ == "__main__":
    calcular_indicadores()
```

## ⚠️ Nota de Design Instrucional (O "NaN")
Ao explicar esse código aos alunos, destaque o motivo de usarmos `.tail(5)` no final. Quando o Pandas calcula uma média de 21 períodos (`sma_21`), as primeiras 20 linhas da tabela não terão dados suficientes para o cálculo, retornando `NaN` (Not a Number). Focar nas últimas velas garante que estamos olhando apenas para os sinais matematicamente formados e prontos para execução.

## 💾 Salvando o Progresso (Git)
Consolidamos nossa inteligência base:
```bash
git add backend/indicators.py
git commit -m "feat: Cria motor quantitativo com calculo de SMA e diagnostico de tendencia"
```
```

---

