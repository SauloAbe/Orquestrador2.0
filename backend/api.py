from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
import os
from dotenv import load_dotenv

# Importações locais
from backend.indicators import calcular_indicadores
from backend.prompt_generator import gerar_prompt_analise

load_dotenv()
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Orquestrador 2.0 - Auditoria")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependência do Banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modelo de Dados para o Registro
class RegistroAuditoria(BaseModel):
    ativo: str
    estrategia: str
    acao: str
    preco_entrada: float
    alvo: float
    stop_loss: float

@app.get("/")
def home():
    return {"status": "online", "modulo": "Auditoria Operacional"}

@app.get("/api/v1/sinais/{ativo}")
def obter_sinais(ativo: str):
    nome_tabela = f"historico_{ativo.lower()}"
    dados = calcular_indicadores(nome_tabela)
    return {"ativo": ativo.upper(), "sinais": dados or []}

@app.get("/api/v1/prompt/{ativo}")
def obter_prompt_analise(ativo: str):
    return gerar_prompt_analise(f"historico_{ativo.lower()}")

# --- NOVA ROTA DE AUDITORIA ---
@app.post("/api/v1/auditoria/registrar")
def registrar_auditoria(dados: RegistroAuditoria, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO auditoria_ia (ativo, estrategia, acao, preco_entrada, alvo, stop_loss)
            VALUES (:ativo, :estrategia, :acao, :preco_entrada, :alvo, :stop_loss)
        """)
        db.execute(query, {
            "ativo": dados.ativo,
            "estrategia": dados.estrategia,
            "acao": dados.acao,
            "preco_entrada": dados.preco_entrada,
            "alvo": dados.alvo,
            "stop_loss": dados.stop_loss
        })
        db.commit()
        return {"status": "sucesso", "mensagem": "Estratégia registrada para acompanhamento."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)