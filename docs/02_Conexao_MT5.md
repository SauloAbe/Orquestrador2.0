# Módulo 2: O Despertar do Motor - Conexão Segura com o MetaTrader 5

## 🎯 Objetivo da Aula
Estabelecer a ponte de comunicação oficial entre o nosso ambiente Python e o terminal financeiro (MetaTrader 5), garantindo a captura de dados em tempo real. O foco principal desta etapa é a **Segurança da Informação**: implementar o padrão da indústria para ocultar credenciais e impedir o vazamento de senhas da corretora.

## 🔐 1. O Cofre de Credenciais (O Arquivo `.env`)
O maior erro de programadores iniciantes é digitar senhas diretamente no código-fonte (`hardcoding`). Se esse código for parar no GitHub, a conta da corretora ou da mesa proprietária (como a FTMO) estará comprometida. 

Para resolver isso, usamos variáveis de ambiente.
Na raiz do seu projeto, crie um arquivo chamado **exatamente** `.env` (com o ponto no início) e preencha com os seus dados:

```env
MT5_LOGIN=seu_numero_de_conta_aqui
MT5_PASSWORD=sua_senha_aqui
MT5_SERVER=Nome-Exato-Do-Servidor-Da-Corretora
```
*Nota: Graças ao nosso arquivo `.gitignore` configurado no Módulo 1, o Git ignorará este arquivo. Ele existirá apenas na sua máquina local.*

## 🐍 2. O Script de Comunicação (`mt5_connection.py`)
Dentro da pasta `backend`, criaremos o nosso primeiro script. A função dele é carregar as chaves do cofre, acordar o MT5 e extrair a cotação de um ativo em tempo real.

```python
import MetaTrader5 as mt5
import os
from dotenv import load_dotenv

# 1. Carrega as variáveis de segurança do arquivo .env
load_dotenv()

# Solicitamos a chave (nome da variável) para extrair o valor do cofre
LOGIN = int(os.getenv("MT5_LOGIN"))
PASSWORD = os.getenv("MT5_PASSWORD")
SERVER = os.getenv("MT5_SERVER")

def testar_conexao():
    print("Iniciando o motor de comunicacao com o MT5...")
    
    # 2. Inicializa o terminal injetando as credenciais seguras
    inicializado = mt5.initialize(login=LOGIN, server=SERVER, password=PASSWORD)
    
    if not inicializado:
        print(f"Falha critica na inicializacao. Erro MT5: {mt5.last_error()}")
        quit()

    print(f"Conexao estabelecida com sucesso! Conta: {LOGIN}")

    # 3. Teste de pulso: Capturando dados brutos em milissegundos
    ativo = "BTCUSD" # Usando cripto para garantir leitura 24/7
    mt5.symbol_select(ativo, True)
    
    tick = mt5.symbol_info_tick(ativo)
    if tick is not None:
        print(f"Leitura de Mercado [{ativo}] -> Compra (Ask): {tick.ask} | Venda (Bid): {tick.bid}")
    else:
        print(f"Nao foi possivel ler os dados do ativo {ativo}.")

    # 4. Encerra a conexao elegantemente para liberar memoria
    mt5.shutdown()
    print("Conexao encerrada.")

if __name__ == "__main__":
    testar_conexao()
```

## 🛠️ 3. Tratamento de Erros Comuns (Troubleshooting)

Durante o desenvolvimento de sistemas, erros são indicadores de caminho. Veja os mais comuns nesta fase:

* **Erro `NoneType` ao ler o `.env`:** Ocorre quando você passa o valor direto no `os.getenv()` em vez do *nome* da variável. A função precisa do nome da fechadura (ex: `"MT5_LOGIN"`), e não da senha em si.
* **Retorno de Preço `0.0`:** A conexão foi bem sucedida, mas o preço veio zerado. Isso ocorre por dois motivos:
    1.  **Nomenclatura Incorreta:** O ativo pode ter um sufixo na sua corretora (ex: `XAUUSD.c` ou `BTCUSD.m`). Verifique na janela "Observação do Mercado" (Ctrl+M) do MT5 o nome exato.
    2.  **Mercado Fechado:** Se estiver testando um ativo tradicional (Forex/B3) no final de semana, o último *tick* pode não estar no cache. *Solução: Pivote o teste para um ativo 24/7, como o Bitcoin (`BTCUSD`).*
* **ModuleNotFoundError:** Significa que o terminal não está usando o seu ambiente virtual `(venv)`. Certifique-se de ativar o ambiente e verificar se o VS Code está utilizando o interpretador correto (`Ctrl + Shift + P` -> `Python: Select Interpreter`).

## 🚀 4. Execução e Validação
Com o ambiente virtual ativado, execute no terminal:
```bash
python backend/mt5_connection.py
```
**Resultado Esperado:**
```text
Iniciando o motor de comunicacao com o MT5...
Conexao estabelecida com sucesso! Conta: 12345678
Leitura de Mercado [BTCUSD] -> Compra (Ask): 66863.76 | Venda (Bid): 66862.76
Conexao encerrada.
```

## 💾 5. Consolidando o Conhecimento (Git)
Regra de ouro do Orquestrador: **Nunca mexer no que já foi consolidado**. Com a validação concluída, blindamos o código com um *commit*:
```bash
git add .
git commit -m "feat: Integracao segura com MT5 e carregamento de variaveis via dotenv"
```
---
**✅ Conclusão do Módulo:** O motor está respirando e se comunicando com o mercado sem expor nossos dados críticos. O próximo passo é arquitetar o banco de dados que receberá o histórico massivo dessas cotações.
```