import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Carrega as chaves do cofre
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
        query = f"SELECT * FROM {nome_tabela} ORDER BY time ASC LIMIT 100;"
        df = pd.read_sql(query, engine)
        
        if df.empty:
            print("❌ Não há dados suficientes no banco para calcular indicadores.")
            return

        print("⚙️ Calculando Médias Móveis (SMA) e Índice de Força Relativa (RSI)...")
        
        # --- 1. INDICADOR DE TENDÊNCIA: SMA ---
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()
        
        df['tendencia'] = df.apply(
            lambda row: 'ALTA 🟢' if row['sma_9'] > row['sma_21'] else 'BAIXA 🔴', axis=1
        )

        # --- 2. OSCILADOR DE MOMENTUM: RSI 14 ---
        # A) Calcula a diferença de fechamento de um período para o outro
        delta = df['close'].diff()
        
        # B) Separa os Ganhos (onde delta é positivo) e Perdas (onde delta é negativo)
        ganho = delta.where(delta > 0, 0)
        perda = -delta.where(delta < 0, 0) # Deixa a perda como número positivo
        
        # C) Calcula a Média Móvel Exponencial (EWM) de 14 períodos para Ganhos e Perdas
        periodo_rsi = 14
        media_ganho = ganho.ewm(alpha=1/periodo_rsi, min_periods=periodo_rsi).mean()
        media_perda = perda.ewm(alpha=1/periodo_rsi, min_periods=periodo_rsi).mean()
        
        # D) A Fórmula do Força Relativa (RS) e do RSI Final
        rs = media_ganho / media_perda
        df['rsi_14'] = 100 - (100 / (1 + rs))

        # --- 3. LÓGICA DE EXAUSTÃO (Filtro do RSI) ---
        # RSI > 70 (Sobrecomprado / Risco de Queda), RSI < 30 (Sobrevendido / Oportunidade de Compra)
        def analisar_momentum(rsi):
            if pd.isna(rsi): return 'CALCULANDO...'
            if rsi > 70: return 'SOBRECOMPRADO ⚠️'
            if rsi < 30: return 'SOBREVENDIDO 💥'
            return 'NEUTRO ⚪'

        df['momentum'] = df['rsi_14'].apply(analisar_momentum)

        # Exibição do Resultado (Últimas 5 velas)
        df_resultado = df[['time', 'close', 'sma_9', 'sma_21', 'tendencia', 'rsi_14', 'momentum']].tail(5)
        
        # Formata o RSI para ter apenas 2 casas decimais na tela
        df_resultado['rsi_14'] = df_resultado['rsi_14'].round(2)
        
        # print(f"\n✅ Análise Concluída! Radar do Orquestrador 2.0:\n")
        # print(df_resultado.to_string(index=False))

        # --- A GRANDE MUDANÇA: Em vez de print, retornamos os dados ---
        # Convertendo o DataFrame para uma lista de dicionários nativa do Python
        # Transformamos o campo 'time' em string para que a API consiga ler pela web
        df_resultado['time'] = df_resultado['time'].astype(str)
        
        return df_resultado.to_dict(orient="records")
            
    except Exception as e:
        print(f"❌ Falha crítica no processamento matemático: {e}")
        return None

# if __name__ == "__main__":
#     calcular_indicadores()