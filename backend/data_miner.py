import MetaTrader5 as mt5
import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

# 1. Carrega as Variáveis de Ambiente (Segurança)
load_dotenv()

# Credenciais MT5
LOGIN = int(os.getenv("MT5_LOGIN"))
PASSWORD = os.getenv("MT5_PASSWORD")
SERVER = os.getenv("MT5_SERVER")

# Credenciais Banco de Dados
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def extrair_e_carregar(ativo="BTCUSD", timeframe=mt5.TIMEFRAME_M15, qtd_velas=1000):
    print(f"🔄 Iniciando processo ETL para o ativo {ativo}...")

    # 2. EXTRAÇÃO: Conecta no MT5 e puxa os dados
    if not mt5.initialize(login=LOGIN, server=SERVER, password=PASSWORD):
        print(f"❌ Falha ao iniciar MT5. Erro: {mt5.last_error()}")
        return

    # Puxa as últimas 'X' velas (candles) a partir de agora (posição 0)
    dados_brutos = mt5.copy_rates_from_pos(ativo, timeframe, 0, qtd_velas)
    mt5.shutdown() # Desconecta do MT5 para liberar memória

    if dados_brutos is None or len(dados_brutos) == 0:
        print("⚠️ Nenhum dado retornado da corretora.")
        return

# 3. TRANSFORMAÇÃO: Converte os dados brutos em uma tabela Pandas
    df = pd.DataFrame(dados_brutos)
    
    # O MT5 envia a data em formato 'Unix Timestamp' (segundos). Vamos converter.
    df['time'] = pd.to_datetime(df['time'], unit='s')
    
    # --- NOVA TRAVA DE SEGURANÇA DE TIPAGEM ---
    # Encontra todas as colunas 'uint64' (geralmente os volumes) e converte para 'int64'
    for coluna in df.select_dtypes(include=['uint64']).columns:
        df[coluna] = df[coluna].astype('int64')
    # ------------------------------------------
    
    print(f"✅ {len(df)} velas formatadas com sucesso. Preparando injeção no banco...")

    # 4. CARGA (Load): Conecta no PostgreSQL e salva a tabela
    engine = create_engine(DATABASE_URL)
    nome_tabela = f"historico_{ativo.lower()}" # Ex: historico_btcusd

    try:
        # O comando to_sql magicamente cria a tabela se não existir
        # if_exists='replace' substitui a tabela se ela já existir (ótimo para testes)
        df.to_sql(nome_tabela, engine, if_exists='replace', index=False)
        print(f"💾 SUCESSO! Dados salvos na tabela '{nome_tabela}' no PostgreSQL.")
    except Exception as e:
        print(f"❌ Erro ao salvar no banco de dados: {e}")

if __name__ == "__main__":
    # Executa a função pedindo 1000 velas de 15 minutos (M15) do Bitcoin
    extrair_e_carregar(ativo="BTCUSD", timeframe=mt5.TIMEFRAME_M15, qtd_velas=1000)