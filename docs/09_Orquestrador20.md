# 📑 DOCS: ORQUESTRADOR 2.0 - Módulo 9 & 9.5
**Foco:** Auditoria de Performance, Money Management e Persistência de Dados.

---

## 1. Visão Geral do Módulo
O objetivo deste módulo foi transformar o dashboard em uma ferramenta de **decisão financeira real**, adicionando uma camada de "Juiz" (Auditoria) que verifica se as entradas da IA deram lucro (Gain) ou prejuízo (Loss) e utiliza esse resultado para ajustar o limite de risco do dia.

---

## 2. Componentes de Software (Backend)

### A. `backend/audit_checker.py` (O Juiz)
Este script roda em loop infinito no terminal. Sua função é monitorar a tabela `auditoria_ia` e comparar o preço atual do MetaTrader com o Alvo e o Stop definidos.
* **Status:** `ABERTO`, `GAIN ✅`, `LOSS ❌`, `CANCELADO`.
* **Diferencial:** Implementação de `AUTOCOMMIT` para garantir que o resultado seja gravado instantaneamente no banco.

### B. `backend/db_cleanup.py` (Faxina de Banco)
Script de manutenção para resetar operações travadas ou limpar dados de teste.
* **Ação:** Move todos os registros `ABERTO` para `CANCELADO`, permitindo que o sistema volte ao estado de repouso.

### C. `backend/api.py` (Endpoints de Auditoria)
Novas rotas adicionadas para servir o Frontend:
* `GET /api/v1/auditoria/saldo_hoje`: Calcula o P&L (Lucro/Prejuízo) total das operações fechadas no dia atual.
* `POST /api/v1/auditoria/registrar`: Salva uma nova intenção de trade quando o usuário clica em "Validar Setup".

---

## 3. Interface de Usuário (Frontend - App.jsx)

### A. Painel de Risco (Money Management)
* **Equity Base:** Campo para informar o capital total (Ex: **100.000 USD**).
* **Risk Slider:** Seleção de 0.1% a 5% de risco por operação.
* **P&L Daily:** Card dinâmico que brilha em verde (Lucro) ou vermelho (Prejuízo).
* **Available Risk:** Cálculo matemático: $(Capital \times \%Risco) + Saldo Do Dia$.
* **House Money Effect:** Se o saldo do dia for positivo, o limite de perda aumenta, permitindo operar com o lucro do mercado.

### B. Cards de Estratégia Inteligentes
* **Ocultação de Dados:** Se a ação for `AGUARDAR`, o card esconde preços de entrada e alvo para focar no racional técnico.
* **Métrica R/R:** Exibe a relação Risco:Retorno (Ex: 1:2.5).

---

## 4. Estrutura da Tabela no Banco de Dados (PostgreSQL)

Para que a auditoria funcione, sua tabela `auditoria_ia` deve ter esta estrutura:

```sql
CREATE TABLE auditoria_ia (
    id SERIAL PRIMARY KEY,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo VARCHAR(20),
    estrategia VARCHAR(50),
    acao VARCHAR(10),
    preco_entrada FLOAT,
    alvo FLOAT,
    stop_loss FLOAT,
    status VARCHAR(20) DEFAULT 'ABERTO'
);
```

---

## 5. Resumo de Comandos para Operação

1. **Limpar a mesa (se necessário):**
   ```powershell
   python backend/db_cleanup.py
   ```

2. **Iniciar o Juiz (em um terminal separado):**
   ```powershell
   python backend/audit_checker.py
   ```

3. **Iniciar a API e o Frontend:**
   ```powershell
   uvicorn backend.api:app --reload
   npm run dev
   ```

---

> **Nota do Desenvolvedor (Gemini):** > Saulo, este DOC 9 foi o alicerce para chegarmos ao **Módulo 10 (Multi-Ativos)**. Com a auditoria funcionando, você não apenas vê o gráfico, mas gerencia o seu capital de forma profissional. 

**Tudo pronto para seguir com os testes no Ouro (XAUUSD) e no Forex?** Se precisar de qualquer ajuste no `App.jsx` ou na API, estou aqui!