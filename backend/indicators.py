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
    try:
        engine = create_engine(DATABASE_URL)
        # PEGA AS ÚLTIMAS 100 VELAS (DESC) PARA TER OS DADOS ATUAIS
        query = f"SELECT * FROM {nome_tabela} ORDER BY time DESC LIMIT 100;"
        df = pd.read_sql(query, engine)
        
        if df.empty or len(df) < 21:
            return None

        # Reverte para ordem cronológica para o cálculo de médias e o gráfico
        df = df.sort_values(by='time', ascending=True)

        # SMA
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()
        df['tendencia'] = df.apply(lambda row: 'ALTA 🟢' if row['sma_9'] > row['sma_21'] else 'BAIXA 🔴', axis=1)

        # RSI 14
        delta = df['close'].diff()
        ganho = delta.where(delta > 0, 0)
        perda = -delta.where(delta < 0, 0)
        media_ganho = ganho.ewm(alpha=1/14, min_periods=14).mean()
        media_perda = perda.ewm(alpha=1/14, min_periods=14).mean()
        rs = media_ganho / media_perda
        df['rsi_14'] = 100 - (100 / (1 + rs))

        def analisar_momentum(rsi):
            if pd.isna(rsi): return 'NEUTRO ⚪'
            if rsi > 70: return 'SOBRECOMPRADO ⚠️'
            if rsi < 30: return 'SOBREVENDIDO 💥'
            return 'NEUTRO ⚪'

        df['momentum'] = df['rsi_14'].apply(analisar_momentum)
        df['time'] = df['time'].astype(str)
        
        # Retorna os últimos 50 registros para o gráfico
        return df.tail(50).to_dict(orient="records")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None