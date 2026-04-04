# Módulo 4.1: A Evolução do Cérebro - Osciladores e Momentum (RSI)

## 🎯 Objetivo da Aula
Adicionar uma camada de "exaustão" ao nosso motor quantitativo. Vamos construir o Índice de Força Relativa (RSI) a partir do zero, utilizando a matemática pura e os recursos de vetorização do Pandas. O objetivo é cruzar a direção do mercado (Médias Móveis) com a probabilidade de reversão (RSI).



## 🧠 O Conceito: Por que precisamos do RSI?
As Médias Móveis (SMA) nos dizem a direção (Tendência). Porém, elas possuem um ponto cego: não conseguem identificar se o preço já "esticou" demais. 

Para evitar comprar o topo de uma tendência, utilizamos o **RSI (Relative Strength Index)**, criado por J. Welles Wilder. Ele é um oscilador que varia de 0 a 100:
* **Acima de 70 (Sobrecomprado):** O ativo subiu muito rápido. Há um alto risco de correção (queda).
* **Abaixo de 30 (Sobrevendido):** O ativo caiu de forma agressiva. Oportunidade iminente de compra.
* **Entre 30 e 70 (Neutro):** Movimento saudável, sem exaustão.

---

## 🛠️ Execução Prática: O "Motor Matemático"

Em vez de importar uma biblioteca pronta que esconde o cálculo, vamos construir a fórmula na unha. Atualize o bloco matemático do seu arquivo `backend/indicators.py`:

```python
        # --- 1. INDICADOR DE TENDÊNCIA: SMA ---
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()
        
        df['tendencia'] = df.apply(
            lambda row: 'ALTA 🟢' if row['sma_9'] > row['sma_21'] else 'BAIXA 🔴', axis=1
        )

        # --- 2. OSCILADOR DE MOMENTUM: RSI 14 ---
        # Passo A: O Delta (Diferença de preço entre a vela atual e a anterior)
        delta = df['close'].diff()
        
        # Passo B: Separar Ganhos e Perdas
        ganho = delta.where(delta > 0, 0)
        perda = -delta.where(delta < 0, 0) # Converte a perda para positivo
        
        # Passo C: Média Móvel Exponencial (EWM) de 14 períodos
        periodo_rsi = 14
        media_ganho = ganho.ewm(alpha=1/periodo_rsi, min_periods=periodo_rsi).mean()
        media_perda = perda.ewm(alpha=1/periodo_rsi, min_periods=periodo_rsi).mean()
        
        # Passo D: O Cálculo Final de Welles Wilder
        rs = media_ganho / media_perda
        df['rsi_14'] = 100 - (100 / (1 + rs))

        # --- 3. LÓGICA DE EXAUSTÃO (Filtro do RSI) ---
        def analisar_momentum(rsi):
            if pd.isna(rsi): return 'CALCULANDO...'
            if rsi > 70: return 'SOBRECOMPRADO ⚠️'
            if rsi < 30: return 'SOBREVENDIDO 💥'
            return 'NEUTRO ⚪'

        df['momentum'] = df['rsi_14'].apply(analisar_momentum)