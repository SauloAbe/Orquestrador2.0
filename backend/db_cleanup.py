import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Carrega as credenciais do seu arquivo .env
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def limpar_operacoes_travadas():
    print("🧹 Iniciando faxina no banco de dados do Orquestrador...")
    
    # Criamos a conexão com o banco
    engine = create_engine(DATABASE_URL)
    
    # SQL para fechar tudo que ficou "ABERTO" por erro de log ou teste
    query = text("""
        UPDATE auditoria_ia 
        SET status = 'CANCELADO' 
        WHERE status = 'ABERTO';
    """)
    
    try:
        with engine.connect() as conn:
            # Executamos a limpeza
            result = conn.execute(query)
            conn.commit() # Forçamos a gravação no PostgreSQL
            
            print(f"✅ Sucesso! {result.rowcount} operações foram movidas para 'CANCELADO'.")
            print("🚀 O Juiz (audit_checker.py) agora deve entrar em estado de pausa.")
            
    except Exception as e:
        print(f"❌ Erro ao tentar limpar o banco: {e}")

if __name__ == "__main__":
    limpar_operacoes_travadas()