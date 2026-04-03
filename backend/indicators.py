import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

# 1. Carrega as chaves do cofre
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
        
        # Puxamos as últimas 100 velas e ordenamos da mais antiga para a mais nova
        # Isso é vital, pois os cálculos de médias precisam seguir a linha do tempo correta
        query = f"SELECT * FROM {nome_tabela} ORDER BY time ASC LIMIT 100;"
        df = pd.read_sql(query, engine)
        
        if df.empty:
            print("❌ Não há dados suficientes no banco para calcular indicadores.")
            return

        print("⚙️ Calculando Médias Móveis (SMA 9 e SMA 21)...")
        
        # 2. O Cérebro Matemático (Usando métodos nativos do Pandas)
        # O método 'rolling' cria uma janela de observação, e o 'mean' tira a média
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()

        # 3. Lógica de Decisão (O Sinal)
        # Se a Média Curta (9) for maior que a Longa (21), tendência de ALTA. Senão, BAIXA.
        df['tendencia'] = df.apply(
            lambda row: 'ALTA 🟢' if row['sma_9'] > row['sma_21'] else 'BAIXA 🔴', axis=1
        )

        # 4. Exibição do Resultado (Focando nas 5 velas mais recentes)
        # Usamos tail(5) porque as primeiras velas terão valores nulos (NaN) até formar o período de 21
        df_resultado = df[['time', 'close', 'sma_9', 'sma_21', 'tendencia']].tail(5)
        
        print(f"\n✅ Análise Concluída! Últimos 5 sinais do mercado:\n")
        print(df_resultado.to_string(index=False))
            
    except Exception as e:
        print(f"❌ Falha crítica no processamento matemático: {e}")

if __name__ == "__main__":
    calcular_indicadores()