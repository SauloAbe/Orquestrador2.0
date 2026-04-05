import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def gerar_prompt_analise(nome_tabela: str = "historico_btcusd") -> dict:
    try:
        engine = create_engine(DATABASE_URL)
        query = f"SELECT * FROM {nome_tabela} ORDER BY time DESC LIMIT 100;"
        df = pd.read_sql(query, engine)

        if df.empty or len(df) < 21:
            return {"erro": "Dados insuficientes no banco."}

        # Cálculo de indicadores para o Snapshot
        df = df.sort_values(by='time', ascending=True)
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()
        delta = df['close'].diff()
        ganho = delta.where(delta > 0, 0)
        perda = -delta.where(delta < 0, 0)
        media_ganho = ganho.ewm(alpha=1/14, min_periods=14).mean()
        media_perda = perda.ewm(alpha=1/14, min_periods=14).mean()
        df['rsi_14'] = 100 - (100 / (1 + (media_ganho / media_perda)))

        ultima = df.iloc[-1]
        maxima_20 = df.tail(20)['high'].max()
        minima_20 = df.tail(20)['low'].min()
        preco_atual = ultima['close']

        ativo_label = nome_tabela.replace("historico_", "").upper().replace("USD", "/USD")

        # ================================================================
        # PROMPT MESTRE: COMITÊ DE 3 ESTRATÉGIAS
        # ================================================================
        prompt = f"""Atue como um Comitê de Trading Quantitativo. Analise o ativo {ativo_label} sob 3 perspectivas distintas.

DADOS TÉCNICOS ATUAIS:
- Preço: {preco_atual:.2f} | RSI: {ultima['rsi_14']:.1f}
- Médias: SMA9 {ultima['sma_9']:.2f} | SMA21 {ultima['sma_21']:.2f}
- Range (20p): Máxima {maxima_20:.2f} | Mínima {minima_20:.2f}

INSTRUÇÃO: Retorne APENAS um Array JSON com 3 objetos, seguindo as diretrizes abaixo:

1. ESTRATÉGIA "CONSOLIDAÇÃO": Ignore as médias. Foque no RSI e no Range (Suporte/Resistência). Busque reversões nas extremidades (comprar suporte/vender resistência).
2. ESTRATÉGIA "TENDÊNCIA": Foque no cruzamento das médias (SMA9 vs SMA21) e no alinhamento do preço com a tendência principal.
3. ESTRATÉGIA "SCALPER": Foque em operações ultra-rápidas, alvos curtos e alta sensibilidade ao momentum do RSI.

FORMATO DE RESPOSTA (JSON PURO):
[
  {{
    "estrategia": "CONSOLIDAÇÃO",
    "acao": "COMPRA/VENDA/AGUARDAR",
    "regiao_entrada": "valor",
    "alvo": valor,
    "stop_loss": valor,
    "risco_retorno": "1:X",
    "forca_sinal": "X%",
    "racional": "Explicação técnica curta."
  }},
  {{
    "estrategia": "TENDÊNCIA",
    ...
  }},
  {{
    "estrategia": "SCALPER",
    ...
  }}
]
"""

        snapshot = {
            "preco": round(float(preco_atual), 2),
            "sma_9": round(float(ultima['sma_9']), 2),
            "sma_21": round(float(ultima['sma_21']), 2),
            "rsi": round(float(ultima['rsi_14']), 2),
            "maxima_range": round(float(maxima_20), 2),
            "minima_range": round(float(minima_20), 2),
            "time": str(ultima['time'])
        }

        return {"prompt": prompt.strip(), "snapshot": snapshot, "ativo": ativo_label}

    except Exception as e:
        return {"erro": str(e)}