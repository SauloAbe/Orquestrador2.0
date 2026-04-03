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

def auditar_tabela(nome_tabela="historico_btcusd"):
    print(f"🔍 Iniciando auditoria na tabela '{nome_tabela}'...")

    try:
        # 2. Acorda o motor de conexao
        engine = create_engine(DATABASE_URL)
        
        # 3. A Consulta (Query)
        # Usamos LIMIT 5 para puxar apenas as 5 primeiras velas e não inundar a tela
        query = f"SELECT * FROM {nome_tabela} LIMIT 5;"
        
        # O Pandas é fantástico: ele manda o SQL para o banco e já transforma a resposta em tabela
        df = pd.read_sql(query, engine)
        
        if df.empty:
            print("⚠️ A tabela existe, mas o cofre está vazio!")
        else:
            print(f"✅ Auditoria Concluida! Lendo as 5 primeiras velas arquivadas:\n")
            # Imprime a tabela alinhada
            print(df.to_string(index=False)) 
            
    except Exception as e:
        print(f"❌ Falha critica na auditoria do banco: {e}")

if __name__ == "__main__":
    auditar_tabela()