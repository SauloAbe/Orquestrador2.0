import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# IMPORTAÇÃO CORRIGIDA: Nome da função deve ser idêntico ao indicators.py
from backend.indicators import calcular_indicadores
from backend.prompt_generator import gerar_prompt_analise

# 1. SETUP DE AMBIENTE E BANCO
load_dotenv()
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Orquestrador 2.0 - Trading API", version="5.4.0")

# 2. CONFIGURAÇÃO DE CORS (Essencial para o Vite/React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── ROTA 1: SINAIS (GRÁFICO) ──────────────────────────────────────────────────
@app.get("/api/v1/sinais/{ativo}")
def obter_sinais(
    ativo: str,
    ma1_p: int = 9, ma1_t: str = "SMA",
    ma2_p: int = 21, ma2_t: str = "EMA",
    ma3_p: int = 200, ma3_t: str = "SMA",
    bb_p: int = 20, bb_d: float = 2.0
):
    try:
        config = {
            "ma1_p": ma1_p, "ma1_t": ma1_t,
            "ma2_p": ma2_p, "ma2_t": ma2_t,
            "ma3_p": ma3_p, "ma3_t": ma3_t,
            "bb_p": bb_p, "bb_d": bb_d
        }
        nome_tabela = f"historico_{ativo.lower()}"
        # Chamada da função corrigida
        dados = calcular_indicadores(nome_tabela, config)
        
        return {"ativo": ativo.upper(), "sinais": dados if dados else []}
    except Exception as e:
        print(f"❌ Erro na Rota de Sinais: {e}")
        return {"ativo": ativo.upper(), "sinais": [], "error": str(e)}

# ── ROTA 2: SALDO P&L (LÓGICA DE VENDA CORRIGIDA) ──────────────────────────────
@app.get("/api/v1/auditoria/saldo_hoje")
def obter_saldo_hoje(db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN acao = 'COMPRA' AND status = 'GAIN ✅' THEN (alvo - preco_entrada)
                    WHEN acao = 'COMPRA' AND status = 'LOSS ❌' THEN (stop_loss - preco_entrada)
                    WHEN acao = 'VENDA' AND status = 'GAIN ✅' THEN (preco_entrada - alvo)
                    WHEN acao = 'VENDA' AND status = 'LOSS ❌' THEN (preco_entrada - stop_loss)
                    ELSE 0 
                END
            ), 0) as pnl
        FROM auditoria_ia 
        WHERE time::date = CURRENT_DATE
    """)
    resultado = db.execute(query).fetchone()
    return {"saldo": float(resultado[0] or 0.0)}

# ── ROTA 3: MONITOR DE ORDENS ABERTAS ──────────────────────────────────────────
@app.get("/api/v1/auditoria/abertas")
def listar_ordens_abertas(db: Session = Depends(get_db)):
    try:
        query = text("SELECT * FROM auditoria_ia WHERE status = 'ABERTO' ORDER BY time DESC")
        res = db.execute(query).fetchall()
        return [dict(r._mapping) for r in res]
    except Exception as e:
        print(f"❌ Erro ao listar abertas: {e}")
        return []

# ── ROTA 4: REGISTRO DE OPERAÇÃO ──────────────────────────────────────────────
@app.post("/api/v1/auditoria/registrar")
async def registrar_trade(operacao: dict, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO auditoria_ia (ativo, estrategia, acao, preco_entrada, alvo, stop_loss, lote, status)
            VALUES (:ativo, :estrategia, :acao, :preco_entrada, :alvo, :stop_loss, :lote, 'ABERTO')
        """)
        db.execute(query, {
            "ativo": operacao.get("ativo"),
            "estrategia": operacao.get("estrategia"),
            "acao": operacao.get("acao"),
            "preco_entrada": operacao.get("preco_entrada"),
            "alvo": operacao.get("alvo"),
            "stop_loss": operacao.get("stop_loss"),
            "lote": operacao.get("lote", 1.0)
        })
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ── ROTA 5: RESET DIÁRIO ──────────────────────────────────────────────────────
@app.delete("/api/v1/auditoria/reset_diario")
def resetar_dia(db: Session = Depends(get_db)):
    try:
        db.execute(text("DELETE FROM auditoria_ia WHERE time::date = CURRENT_DATE"))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ── ROTA 6: PROMPT IA (SINTAXE CORRIGIDA) ──────────────────────────────────────
@app.get("/api/v1/prompt/{ativo}")
def obter_prompt(
    ativo: str, 
    ma1_p: int = 9, 
    ma2_p: int = 21, 
    ma3_p: int = 200, 
    bb_p: int = 20, 
    bb_d: float = 2.0
):
    config = {"ma1_p": ma1_p, "ma2_p": ma2_p, "ma3_p": ma3_p, "bb_p": bb_p, "bb_d": bb_d}
    return gerar_prompt_analise(f"historico_{ativo.lower()}", config)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)