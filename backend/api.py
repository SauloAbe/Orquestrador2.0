from fastapi import FastAPI

# Inicializa o aplicativo FastAPI
app = FastAPI(
    title="API Orquestrador 2.0",
    description="Motor de Inteligência Quantitativa e Distribuição de Dados",
    version="1.0.0"
)

# Rota Raiz (O "teste de pulso" da API)
@app.get("/")
def home():
    return {
        "status": "online",
        "sistema": "Orquestrador 2.0",
        "mensagem": "Acesso autorizado. Motor quantitativo operante."
    }

# Rota de Auditoria (Para testarmos a entrega de parâmetros)
@app.get("/status/{ativo}")
def verificar_status_ativo(ativo: str):
    return {
        "ativo": ativo.upper(),
        "monitoramento": True,
        "frequencia": "M15"
    }