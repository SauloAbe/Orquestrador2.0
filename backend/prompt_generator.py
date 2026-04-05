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

def _analisar_contexto_preco(preco, sma_21, maxima, minima):
    """Gera insights textuais sobre a posição do preço no gráfico."""
    distancia_media = ((preco - sma_21) / sma_21) * 100
    ponto_no_range = (preco - minima) / (maxima - minima) if (maxima - minima) != 0 else 0.5
    
    msg = ""
    if ponto_no_range > 0.9: msg += "O preço está testando a RESISTÊNCIA principal. "
    elif ponto_no_range < 0.1: msg += "O preço está testando o SUPORTE principal. "
    else: msg += "O preço está negociando no meio do range atual. "
    
    if abs(distancia_media) > 1.5:
        msg += f"Alerta: O preço está MUITO ESTICADO em relação à média lenta ({distancia_media:.2f}% de distância)."
    else:
        msg += "O preço mantém uma distância saudável da média lenta."
        
    return msg

def _classificar_rsi(rsi: float) -> str:
    if rsi > 70: return f"{rsi:.1f} (ZONA DE EXAUSTÃO COMPRADORA - Risco de correção)"
    if rsi < 30: return f"{rsi:.1f} (ZONA DE EXAUSTÃO VENDEDORA - Risco de repique)"
    return f"{rsi:.1f} (Zona de briga/tendência saudável)"

def _classificar_tendencia(sma_9: float, sma_21: float, close: float) -> str:
    if sma_9 > sma_21:
        status = "ALTA" if close > sma_21 else "ALTA (com preço abaixo da média rápida)"
        return f"Estrutura de {status}. SMA 9 > SMA 21."
    else:
        status = "BAIXA" if close < sma_21 else "BAIXA (com preço tentando romper a média)"
        return f"Estrutura de {status}. SMA 9 < SMA 21."

def gerar_prompt_analise(nome_tabela: str = "historico_btcusd") -> dict:
    try:
        engine = create_engine(DATABASE_URL)
        query = f"SELECT * FROM {nome_tabela} ORDER BY time DESC LIMIT 100;"
        df = pd.read_sql(query, engine)

        if df.empty or len(df) < 21:
            return {"erro": "Dados insuficientes (mínimo 21 velas necessárias)."}

        # Inverte para calcular indicadores na ordem correta
        df = df.sort_values(by='time', ascending=True)
        
        # Indicadores base
        df['sma_9'] = df['close'].rolling(window=9).mean()
        df['sma_21'] = df['close'].rolling(window=21).mean()
        
        delta = df['close'].diff()
        ganho = delta.where(delta > 0, 0)
        perda = -delta.where(delta < 0, 0)
        media_ganho = ganho.ewm(alpha=1/14, min_periods=14).mean()
        media_perda = perda.ewm(alpha=1/14, min_periods=14).mean()
        df['rsi_14'] = 100 - (100 / (1 + (media_ganho / media_perda)))

        ultima = df.iloc[-1]
        
        # Dados de Price Action (Últimas 20 velas)
        maxima_20 = df.tail(20)['high'].max()
        minima_20 = df.tail(20)['low'].min()
        preco_atual = ultima['close']
        
        # Gerando o Contexto Semântico
        contexto = _analisar_contexto_preco(preco_atual, ultima['sma_21'], maxima_20, minima_20)
        tendencia = _classificar_tendencia(ultima['sma_9'], ultima['sma_21'], preco_atual)
        
        ativo_label = nome_tabela.replace("historico_", "").upper()

        # ================================================================
        # NOVO PROMPT ESTRUTURADO (ENGENHARIA DE PROMPT 2.0)
        # ================================================================
        prompt = f"""Você é o 'Orquestrador IA', um bot de alta performance em trading quantitativo.
Analise o ativo {ativo_label} e tome uma decisão baseada em Price Action e Indicadores.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SNAPSHOT TÉCNICO: {ativo_label}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• PREÇO ATUAL: {preco_atual:.2f}
• TENDÊNCIA: {tendencia}
• MOMENTUM: RSI em {_classificar_rsi(ultima['rsi_14'])}
• CONTEXTO: {contexto}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NÍVEIS DE REFERÊNCIA (20p)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• RESISTÊNCIA (Topo): {maxima_20:.2f}
• SUPORTE (Fundo): {minima_20:.2f}
• MÉDIA LENTA (Base): {ultima['sma_21']:.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REGRAS DE SAÍDA (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sua resposta deve ser UNICAMENTE um objeto JSON. Seja conservador. 
Se o RSI estiver acima de 70 ou abaixo de 30, priorize sinais de EXAUSTÃO. 
Se o preço estiver no meio das médias, prefira AGUARDAR.

Estrutura:
{{
  "acao": "COMPRA" | "VENDA" | "AGUARDAR",
  "forca_sinal": "0-100%",
  "regiao_entrada": "valor_exato",
  "alvo": valor_objetivo,
  "stop_loss": valor_protecao,
  "risco_retorno": "ex: 1:2",
  "racional": "Justificativa curta baseada no RSI e no teste de suporte/resistência."
}}
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