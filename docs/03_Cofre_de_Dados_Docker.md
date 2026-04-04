# Módulo 3: O Cofre de Dados - Arquitetura Institucional com Docker e PostgreSQL

## 🎯 Objetivo da Aula
Construir um banco de dados relacional de alto desempenho para armazenar anos de histórico financeiro (ticks e candles). Para garantir estabilidade e escalabilidade, abandonaremos o armazenamento em memória ou arquivos de texto (CSV) e adotaremos a **Infraestrutura como Código**, conteinerizando nosso banco de dados com Docker.

## 🧠 A Filosofia do Sistema (Visão DBA)
No desenvolvimento quantitativo para mesas proprietárias, a latência e a perda de dados são fatais. Usamos o PostgreSQL dentro do Docker por três motivos:
1. **Isolamento:** O banco roda em uma "bolha", sem sujar o sistema operacional da sua máquina.
2. **Escalabilidade (VPS):** O robô que roda no seu computador rodará exatamente da mesma forma no servidor em nuvem. Não há "na minha máquina funciona".
3. **Persistência de Dados:** Separamos o motor do banco dos arquivos físicos. Se o contêiner falhar, os dados das suas operações continuam a salvo.

---

## 🛠️ Execução Prática

### Passo 1: Atualizando o Cofre de Segurança (`.env`)
Assim como as credenciais da corretora, as senhas do nosso banco de dados jamais devem ir para o código-fonte. Adicione as seguintes variáveis ao final do seu arquivo `.env`:

```env
# --- Credenciais do Banco de Dados PostgreSQL ---
DB_USER=admin_orquestrador
DB_PASSWORD=senha_super_segura
DB_NAME=orquestrador_db
DB_PORT=5432
```

### Passo 2: O Manifesto de Infraestrutura (`docker-compose.yml`)
Na raiz do seu projeto (no mesmo nível da pasta `backend`), crie o arquivo `docker-compose.yml`. Este é o "projeto arquitetônico" que o Docker lerá para erguer o servidor:

```yaml
services:
  postgres_db:
    image: postgres:15
    container_name: orquestrador_database
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - ./database/data:/var/lib/postgresql/data
```
*Nota didática:* Observe a tag `volumes`. Ela cria a mágica da persistência, mapeando o disco virtual do Docker para a pasta física `database/data` no seu computador.

### Passo 3: Ligando o Motor de Dados
Com o aplicativo do Docker Desktop aberto e rodando em segundo plano no seu sistema operacional, execute o comando de orquestração no terminal do VS Code:

```bash
docker-compose up -d
```
* O parâmetro `-d` (detached) diz ao Docker para construir e rodar o servidor silenciosamente em segundo plano, deixando seu terminal livre.

### ⚠️ Tratamento de Erros (Troubleshooting)
* **Erro:** `failed to connect to the docker API at npipe://...`
* **Causa:** O terminal tentou enviar o comando de construção, mas o motor do Docker Desktop (o *daemon*) está desligado ou fechado.
* **Solução:** Abra o aplicativo do Docker Desktop no Windows, espere o ícone de status ficar verde (Engine running) e execute o comando novamente.

### Passo 4: O "Encanamento" Python <-> PostgreSQL
Com o banco rodando, precisamos instalar os "tradutores" no nosso laboratório Python:
* `psycopg2-binary`: O driver de comunicação de baixo nível.
* `SQLAlchemy`: O ORM que nos permite manipular o banco usando objetos Python, sem precisar escrever SQL puro.

No terminal, com o ambiente virtual `(venv)` ativado:
```bash
pip install sqlalchemy psycopg2-binary
pip freeze > backend/requirements.txt
```

---
**✅ Conclusão do Módulo:** Temos o motor de mercado (MT5) testado e o cofre de dados (PostgreSQL) online. O próximo passo lógico é estabelecer a ponte de conexão entre essas duas potências.
```

---

