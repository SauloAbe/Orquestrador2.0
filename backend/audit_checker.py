import os, time
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
engine = create_engine(f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}", isolation_level="AUTOCOMMIT")

def julgar():
    print(f"⚖️ [{datetime.now().strftime('%H:%M:%S')}] Analisando...")
    with engine.connect() as conn:
        query = text("SELECT id, ativo, acao, alvo, stop_loss FROM auditoria_ia WHERE status = 'ABERTO'")
        operacoes = conn.execute(query).fetchall()
        
        if not operacoes:
            print("📭 Sem operações abertas. Juiz em repouso.")
            return

        for op in operacoes:
            id_op, ativo, acao, alvo, stop = op
            res_preco = conn.execute(text(f"SELECT close FROM historico_{ativo.lower()} ORDER BY time DESC LIMIT 1")).fetchone()
            if not res_preco: continue
            preco = res_preco[0]
            
            status = None
            if acao == 'COMPRA':
                if preco >= alvo: status = 'GAIN ✅'
                elif preco <= stop: status = 'LOSS ❌'
            elif acao == 'VENDA':
                if preco <= alvo: status = 'GAIN ✅'
                elif preco >= stop: status = 'LOSS ❌'
            
            if status:
                conn.execute(text("UPDATE auditoria_ia SET status = :status WHERE id = :id"), {"status": status, "id": id_op})
                print(f"📢 [ID {id_op}] Encerrado: {status}")

if __name__ == "__main__":
    while True:
        try: julgar(); time.sleep(60)
        except Exception as e: print(f"Erro: {e}"); time.sleep(10)