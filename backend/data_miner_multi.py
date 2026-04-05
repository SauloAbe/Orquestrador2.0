import MetaTrader5 as mt5
import pandas as pd
import time
import os
import numpy as np # Importação necessária para tratamento de tipos
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(DATABASE_URL)

# ATIVOS FTMO
ATIVOS = ["BTCUSD", "EURUSD", "XAUUSD", "US30.cash", "GBPUSD"]

def minerar():
    if not mt5.initialize():
        print("❌ Falha ao iniciar MT5")
        return

    for simbolo in ATIVOS:
        # Garante que o ativo está visível no Market Watch do MT5
        selected = mt5.symbol_select(simbolo, True)
        if not selected:
            print(f"⚠️ Ativo {simbolo} não encontrado no MT5. Pulando...")
            continue

        # Captura 300 velas para suportar a Média de 200 do Módulo 10
        rates = mt5.copy_rates_from_pos(simbolo, mt5.TIMEFRAME_M5, 0, 300)
        
        if rates is not None and len(rates) > 0:
            df = pd.DataFrame(rates)
            
            # --- CORREÇÃO DO ERRO uint64 ---
            # Converte todas as colunas numéricas que podem ser uint64 para int64/float64
            for col in df.columns:
                if df[col].dtype == 'uint64':
                    df[col] = df[col].astype('int64')
            # -------------------------------

            df['time'] = pd.to_datetime(df['time'], unit='s')
            df = df[['time', 'open', 'high', 'low', 'close', 'tick_volume']]
            
            nome_tabela = f"historico_{simbolo.lower()}"
            
            # Tenta salvar no Banco
            try:
                df.to_sql(nome_tabela, engine, if_exists='replace', index=False)
                print(f"✅ {simbolo} atualizado: {len(df)} registros.")
            except Exception as e:
                print(f"❌ Erro ao salvar {simbolo} no banco: {e}")
        else:
            print(f"❌ Falha ao obter dados de {simbolo}")

if __name__ == "__main__":
    print("🚀 Iniciando Minerador Multi-Ativo (Correção uint64 aplicada)...")
    while True:
        try:
            minerar()
        except Exception as e:
            print(f"💥 Erro crítico no loop: {e}")
        
        print("😴 Ciclo completo. Aguardando 60s...")
        time.sleep(60)