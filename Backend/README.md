# FIDIC InsightFlow — Backend

## Como rodar

1. Instale as dependências:
```
pip install -r requirements.txt
```

2. Coloque o arquivo `dataset_final.csv` nesta mesma pasta.

3. Inicie o servidor:
```
uvicorn main:app --reload
```

4. Acesse: http://localhost:8000

## Endpoints disponíveis

| Endpoint | Descrição |
|---|---|
| GET / | Status da API |
| GET /kpis | KPIs principais |
| GET /distribuicao-risco | Contagem por classificação |
| GET /cedentes-por-uf | Cedentes agrupados por UF |
| GET /top-atraso | Top 10 cedentes com maior atraso |
| GET /cedentes | Tabela paginada com filtros |
| GET /score-dispersao | Amostra para gráfico de dispersão |
| GET /ufs | Lista de UFs disponíveis |

Documentação interativa: http://localhost:8000/docs
