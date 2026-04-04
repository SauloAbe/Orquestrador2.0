# Módulo 5: O Servidor - Expondo a Inteligência com FastAPI

## 🎯 Objetivo da Aula
Transformar o nosso motor quantitativo local em um serviço acessível pela web. Vamos construir uma API (Application Programming Interface) utilizando o framework **FastAPI** para entregar os nossos sinais de trade em formato JSON, preparando o terreno para a construção de painéis visuais ou integração com robôs de execução em nuvem.

## 🧠 O Conceito da API (A Analogia do Restaurante)
Para entender o fluxo de dados de um sistema profissional, imagine um restaurante:
1. **O Estoque (PostgreSQL):** Onde os ingredientes (dados brutos do mercado) ficam armazenados com segurança.
2. **O Cozinheiro (indicators.py / Pandas):** Quem pega os ingredientes do estoque e prepara o prato (calcula RSI, Médias Móveis, Tendência).
3. **O Garçom (API / FastAPI):** Ele não cozinha e não guarda ingredientes. O trabalho dele é anotar o pedido do cliente (Navegador/Frontend), ir até a cozinha, pegar o prato pronto e entregá-lo no formato padrão de comunicação da internet: o **JSON**.

---

## 🛠️ Execução Prática

### 1. Preparando o Ambiente
Instale o FastAPI e o servidor Uvicorn no seu ambiente virtual:
```bash
pip install fastapi uvicorn
pip freeze > backend/requirements.txt
```

### 2. Ajustando a "Cozinha" (`indicators.py`)
Antes, o nosso script apenas "gritava" o resultado no terminal usando a função `print()`. Para entregar o dado ao Garçom, precisamos alterar o final da função `calcular_indicadores` para usar o comando `return` e formatar o DataFrame do Pandas em um Dicionário nativo do Python:

```python
        # ... cálculos do RSI ...
        df_resultado['rsi_14'] = df_resultado['rsi_14'].round(2)
        
        # Converte a data para texto para a web conseguir ler
        df_resultado['time'] = df_resultado['time'].astype(str)
        
        # Retorna os dados em formato de dicionário (que vira JSON automaticamente)
        return df_resultado.to_dict(orient="records")
```

### 3. O Garçom: Criando o Servidor (`api.py`)
No diretório `backend/`, criamos o arquivo principal da nossa API:

```python
from fastapi import FastAPI
from backend.indicators import calcular_indicadores

# 1. Inicialização Única do Aplicativo
app = FastAPI(
    title="API Orquestrador 2.0",
    description="Motor de Inteligência Quantitativa e Distribuição de Dados",
    version="1.0.0"
)

# 2. Rota de Teste de Pulso
@app.get("/")
def home():
    return {"status": "online", "sistema": "Orquestrador 2.0"}

# 3. Rota do Radar Quantitativo
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
```

---

## 🚀 Como Testar e Rodar
Para rodar uma aplicação FastAPI, utilizamos o servidor Uvicorn. No terminal, execute:
```bash
uvicorn backend.api:app --reload
```
*Dica: A tag `--reload` faz o servidor reiniciar automaticamente a cada salvamento do código, otimizando o desenvolvimento.*

Abra o navegador e acesse:
* **Rota Principal:** `http://127.0.0.1:8000/`
* **Rota de Sinais (JSON):** `http://127.0.0.1:8000/api/v1/sinais/btcusd`
* **A Mágica do FastAPI:** Acesse `http://127.0.0.1:8000/docs` para visualizar a documentação interativa gerada automaticamente (Swagger UI).

---

## ⚠️ Troubleshooting (Erros Comuns)

**Erro "404 Not Found" na rota `/api/v1/sinais/btcusd`:**
Se o navegador não encontrar a sua rota nova, verifique se você não instanciou a variável `app = FastAPI()` **duas vezes** no seu arquivo `api.py`. Se você chamar o construtor do FastAPI no final do arquivo novamente, ele "apagará" a memória do aplicativo, esquecendo todas as rotas declaradas acima dele. O código é lido de cima para baixo (Top-Down).

## 💾 Salvando o Progresso (Git)
Consolidamos o nosso servidor e as rotas de comunicação:
```bash
git add backend/api.py backend/indicators.py backend/requirements.txt
git commit -m "feat: Inicializa servidor FastAPI e integra motor quantitativo na rota de sinais"
```
```