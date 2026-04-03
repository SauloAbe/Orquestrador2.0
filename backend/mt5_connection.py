import MetaTrader5 as mt5 # pyright: ignore[reportMissingImports]
import os
from dotenv import load_dotenv

# 1. Carrega as variáveis de segurança do arquivo .env
load_dotenv()
LOGIN = int(os.getenv("MT5_LOGIN"))
PASSWORD = os.getenv("MT5_PASSWORD")
SERVER = os.getenv("MT5_SERVER")

def testar_conexao():
    print("Iniciando o motor de comunicacao com o MT5...")
    
    # 2. Inicializa o terminal injetando as credenciais do cofre
    inicializado = mt5.initialize(login=LOGIN, server=SERVER, password=PASSWORD)
    
    if not inicializado:
        print(f"Falha critica na inicializacao. Erro MT5: {mt5.last_error()}")
        quit()

    print(f"Conexao estabelecida com sucesso! Conta: {LOGIN}")

    # 3. Teste de pulso: Capturando dados brutos em milissegundos
    ativo = "BTCUSD"
    mt5.symbol_select(ativo, True)
    
    tick = mt5.symbol_info_tick(ativo)
    if tick is not None:
        print(f"Leitura de Mercado [{ativo}] -> Compra (Ask): {tick.ask} | Venda (Bid): {tick.bid}")
    else:
        print(f"Nao foi possivel ler os dados do ativo {ativo}.")

    # 4. Encerra a conexao elegantemente
    mt5.shutdown()
    print("Conexao encerrada.")

if __name__ == "__main__":
    testar_conexao()