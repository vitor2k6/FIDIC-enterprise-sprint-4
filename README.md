# FIDIC InsightFlow 🔍
 
> Dashboard inteligente de gestão de risco para FIDCs (Fundos de Investimento em Direitos Creditórios)
 
**Data Alchemists · FIAP 2025 · 1TSCO**  
Arthur Constantino · Bárbara Siebra · Matheus Augusto · Vitor Gabriel
 
---
 
## 📌 Sobre o Projeto
 
O **FIDIC InsightFlow** é uma plataforma web que automatiza a análise de risco de cedentes em FIDCs. A solução processa dados transacionais de boletos e informações cadastrais para gerar **scores de risco dinâmicos**, permitindo decisões mais seguras e ágeis na aquisição de direitos creditórios.
 
### Problema resolvido
O mercado de FIDCs exige agilidade extrema na análise de cedentes. Processos manuais baseados em dados estáticos aumentam o risco de inadimplência e geram perdas financeiras. O FIDIC InsightFlow elimina esse gargalo.
 
---
 
## 🏗️ Arquitetura da Solução
 
```
┌─────────────────────────────────────────────────────┐
│                   FIDIC InsightFlow                 │
├───────────────────┬─────────────────────────────────┤
│   Frontend        │   Backend                       │
│   React 19 + Vite │   FastAPI (Python)              │
│   Recharts        │   Pandas + NumPy                │
│   Port: 5173      │   Scikit-learn                  │
│                   │   Port: 8000                    │
├───────────────────┴─────────────────────────────────┤
│                  dataset_final.csv                  │
│         (gerado pelo pipeline de tratamento)        │
└─────────────────────────────────────────────────────┘
```
 
---
 
## 🗂️ Estrutura do Repositório
 
```
fidic-insightflow/
│
├── backend/
│   ├── main.py               # API FastAPI com todos os endpoints
│   ├── requirements.txt      # Dependências Python
│   └── dataset_final.csv     # Dataset tratado (gerado pelo pipeline)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Dashboard completo (KPIs, gráficos, tabela)
│   │   ├── App.css           # Estilos do dashboard
│   │   └── main.jsx          # Entry point React
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── pipeline/
│   ├── Tratamento_FIDIC.py   # Pipeline completo de dados
│   ├── base_auxiliar_fiap.csv
│   └── base_boletos_fiap.csv
│
└── README.md
```
 
---
 
## ⚙️ Como Rodar Localmente
 
### Pré-requisitos
- Python 3.10+
- Node.js 18+
- npm
### 1. Pipeline de dados
```bash
cd pipeline
pip install pandas numpy scikit-learn
python Tratamento_FIDIC.py
# Gera: dataset_final.csv
cp dataset_final.csv ../backend/
```
 
### 2. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Rodando em: http://localhost:8000
# Documentação: http://localhost:8000/docs
```
 
### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
# Rodando em: http://localhost:5173
```
 
> ⚠️ O backend deve estar rodando antes de iniciar o frontend.
 
---
 
## 🔌 Endpoints da API
 
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Status da API |
| GET | `/kpis` | KPIs principais do dashboard |
| GET | `/distribuicao-risco` | Contagem por classificação de risco |
| GET | `/cedentes-por-uf` | Cedentes agrupados por estado |
| GET | `/top-atraso` | Top cedentes com maior atraso médio |
| GET | `/cedentes` | Tabela paginada com filtros |
| GET | `/score-dispersao` | Amostra para gráfico de dispersão |
| GET | `/ufs` | Lista de UFs disponíveis |
 
Documentação interativa completa: `http://localhost:8000/docs`
 
---
 
## 📊 Pipeline de Dados
 
O script `Tratamento_FIDIC.py` executa as seguintes etapas:
 
1. **Ingestão** — leitura das bases `base_auxiliar_fiap.csv` e `base_boletos_fiap.csv`
2. **Limpeza** — remoção de duplicatas, tratamento de nulos
3. **Conversão** — datas e valores numéricos
4. **Métricas transacionais** — atraso em dias, flags de inadimplência, perda financeira
5. **Agregação** — métricas por beneficiário (CNPJ)
6. **Merge** — união das bases auxiliar + transacional
7. **Normalização Min-Max** — padronização dos scores para escala 0–1
8. **Score de risco** — cálculo ponderado com 6 variáveis
9. **Classificação** — Baixo / Médio / Alto Risco
10. **Exportação** — `dataset_final.csv` pronto para o backend
### Fórmula do Score de Risco
 
```
score_risco =
  score_quantidade_v2        × 0.30 +
  score_materialidade_v2     × 0.25 +
  cedente_indice_liquidez_1m × 0.15 +
  (1 - taxa_inadimplencia)   × 0.15 +
  (1 - taxa_atraso)          × 0.10 +
  (1 / (atraso_medio + 1))   × 0.05
```
 
### Classificação
 
| Score | Classificação |
|---|---|
| ≥ 0.75 | 🟢 Baixo Risco |
| 0.50 – 0.74 | 🟡 Médio Risco |
| < 0.50 | 🔴 Alto Risco |
 
---
 
## 🖥️ Funcionalidades do Dashboard
 
### 📊 Visão Geral
- 6 KPIs: Total de Cedentes, Score Médio, Taxa de Inadimplência, Perda Total, Total de Boletos, Valor Total
- Gráfico de pizza: distribuição de risco (Baixo / Médio / Alto)
- Gráfico de barras: cedentes por UF
### 📈 Análise
- Top 10 cedentes com maior atraso médio
- Gráfico de dispersão: Score de Risco × Taxa de Inadimplência (por categoria)
### 📋 Cedentes
- Tabela paginada com 4.612 registros
- Filtros por UF e classificação de risco
- Score bar visual por cedente
- Badges coloridos por nível de risco
---
 
## 🚀 Deploy
 
| Serviço | Plataforma | URL |
|---|---|---|
| Frontend | Render (Static Site) | `https://fidic-insightflow.onrender.com` |
| Backend | Render (Web Service) | `https://fidic-enterprise-sprint-4.onrender.com` |
 
---
 
## 👥 Equipe — Data Alchemists
 
| Nome | RM |
|---|---|
| Arthur Constantino | RM567359 |
| Bárbara Siebra | RM567084 |
| Matheus Augusto Madureira Santos | RM568286 |
| Vitor Gabriel Vieira De Souza | RM566854 |
 
---
 
## 🏫 Informações Acadêmicas
 
- **Instituição:** FIAP
- **Turma:** 1TSCO
- **Empresa Parceira:** Núclea
- **Projeto:** EC Sprint 4 — Solução Final
- **Ano:** 2025
