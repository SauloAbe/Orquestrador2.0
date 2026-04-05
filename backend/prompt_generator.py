import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
# Ajuste para garantir conexão com o Docker local
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}"

def _classificar_rsi(rsi: float) -> str:
    if rsi > 70:
        return f"{rsi:.1f} (sobrecomprado — momentum comprador em exaustão)"
    if rsi < 30:
        return f"{rsi:.1f} (sobrevendido — momentum vendedor em exaustão, possível reversão)"
    if rsi > 55:
        return f"{rsi:.1f} (território comprador, momentum saudável)"
    if rsi < 45:
        return f"{rsi:.1f} (território vendedor, pressão de baixa presente)"
    return f"{rsi:.1f} (neutro, mercado sem direção clara)"

def _classificar_tendencia(sma_9: float, sma_21: float, close: float) -> str:
    diff_pct = ((sma_9 - sma_21) / sma_21) * 100
    posicao = "acima" if close > sma_21 else "abaixo"

    if sma_9 > sma_21:
        forca = "com força" if diff_pct > 0.3 else "ainda incipiente"
        return (
            f"tendência de ALTA {forca} — SMA 9 ({sma_9:.2f}) acima da SMA 21 ({sma_21:.2f}), "
            f"separação de {diff_pct:.2f}%. Preço {posicao} da média lenta."
        )
    else:
        forca = "com força" if abs(diff_pct) > 0.3 else "ainda incipiente"
        return (
            f"tendência de BAIXA {forca} — SMA 9 ({sma_9:.2f}) abaixo da SMA 21 ({sma_21:.2f}), "
            f"separação de {abs(diff_pct):.2f}%. Preço {posicao} da média lenta."
        )

def _resumir_velas_recentes(df_recente: pd.DataFrame) -> str:
    linhas = []
    for _, row in df_recente.iterrows():
        corpo = row['close'] - row['open']
        tipo = "alta" if corpo > 0 else "baixa"
        amplitude = abs(corpo)
        # Formatação de hora resiliente
        hora = str(row['time']).split(' ')[-1][:5] if ' ' in str(row['time']) else str(row['time'])[-8:-3]
        linhas.append(
            f"  • {hora} — Abertura {row['open']:.2f} | Fechamento {row['close']:.2f} "
            f"| Máxima {row['high']:.2f} | Mínima {row['low']:.2f} "
            f"(vela de {tipo}, amplitude de {amplitude:.2f})"
        )
    return "\n".join(linhas)

def gerar_prompt_analise(nome_tabela: str = "historico_btcusd") -> dict:
    """
    Lê os dados do banco, traduz em linguagem natural e monta um prompt
    pronto para o Orquestrador 2.0.
    """
    try:
        engine = create_engine(DATABASE_URL)
        # Buscamos as últimas 100 para garantir cálculos estáveis
        query = f"SELECT * FROM {nome_tabela} ORDER BY time ASC LIMIT 100;"
        df = pd.read_sql(query, engine)

        if df.empty or len(df) < 21:
            return {"erro": "Dados insuficientes no banco (mínimo 21 velas)."}

        # Cálculos de Indicadores (SMA e RSI)
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()
        
        delta = df['close'].diff()
        ganho = delta.where(delta > 0, 0)
        perda = -delta.where(delta < 0, 0)
        media_ganho = ganho.ewm(alpha=1/14, min_periods=14).mean()
        media_perda = perda.ewm(alpha=1/14, min_periods=14).mean()
        rs = media_ganho / media_perda
        df['rsi_14'] = 100 - (100 / (1 + rs))

        df = df.dropna(subset=['sma_9', 'sma_21', 'rsi_14'])
        ultima = df.iloc[-1]
        ultimas_5 = df.tail(5)

        # Extração de Dados para o Snapshot
        preco_atual = ultima['close']
        sma_9 = ultima['sma_9']
        sma_21 = ultima['sma_21']
        rsi = ultima['rsi_14']
        maxima_range = df.tail(20)['high'].max()
        minima_range = df.tail(20)['low'].min()
        volatilidade = df.tail(20)['close'].std()

        # Tradução para Linguagem Natural
        desc_tendencia = _classificar_tendencia(sma_9, sma_21, preco_atual)
        desc_rsi = _classificar_rsi(rsi)
        resumo_velas = _resumir_velas_recentes(ultimas_5)

        # Identificação dinâmica do ativo e timeframe
        ativo_base = nome_tabela.replace("historico_", "").upper()
        # Se sua tabela termina em _m5, _m15, etc., ele pega o sufixo
        timeframe_label = ativo_base.split('_')[-1] if '_' in ativo_base else "M5"
        ativo_legivel = ativo_base.split('_')[0].replace("USD", "/USD")

        # ================================================================
        # MONTAGEM DO PROMPT FINAL (ESTRUTURA DE ENGENHARIA)
        # ================================================================
        prompt = f"""Você é um analista técnico sênior especializado em mercados financeiros.
Analise os dados abaixo do ativo {ativo_legivel} e emita um parecer operacional completo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DADOS DE MERCADO — {ativo_legivel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PREÇO ATUAL: {preco_atual:.2f}

TENDÊNCIA (Médias Móveis):
  {desc_tendencia}

MOMENTUM (RSI 14):
  {desc_rsi}

RANGE DAS ÚLTIMAS 20 VELAS:
  Máxima: {maxima_range:.2f}
  Mínima: {minima_range:.2f}
  Volatilidade (SD): {volatilidade:.2f}

ÚLTIMAS 5 VELAS ({timeframe_label}):
{resumo_velas}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INSTRUÇÕES PARA A ANÁLISE (JSON OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com base exclusivamente nos dados acima, responda APENAS com um JSON válido, 
sem markdown, sem explicações extras.

Estrutura do JSON:
{{
  "acao": "COMPRA" | "VENDA" | "AGUARDAR",
  "regiao_entrada": "valor ou range",
  "alvo": numero,
  "stop_loss": numero,
  "risco_retorno": "1:X",
  "forca_sinal": "FORTE/MODERADA/FRACA",
  "racional": "Justificativa técnica em português de 3-5 frases."
}}

Notas: Se AGUARDAR, níveis de preço devem ser null.
"""

        # Objeto Snapshot para os mini-cards do React
        snapshot = {
            "preco": round(float(preco_atual), 2),
            "sma_9": round(float(sma_9), 2),
            "sma_21": round(float(sma_21), 2),
            "rsi": round(float(rsi), 2),
            "maxima_range": round(float(maxima_range), 2),
            "minima_range": round(float(minima_range), 2),
            "time": str(ultima['time'])
        }

        return {
            "ativo": ativo_legivel,
            "prompt": prompt.strip(),
            "snapshot": snapshot
        }

    except Exception as e:
        return {"erro": f"Erro no Gerador de Prompt: {str(e)}"}