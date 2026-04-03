import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# 1. Carrega as variáveis de segurança do nosso cofre oculto
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DB_HOST = "localhost" # O Docker mapeou a porta para a nossa própria máquina

# 2. Monta a String de Conexão (O "endereço" do banco)
# O padrão universal é: postgresql://usuario:senha@host:porta/nome_do_banco
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def testar_conexao_banco():
    print("Iniciando a ponte de comunicacao com o PostgreSQL...")
    
    try:
        # 3. Cria o "Motor" de banco de dados do SQLAlchemy
        # Ele gerencia as conexões de forma inteligente para não sobrecarregar o sistema
        engine = create_engine(DATABASE_URL)
        
        # 4. Tenta abrir a porta e executar uma consulta nativa (query) de teste
        with engine.connect() as conexao:
            # Enviamos um comando SQL puro para o Postgres perguntando a versão dele
            resultado = conexao.execute(text("SELECT version();"))
            versao = resultado.fetchone()[0]
            
            print("✅ Conexao com o cofre de dados estabelecida com sucesso!")
            print(f"⚙️ Detalhes do Servidor: {versao}")
            
    except Exception as e:
        print(f"❌ Falha critica ao conectar no banco de dados. \nErro Técnico: {e}")

if __name__ == "__main__":
    testar_conexao_banco()