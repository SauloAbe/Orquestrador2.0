### 🏆 Auditoria Impecável! A Prova Material!

---

### O Material Didático (Módulo 3.3)

Aqui está a documentação correspondente a essa etapa para os seus alunos. Crie o arquivo `03_3_Auditoria_Dados.md` dentro da pasta `docs` e cole o conteúdo abaixo:

```markdown
# Módulo 3.3: Governança e Auditoria - Lendo o Cofre de Dados

## 🎯 Objetivo da Aula
Garantir a integridade do processo ETL realizando uma auditoria no banco de dados. Vamos construir um script para realizar a engenharia reversa: conectar o Python ao PostgreSQL, executar uma consulta SQL e trazer os dados de volta para o ambiente de laboratório para comprovação visual.

## 🧠 O Papel do Pandas na Leitura de Dados
Assim como o Pandas facilitou a injeção de dados (`to_sql`), ele possui uma ferramenta poderosa para a extração: o `read_sql`. Com apenas uma linha de código, ele envia a consulta para o banco e já transforma a resposta bruta em uma tabela (DataFrame) perfeitamente alinhada e pronta para cálculos estatísticos ou machine learning.

---

## 🛠️ Execução Prática

### 1. O Script de Auditoria (`db_auditor.py`)
No diretório `backend/`, criamos o arquivo focado exclusivamente na leitura dos dados:

```python
import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Carrega as chaves do cofre
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def auditar_tabela(nome_tabela="historico_btcusd"):
    print(f"🔍 Iniciando auditoria na tabela '{nome_tabela}'...")

    try:
        engine = create_engine(DATABASE_URL)
        
        # A Consulta (Query): Usamos LIMIT 5 para não sobrecarregar a tela
        query = f"SELECT * FROM {nome_tabela} LIMIT 5;"
        
        # O Pandas executa a query e monta o DataFrame automaticamente
        df = pd.read_sql(query, engine)
        
        if df.empty:
            print("⚠️ A tabela existe, mas o cofre está vazio!")
        else:
            print(f"✅ Auditoria Concluida! Lendo as 5 primeiras velas arquivadas:\n")
            print(df.to_string(index=False)) 
            
    except Exception as e:
        print(f"❌ Falha critica na auditoria do banco: {e}")

if __name__ == "__main__":
    auditar_tabela()
```

### 2. A Importância do `LIMIT`
Em um sistema quantitativo real, sua tabela terá milhões de linhas. Se você executar um `SELECT *` sem limite de retorno, a memória RAM do seu computador pode estourar tentando desenhar a tabela inteira no terminal. Usar `LIMIT 5` é uma prática de segurança e performance de banco de dados para testes.

## 💾 Salvando o Progresso (Git)
Consolidamos nossa ferramenta de auditoria:
```bash
git add backend/db_auditor.py
git commit -m "feat: Cria script de auditoria e leitura de dados com Pandas read_sql"
```
---
**✅ Conclusão do Módulo:** A fundação de infraestrutura e dados do Orquestrador 2.0 está 100% concluída. Temos comunicação com o mercado, armazenamento seguro e capacidade de leitura. A partir de agora, o sistema está pronto para ganhar inteligência e interface visual.
```

---

