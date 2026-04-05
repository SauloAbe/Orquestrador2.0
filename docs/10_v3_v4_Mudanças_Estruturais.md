## 📄 Documentação de Atualização: Orquestrador 2.0 (v5.4)

### 1. Resumo das Implementações
Nesta sprint, o sistema evoluiu de um visualizador de sinais para um **Terminal de Operações Auditável**, integrando gestão de risco institucional e monitoramento de custódia em tempo real.

### 2. Mudanças Estruturais (Backend)
* **Correção de Lógica de Sinal (Short/Venda):** Implementada cláusula `CASE WHEN` no SQL para inverter o cálculo de P&L em operações de venda.
    * *Lógica:* $Compra = Saída - Entrada$ | $Venda = Entrada - Saída$.
* **Persistência de Lote:** Adicionada a coluna `lote` na tabela `auditoria_ia` para registrar o volume financeiro de cada operação.
* **Rota de Reset:** Criado endpoint `DELETE /api/v1/auditoria/reset_diario` para limpeza de cache e histórico do dia atual, permitindo reinicialização do terminal.
* **Estabilização de Parâmetros:** Correção de tipagem na rota de `prompt` para suportar parâmetros dinâmicos de Médias Móveis (SMA/EMA) e Bandas de Bollinger.

### 3. Evolução da Interface (Frontend)
* **Monitor de Posições Ativas:** Novo componente lateral que exibe ordens com status `ABERTO`, calculando o **P&L Flutuante** a cada 5 segundos com base no último preço (`snapshot`).
* **Calculadora de Lot Sizing:** Integração automática no botão "Auditar". O sistema agora sugere o lote com base na fórmula:
    $$Lote = \frac{Capital \times \%Risco}{Distância\ do\ Stop}$$
* **Painel de Risco Avançado:** Separação visual entre **P&L Hoje**, **Risco Fixo** (1% de 100k = $1.000) e **Risco Disponível** (Equity atual + Lucro do dia).
* **Feedback de UX:** Restauração do botão de cópia de prompt com estados visuais e persistência do gráfico via tratamento de erros no `fetch`.

### 4. Esquema de Banco de Dados (Migração)
A tabela `auditoria_ia` agora segue o esquema:
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | SERIAL | Chave primária |
| `ativo` | VARCHAR | Par de moedas (ex: BTCUSD) |
| `acao` | VARCHAR | COMPRA / VENDA / AGUARDAR |
| `preco_entrada`| FLOAT | Preço de execução |
| `lote` | FLOAT | Volume calculado pela gestão de risco |
| `status` | VARCHAR | ABERTO / GAIN ✅ / LOSS ❌ |

---

## 🚀 Próximo Passo: Atualização do Git

Para subir essas mudanças com "padrão de engenharia", execute os seguintes comandos no seu terminal:

```bash
# 1. Adicionar todas as mudanças ao stage
git add .

# 2. Criar um commit semântico detalhado
git commit -m "feat: implementa monitor de ordens, lot sizing e correção de P&L de venda" -m "Atualiza api.py (v5.4), App.jsx e scripts de migração de banco."

# 3. Enviar para o repositório remoto
git push origin main
```

