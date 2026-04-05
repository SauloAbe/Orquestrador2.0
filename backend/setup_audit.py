import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def criar_tabela_auditoria():
    engine = create_engine(DATABASE_URL)
    
    query = text("""
    CREATE TABLE IF NOT EXISTS auditoria_ia (
        id SERIAL PRIMARY KEY,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo VARCHAR(20),
        estrategia VARCHAR(50),
        acao VARCHAR(20),
        preco_entrada FLOAT,
        alvo FLOAT,
        stop_loss FLOAT,
        status VARCHAR(20) DEFAULT 'ABERTO'
    );
    """)
    
    with engine.connect() as conn:
        conn.execute(query)
        conn.commit()
        print("✅ Tabela 'auditoria_ia' criada com sucesso no PostgreSQL!")

if __name__ == "__main__":
    criar_tabela_auditoria()