from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.indicators import calcular_indicadores

# 1. Inicializa o aplicativo UMA ÚNICA VEZ
app = FastAPI(
    title="API Orquestrador 2.0",
    description="Motor de Inteligência Quantitativa e Distribuição de Dados",
    version="1.0.0"
)

# --- BLOCO CRÍTICO DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite qualquer origem (inclusive o localhost:5173 do Vite)
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, etc.
    allow_headers=["*"], # Permite todos os headers
)

# 2. Rota Raiz (O "teste de pulso" da API)
@app.get("/")
def home():
    return {
        "status": "online",
        "sistema": "Orquestrador 2.0",
        "mensagem": "Acesso autorizado. Motor quantitativo operante."
    }

# 3. Rota de Auditoria
@app.get("/status/{ativo}")
def verificar_status_ativo(ativo: str):
    return {
        "ativo": ativo.upper(),
        "monitoramento": True,
        "frequencia": "M15"
    }

# 4. Rota do Motor Quantitativo (O Prato Principal)
@app.get("/api/v1/sinais/{ativo}")
def obter_sinais_quantitativos(ativo: str):
    nome_tabela = f"historico_{ativo.lower()}"
    
    dados_analisados = calcular_indicadores(nome_tabela)
    
    if dados_analisados is None:
        return {"erro": "Falha ao processar os dados ou banco vazio."}
        
    return {
        "ativo": ativo.upper(),
        "quantidade_sinais": len(dados_analisados),
        "sinais": dados_analisados
    }