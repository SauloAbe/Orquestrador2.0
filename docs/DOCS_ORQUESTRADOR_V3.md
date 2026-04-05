# 📗 Documentação Técnica: Orquestrador 2.0 - v3.0 (Auditoria)

## 🎯 Módulo 8: Camada de Auditoria Operacional
O objetivo desta camada é transformar palpites de IA em dados estatísticos. O sistema agora não apenas sugere, mas permite que o trader registre a decisão para posterior conferência de assertividade (Gain/Loss).

### 🏗️ Estrutura de Banco de Dados
- **Tabela `auditoria_ia`:**
    - Armazena: Time, Ativo, Setup (Consolidação/Tendência/Scalper), Alvos e Stops.
    - Status Inicial: `ABERTO`.

### 🔄 Fluxo de Dados
1. **Frontend:** O componente `CardAnalise` expõe o botão "Validar Estratégia".
2. **API:** Recebe um `POST` no endpoint `/api/v1/auditoria/registrar`.
3. **Persistência:** O PostgreSQL guarda o snapshot da operação.

### 🛠️ Comandos de Atualização (GitHub)
```powershell
git add backend/setup_audit.py backend/api.py frontend/src/App.jsx
git commit -m "feat: implementa Módulo 8 - Auditoria de Performance"
git push origin main