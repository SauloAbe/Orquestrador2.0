import os
import time
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(DATABASE_URL)

def julgar_operacoes():
    print(f"⚖️ [{datetime.now().strftime('%H:%M:%S')}] Iniciando Auditoria de Performance...")
    
    with engine.connect() as conn:
        query_abertas = text("SELECT id, ativo, acao, alvo, stop_loss FROM auditoria_ia WHERE status = 'ABERTO'")
        operacoes = conn.execute(query_abertas).fetchall()
        
        if not operacoes:
            print("📭 Sem operações para auditar no momento.")
            return

        for op in operacoes:
            id_op, ativo, acao, alvo, stop = op
            tabela_precos = f"historico_{ativo.lower()}"
            
            try:
                query_preco = text(f"SELECT close FROM {tabela_precos} ORDER BY time DESC LIMIT 1")
                res_preco = conn.execute(query_preco).fetchone()
                
                if not res_preco: continue
                preco_atual = res_preco[0]
                
                novo_status = None
                
                if acao == 'COMPRA':
                    if preco_atual >= alvo: novo_status = 'GAIN ✅'
                    elif preco_atual <= stop: novo_status = 'LOSS ❌'
                
                elif acao == 'VENDA':
                    if preco_atual <= alvo: novo_status = 'GAIN ✅'
                    elif preco_atual >= stop: novo_status = 'LOSS ❌'
                
                if novo_status:
                    update_query = text("UPDATE auditoria_ia SET status = :status WHERE id = :id")
                    conn.execute(update_query, {"status": novo_status, "id": id_op})
                    conn.commit()
                    print(f"📢 Operação {id_op} ({ativo}) finalizada: {novo_status}!")
                else:
                    print(f"⏳ {ativo} em andamento... Preço: {preco_atual} | Alvo: {alvo}")
                    
            except Exception as e:
                print(f"❌ Erro ao auditar {ativo}: {e}")

if __name__ == "__main__":
    while True:
        try:
            julgar_operacoes()
            time.sleep(300) 
        except Exception as e:
            print(f"💥 Erro: {e}")
            time.sleep(30)