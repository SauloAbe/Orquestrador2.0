import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# 1. Carrega as configurações do seu .env
load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

def atualizar_estrutura_banco():
    """
    MÓDULO 10.4: Migração de Estrutura.
    Adiciona a coluna 'lote' à tabela de auditoria para permitir o cálculo de P&L financeiro.
    """
    engine = create_engine(DATABASE_URL)
    
    # Comando SQL para adicionar a coluna apenas se ela não existir
    sql_comando = text("""
        ALTER TABLE auditoria_ia 
        ADD COLUMN IF NOT EXISTS lote FLOAT DEFAULT 1.0;
    """)

    try:
        with engine.connect() as connection:
            print("⏳ Conectando ao banco de dados...")
            connection.execute(sql_comando)
            connection.commit()
            print("✅ Sucesso: Coluna 'lote' verificada/adicionada na tabela 'auditoria_ia'.")
            
    except Exception as e:
        print(f"❌ Erro ao atualizar banco: {e}")
        print("Dica: Verifique se o banco de dados está rodando e se as credenciais no .env estão corretas.")

if __name__ == "__main__":
    atualizar_estrutura_banco()