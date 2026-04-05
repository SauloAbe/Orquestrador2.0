import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

def calcular_indicadores(nome_tabela="historico_btcusd", config=None):
    """
    MÓDULO 10.2: Sistema de Cálculo Parametrizado.
    Permite médias customizadas (SMA/EMA) e Bandas de Bollinger variáveis.
    """
    # Configuração padrão caso o objeto venha nulo
    if config is None:
        config = {
            "ma1_p": 9, "ma1_t": "SMA", 
            "ma2_p": 21, "ma2_t": "EMA", 
            "ma3_p": 200, "ma3_t": "SMA",
            "bb_p": 20, "bb_d": 2.0
        }

    try:
        engine = create_engine(DATABASE_URL)
        # Buscamos 300 velas para garantir dados para a Média de 200
        query = f"SELECT * FROM {nome_tabela} ORDER BY time DESC LIMIT 300;"
        df = pd.read_sql(query, engine)
        
        if df.empty or len(df) < int(config.get('ma3_p', 200)):
            return None

        # Ordenar cronologicamente para cálculos de série temporal
        df = df.sort_values(by='time', ascending=True)

        # --- FUNÇÃO INTERNA: CÁLCULO DE MÉDIAS MÓVEIS DINÂMICAS ---
        def aplicar_ma(df_temp, p, tipo, label):
            periodo = int(p)
            if tipo == "EMA":
                df_temp[label] = df_temp['close'].ewm(span=periodo, adjust=False).mean()
            else:
                df_temp[label] = df_temp['close'].rolling(window=periodo).mean()
            return df_temp

        # Aplicando as 3 médias configuradas na Sidebar
        df = aplicar_ma(df, config['ma1_p'], config['ma1_t'], 'sma_9')
        df = aplicar_ma(df, config['ma2_p'], config['ma2_t'], 'sma_21')
        df = aplicar_ma(df, config['ma3_p'], config['ma3_t'], 'sma_200')

        # --- INDICADOR RSI (FIXO 14 PERÍODOS) ---
        delta = df['close'].diff()
        ganho = delta.where(delta > 0, 0)
        perda = -delta.where(delta < 0, 0)
        mg = ganho.ewm(alpha=1/14, min_periods=14).mean()
        mp = perda.ewm(alpha=1/14, min_periods=14).mean()
        df['rsi_14'] = 100 - (100 / (1 + (mg / mp)))

        # --- BANDAS DE BOLLINGER DINÂMICAS ---
        bb_p = int(config.get('bb_p', 20))
        bb_d = float(config.get('bb_d', 2.0))
        df['bb_mid'] = df['close'].rolling(window=bb_p).mean()
        std = df['close'].rolling(window=bb_p).std()
        df['bb_upper'] = df['bb_mid'] + (std * bb_d)
        df['bb_lower'] = df['bb_mid'] - (std * bb_d)
        df['bb_pct'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])

        # Formatação para o Frontend (Recharts)
        df['time'] = df['time'].astype(str)
        # Remove valores nulos (NaN) para não quebrar o JSON da API
        return df.tail(100).replace({np.nan: None}).to_dict(orient="records")

    except Exception as e:
        print(f"❌ Erro Indicators.py: {e}")
        return None