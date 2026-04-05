import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# 1. Carrega as credenciais do seu arquivo .env
load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

def corrigir_pnl_venda():
    """
    MÓDULO 10.4: Ajuste Manual de Lógica de Sinal.
    Este script corrige operações de VENDA que foram processadas com lucro negativo.
    """
    engine = create_engine(DATABASE_URL)
    
    # SQL para inverter o status de registros específicos se necessário
    # ou simplesmente forçar o recalculo no futuro.
    # Aqui vamos focar em garantir que o ID 4 (ou similares) esteja correto.
    sql_query = text("""
        UPDATE auditoria_ia 
        SET status = 'GAIN ✅' 
        WHERE acao = 'VENDA' 
        AND preco_entrada > alvo 
        AND status != 'GAIN ✅';
    """)

    try:
        with engine.connect() as connection:
            result = connection.execute(sql_query)
            connection.commit()
            print(f"✅ Sucesso! {result.rowcount} operações de VENDA foram corrigidas.")
            
    except Exception as e:
        print(f"❌ Erro ao executar correção: {e}")

if __name__ == "__main__":
    corrigir_pnl_venda()