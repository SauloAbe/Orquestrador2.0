import MetaTrader5 as mt5
import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
import time
from datetime import datetime

load_dotenv()

LOGIN = int(os.getenv("MT5_LOGIN"))
PASSWORD = os.getenv("MT5_PASSWORD")
SERVER = os.getenv("MT5_SERVER")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def minerar_mt5(ativo="BTCUSD", timeframe=mt5.TIMEFRAME_M5, qtd_velas=500):
    if not mt5.initialize(login=LOGIN, server=SERVER, password=PASSWORD):
        print(f"❌ Erro MT5: {mt5.last_error()}")
        return

    engine = create_engine(DATABASE_URL)
    nome_tabela = f"historico_{ativo.lower()}"

    while True:
        try:
            dados_brutos = mt5.copy_rates_from_pos(ativo, timeframe, 0, qtd_velas)
            
            if dados_brutos is not None and len(dados_brutos) > 0:
                df = pd.DataFrame(dados_brutos)
                df['time'] = pd.to_datetime(df['time'], unit='s')
                
                for coluna in df.select_dtypes(include=['uint64']).columns:
                    df[coluna] = df[coluna].astype('int64')

                # USA 'replace' para manter o banco sempre com os 500 candles mais novos
                df.to_sql(nome_tabela, engine, if_exists='replace', index=False)
                print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] {ativo} atualizado: {df['close'].iloc[-1]}")
            
            time.sleep(60) # Atualiza a cada 1 minuto
            
        except Exception as e:
            print(f"❌ Erro no loop: {e}")
            time.sleep(10)

if __name__ == "__main__":
    # Ajustado para M5 como você solicitou
    minerar_mt5(ativo="BTCUSD", timeframe=mt5.TIMEFRAME_M5)