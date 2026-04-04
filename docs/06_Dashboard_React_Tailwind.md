# 📄 06_Dashboard_React_Tailwind.md

## 🎯 Objetivo da Aula
Construir o **Front-End** do Orquestrador 2.0 utilizando as tecnologias de ponta do mercado: **React (via Vite)** e **Tailwind CSS v4**. O foco é transformar os dados JSON da nossa API em um Dashboard Financeiro profissional, com visual institucional e performance de alta velocidade.

---

## 🛠️ 1. Preparação do Ambiente Visual
Diferente do Backend (Python), o Frontend exige o ecossistema **Node.js**.

```powershell
# Criação do projeto com Vite
npm create vite@latest frontend -- --template react

# Instalação do Tailwind CSS v4 e motores de processamento
cd frontend
npm install tailwindcss @tailwindcss/postcss autoprefixer
```

---

## ⚙️ 2. Configuração do Motor de Design (v4)
Para que o visual "lindo" apareça, a integração com o **PostCSS** é obrigatória.

### A. Arquivo `postcss.config.js`
Este arquivo faz a ponte entre o CSS moderno e o que o navegador entende:
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
}
```

### B. Arquivo `src/index.css`
Na versão 4, simplificamos a importação para uma única linha mestra no topo do arquivo:
```css
@import "tailwindcss";
```

---

## 🌉 3. O Desafio do CORS (Cross-Origin Resource Sharing)
Um erro clássico: o navegador bloqueia a comunicação entre a porta `5173` (Frontend) e a `8000` (Backend). 

**Solução no FastAPI (`backend/api.py`):**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, use apenas o domínio do seu front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 4. Lógica de Consumo de Dados (`App.jsx`)
O coração da nossa interface utiliza dois "Hooks" essenciais do React:
1. **`useState`**: Cria uma memória para armazenar os sinais que vêm da API.
2. **`useEffect`**: Dispara o gatilho de busca de dados (`fetch`) assim que a página é carregada.

**Estrutura de Fetch:**
```javascript
useEffect(() => {
  fetch('http://127.0.0.1:8000/api/v1/sinais/btcusd')
    .then(res => res.json())
    .then(json => setDados(json.sinais.reverse()))
    .catch(err => console.error("Erro de conexão:", err));
}, []);
```

---

## 🎨 5. Design System Financeiro
Utilizamos classes utilitárias do Tailwind para garantir o visual "Bloomberg":
* **Cards:** `bg-white rounded-2xl shadow-sm border border-slate-200`.
* **Interatividade:** `transition-all hover:-translate-y-1`.
* **Tipografia:** `font-black` para preços e `font-mono` para dados técnicos.

---

## 🚀 6. Comandos de Execução
Para rodar o ecossistema completo, você precisará de dois terminais abertos:

1. **Terminal Backend:** `uvicorn backend.api:app --reload`
2. **Terminal Frontend:** `npm run dev`

---

## 💾 Salvando no Git (PowerShell Safe)
Lembre-se de não usar `&&` no PowerShell. Execute um por vez:
```powershell
git add .
git commit -m "feat: Dashboard finalizado com Tailwind v4 e integração completa"
```

---

### O que achou dessa estrutura? 
Ela está bem "mão na massa" e foca nos pontos onde tivemos que ajustar o motor (PostCSS e @import). Se estiver tudo certo, agora sim o Orquestrador 2.0 está documentado como um software de nível profissional! 

