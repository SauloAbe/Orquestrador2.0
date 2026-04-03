Aqui está o material formatado. A estrutura pedagógica foi desenhada com a visão de um Tecnólogo em Análise e Desenvolvimento de Sistemas: partindo de um isolamento rigoroso da aplicação para garantir escalabilidade. 

Você pode copiar o bloco de código abaixo e colar diretamente no seu arquivo `01_Preparacao_Ambiente.md` dentro da pasta `docs`.

```markdown
# Módulo 1: Construindo a Casamata - O Alicerce do Orquestrador 2.0

## 🎯 Objetivo da Aula
Capacitar o aluno a estruturar um ambiente de desenvolvimento isolado, seguro e profissional. Na análise e desenvolvimento de sistemas quantitativos, a arquitetura inicial dita a estabilidade do software em produção. Este é o nosso primeiro passo prático na jornada de transformar o dado bruto em uma decisão de trade automatizada.

## 🧠 A Filosofia do Sistema
No desenvolvimento de robôs para mesas proprietárias (como a FTMO) ou para operar o próprio capital no mercado financeiro, a disciplina não é apenas comportamental, ela deve estar no código. Adotamos aqui duas regras de ouro inegociáveis:
1. **Vamos manter o foco:** Cada módulo (banco de dados, comunicação, inteligência) tem uma responsabilidade única.
2. **Nunca mexer no que já foi consolidado:** Uma vez que a base é testada e validada, ela é blindada. Construímos camadas superiores sem desestabilizar o núcleo.

---

## 🛠️ Execução Prática

### Passo 1: A Arquitetura de Pastas
Para evitar a "espaguetificação" do projeto, dividimos o nosso ecossistema em diretórios lógicos. No terminal, execute:

```bash
mkdir Orquestrador2.0
cd Orquestrador2.0
mkdir backend frontend database bot_telegram docs
```
* **`backend/`**: Motor principal (Python, Machine Learning, conexão MT5).
* **`frontend/`**: Painel visual de controle e risco (React).
* **`database/`**: Configurações de contêineres e armazenamento (Docker + PostgreSQL).
* **`bot_telegram/`**: Sistema de alertas e controle remoto via smartphone.
* **`docs/`**: Documentação técnica e material didático.

### Passo 2: O Ambiente Virtual (O Laboratório)
Nunca instale bibliotecas de automação financeira no Python global do seu computador. Criamos um "ambiente virtual" para isolar o projeto:

```bash
# Criando o ambiente virtual
python -m venv venv

# Ativando no Windows:
.\venv\Scripts\activate

# Ativando no Linux/Mac:
source venv/bin/activate
```
*Sinal de sucesso:* O prefixo `(venv)` aparecerá na linha de comando do seu terminal.

### Passo 3: Equipando o Motor
Com o laboratório selado, instalamos apenas a tríade essencial para a comunicação de dados:

```bash
pip install MetaTrader5 pandas python-dotenv
```

#### Por que essas bibliotecas?
* **`MetaTrader5`**: A ponte oficial que permite ao Python ler os gráficos e enviar as ordens para a corretora.
* **`pandas`**: O padrão ouro em manipulação de dados estruturados. Ele higieniza e organiza os *ticks* de mercado em tabelas de altíssima performance.
* **`python-dotenv`**: Nossa camada de segurança. Ele permite armazenar credenciais, senhas e tokens em arquivos ocultos, impedindo que dados sensíveis vazem no código-fonte.

### Passo 4: Congelando as Dependências
Para garantir que o robô funcione em qualquer servidor nuvem (VPS) no futuro com as exatas mesmas configurações validadas hoje, geramos um retrato das nossas instalações:

```bash
pip freeze > backend/requirements.txt
```

---
**✅ Conclusão do Módulo:** A fundação do Orquestrador 2.0 está cimentada. O próximo passo é estabelecer e validar a nossa primeira conexão com o terminal financeiro.
```