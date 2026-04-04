# Módulo 3.1: A Ponte de Conexão - Integrando Python e PostgreSQL

## 🎯 Objetivo da Aula
Estabelecer o "Data Source" do nosso sistema. Aprenderemos a criar uma ponte de comunicação (Engine) entre o ambiente Python e o banco de dados PostgreSQL, utilizando o padrão de mercado SQLAlchemy para gerenciar conexões de forma profissional e segura.

## 🧠 Conceitos de Engenharia de Dados

### O que é um ORM (Object-Relational Mapping)?
Em sistemas institucionais, evitamos escrever comandos SQL puros espalhados pelo código. Usamos o **SQLAlchemy**, que atua como um tradutor. Ele nos permite tratar tabelas do banco de dados como se fossem objetos simples do Python, facilitando a manutenção e aumentando a segurança contra ataques.

### A String de Conexão (Connection String)
É a "chave mestra" que contém o endereço, a porta e as credenciais do banco. O formato universal que seguiremos é:
`postgresql://usuario:senha@host:porta/nome_do_banco`

---

## 🛠️ Execução Prática

### 1. Criando o Script de Conexão (`db_connection.py`)
No diretório `backend/`, criamos o arquivo responsável por abrir as portas do nosso cofre de dados:

```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Carregamento seguro das chaves do arquivo .env
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DB_HOST = "localhost" 

# Montagem da URL de conexão
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def testar_conexao_banco():
    try:
        # Criação do 'Engine' (O motor de gestão de conexões)
        engine = create_engine(DATABASE_URL)
        
        # Teste de pulso usando um Gerenciador de Contexto (with)
        with engine.connect() as conexao:
            resultado = conexao.execute(text("SELECT version();"))
            versao = resultado.fetchone()[0]
            print(f"✅ Conexão estabelecida! Servidor: {versao}")
            
    except Exception as e:
        print(f"❌ Erro crítico na ponte de dados: {e}")

if __name__ == "__main__":
    testar_conexao_banco()
```

### 2. A Importância do Gerenciador de Contexto (`with`)
No desenvolvimento de robôs de trade, a eficiência é vital. Usar a instrução `with` garante que a conexão com o banco de dados seja fechada automaticamente após o uso. Isso impede o vazamento de memória e evita que o servidor do banco trave por excesso de conexões abertas.

---

## ⚠️ Notas de Design Instrucional (Dica para o Aluno)

Ao rodar este script, você verá que o servidor responde como `Linux Debian`. Isso demonstra o poder do **Docker**: seu código Python está no Windows, mas seu banco de dados está rodando em um ambiente Linux isolado e de alta performance dentro do seu computador.

## 💾 Salvando o Progresso (Git)
Sempre que consolidarmos uma nova funcionalidade, registramos o ponto de restauração:
```bash
git add backend/db_connection.py
git commit -m "feat: Estabelece conexao SQLAlchemy com o banco PostgreSQL"
```
---
**✅ Conclusão do Módulo:** A infraestrutura de armazenamento está conectada e testada. Agora o sistema está pronto para a fase de **Mineração de Dados (ETL)**, onde extrairemos o histórico do MT5 para alimentar nossa inteligência.
