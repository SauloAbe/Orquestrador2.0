from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.indicators import calcular_indicadores
from backend.prompt_generator import gerar_prompt_analise

app = FastAPI(title="API Orquestrador 2.0 - Multi-Strategy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "online", "sistema": "Orquestrador Multi-Estratégia"}

@app.get("/api/v1/sinais/{ativo}")
def obter_sinais(ativo: str):
    nome_tabela = f"historico_{ativo.lower()}"
    dados = calcular_indicadores(nome_tabela)
    if dados is None: return {"erro": "Banco vazio ou erro no cálculo."}
    return {"ativo": ativo.upper(), "sinais": dados}

@app.get("/api/v1/prompt/{ativo}")
def obter_prompt_analise(ativo: str):
    nome_tabela = f"historico_{ativo.lower()}"
    resultado = gerar_prompt_analise(nome_tabela)
    return resultado

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)