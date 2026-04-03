# Módulo 1: Construindo a Casamata - O Alicerce do Orquestrador 2.0

## 🎯 Objetivo da Aula
Capacitar o aluno a estruturar um ambiente de desenvolvimento isolado, seguro e profissional. Na análise e desenvolvimento de sistemas quantitativos, a arquitetura inicial dita a estabilidade do software em produção. Este é o nosso primeiro passo prático na jornada de transformar o dado bruto em uma decisão de trade automatizada.

## 🧠 A Filosofia do Sistema
No desenvolvimento de robôs para mesas proprietárias (como a FTMO) ou para operar o próprio capital no mercado financeiro, a disciplina não é apenas comportamental, ela deve estar no código. Adotamos aqui duas regras de ouro inegociáveis:
1. **Vamos manter o foco:** Cada módulo (banco de dados, comunicação, inteligência) tem uma responsabilidade única.
2. **Nunca mexer no que já foi consolidado:** Uma vez que a base é testada e validada, ela é blindada. Construímos camadas superiores sem desestabilizar o núcleo.

---

## 🛠️ Execução Prática

### Passo 1: A Arquitetura de Pastas
Para evitar a "espaguetificação" do projeto, dividimos o nosso ecossistema em diretórios lógicos. No terminal, execute:

```bash
mkdir Orquestrador2.0
cd Orquestrador2.0
mkdir backend frontend database bot_telegram docs