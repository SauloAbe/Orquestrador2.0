import os
import pandas as pd
from sqlalchemy import create_engine
from backend.indicators import calcular_indicadores

def gerar_prompt_analise(nome_tabela, config):
    try:
        # Busca os dados já calculados com a nova lógica dinâmica
        dados = calcular_indicadores(nome_tabela, config)
        if not dados: return {"erro": "Sem dados"}
        
        ultima = dados[-1]
        ativo = nome_tabela.replace("historico_", "").upper()

        prompt = f"""Atue como um Comitê de Especialistas em Trading Quantitativo para o ativo {ativo}.
        
CONTEXTO TÉCNICO ATUAL (Configuração Dinâmica):
- Preço: {ultima['close']:.2f} | RSI: {ultima['rsi_14']:.1f}
- Médias Configuradas:
  1. MA {config['ma1_p']} ({config['ma1_t']}): {ultima['sma_9']:.2f}
  2. MA {config['ma2_p']} ({config['ma2_t']}): {ultima['sma_21']:.2f}
  3. MA {config['ma3_p']} ({config['ma3_t']}): {ultima['sma_200']:.2f}
- Bollinger ({config['bb_p']}p, {config['bb_d']}d): %B em {ultima['bb_pct']:.2f}

TAREFA: Gere uma análise para 3 setups: TENDÊNCIA, CONSOLIDAÇÃO e SCALPER.
- TENDÊNCIA: Use o alinhamento das 3 médias.
- CONSOLIDAÇÃO: Use exaustão nas Bandas de Bollinger e RSI.
- SCALPER: Momentum de curto prazo.

RETORNE APENAS O JSON:
[{{ "estrategia": "TENDÊNCIA", "acao": "...", "risco_retorno": "...", "alvo": 0, "stop_loss": 0, "racional": "..." }}, ... ]
"""
        return {
            "prompt": prompt.strip(),
            "snapshot": {
                "preco": ultima['close'],
                "rsi": ultima['rsi_14'],
                "bb_pct": ultima['bb_pct'],
                "sma_9": ultima['sma_9'],
                "sma_21": ultima['sma_21'],
                "sma_200": ultima['sma_200']
            }
        }
    except Exception as e:
        return {"erro": str(e)}