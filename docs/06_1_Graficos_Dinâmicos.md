# Módulo 6.1: Visualização Avançada com Recharts

## 🎯 Objetivo
Transformar dados brutos em inteligência visual através de gráficos de linha dinâmicos, facilitando a leitura de cruzamentos de médias móveis.

## 🛠️ Nova Ferramenta: Recharts
A `Recharts` é uma biblioteca baseada em componentes React que utiliza SVG para renderizar gráficos leves e responsivos.

### Conceitos Chave:
1. **ResponsiveContainer:** Garante que o gráfico se ajuste a qualquer tamanho de tela (Mobile ou Desktop).
2. **LineChart & Lines:** Mapeamos o `close` (Preço), `sma_9` e `sma_21` para diferentes linhas com cores distintas.
3. **Tooltip Customizada:** Criamos uma janela flutuante que mostra os valores exatos ao passar o mouse sobre o gráfico.

## 💡 Insight para o Trader
O gráfico deve sempre receber o array de dados na ordem **cronológica**, enquanto a lista de cards deve ser **invertida** (.reverse()) para mostrar o sinal mais recente no topo.