# ==========================================================
# FIDIC InsightFlow - Backend FastAPI
# ==========================================================

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os

app = FastAPI(title="FIDIC InsightFlow API", version="1.0.0")

# CORS — permite o frontend React se conectar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# CARREGAR DATASET
# Coloque o dataset_final.csv na mesma pasta deste arquivo
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "dataset_final.csv")

df = pd.read_csv(CSV_PATH)

# Encurtar id_cnpj para exibição
df["id_cedente"] = df["id_cnpj"].str[:12] + "..."

# Garantir tipos corretos
numeric_cols = [
    "score_risco", "taxa_inadimplencia", "taxa_atraso",
    "atraso_medio", "perda_total", "valor_total",
    "valor_recebido", "qtd_boletos", "prazo_medio_pagamento"
]
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

print(f"Dataset carregado: {len(df)} registros")


# ==========================================================
# ENDPOINTS
# ==========================================================

@app.get("/")
def root():
    return {"message": "FIDIC InsightFlow API - Online", "registros": len(df)}


@app.get("/kpis")
def get_kpis():
    """KPIs principais para os cartões do dashboard"""
    total_cedentes = int(df["id_cnpj"].nunique())
    score_medio = round(float(df["score_risco"].mean()), 4)
    taxa_inadimplencia_media = round(float(df["taxa_inadimplencia"].mean()), 4)
    perda_total = round(float(df["perda_total"].sum()), 2)
    total_boletos = int(df["qtd_boletos"].sum())
    valor_total = round(float(df["valor_total"].sum()), 2)

    return {
        "total_cedentes": total_cedentes,
        "score_medio": score_medio,
        "taxa_inadimplencia_media": taxa_inadimplencia_media,
        "perda_total": perda_total,
        "total_boletos": total_boletos,
        "valor_total": valor_total,
    }


@app.get("/distribuicao-risco")
def get_distribuicao_risco():
    """Contagem por classificação de risco para gráfico de pizza"""
    dist = df["classificacao_risco"].value_counts().reset_index()
    dist.columns = ["classificacao", "quantidade"]
    return dist.to_dict(orient="records")


@app.get("/cedentes-por-uf")
def get_cedentes_por_uf():
    """Contagem de cedentes por UF para gráfico de barras"""
    uf = df.groupby("uf")["id_cnpj"].nunique().reset_index()
    uf.columns = ["uf", "quantidade"]
    uf = uf.sort_values("quantidade", ascending=False).head(15)
    return uf.to_dict(orient="records")


@app.get("/top-atraso")
def get_top_atraso(limit: int = Query(default=10, le=50)):
    """Top cedentes por atraso médio"""
    top = df[df["atraso_medio"] > 0].nlargest(limit, "atraso_medio")[
        ["id_cedente", "uf", "atraso_medio", "taxa_inadimplencia", "classificacao_risco"]
    ]
    return top.to_dict(orient="records")


@app.get("/cedentes")
def get_cedentes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
    classificacao: str = Query(default=None),
    uf: str = Query(default=None),
    busca: str = Query(default=None),
):
    """Tabela paginada de cedentes com filtros"""
    filtrado = df.copy()

    if classificacao:
        filtrado = filtrado[filtrado["classificacao_risco"] == classificacao]
    if uf:
        filtrado = filtrado[filtrado["uf"] == uf]
    if busca:
        filtrado = filtrado[filtrado["id_cedente"].str.contains(busca, case=False, na=False)]

    total = len(filtrado)
    start = (page - 1) * page_size
    end = start + page_size

    pagina = filtrado.sort_values("score_risco", ascending=False).iloc[start:end][
        ["id_cedente", "uf", "score_risco", "classificacao_risco",
         "taxa_inadimplencia", "atraso_medio", "perda_total", "qtd_boletos"]
    ]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": int(np.ceil(total / page_size)),
        "data": pagina.to_dict(orient="records"),
    }


@app.get("/cedente/{id_cnpj_parcial}")
def get_cedente_detalhe(id_cnpj_parcial: str):
    """Detalhe de um cedente específico"""
    resultado = df[df["id_cedente"].str.startswith(id_cnpj_parcial)]
    if resultado.empty:
        return {"erro": "Cedente não encontrado"}
    row = resultado.iloc[0]
    return row.replace({float("nan"): None}).to_dict()


@app.get("/score-dispersao")
def get_score_dispersao(sample: int = Query(default=300, le=1000)):
    """Amostra para gráfico de dispersão score x inadimplência"""
    amostra = df.sample(min(sample, len(df)), random_state=42)[
        ["score_risco", "taxa_inadimplencia", "classificacao_risco", "uf"]
    ]
    return amostra.to_dict(orient="records")


@app.get("/ufs")
def get_ufs():
    """Lista de UFs disponíveis para filtro"""
    return sorted(df["uf"].dropna().unique().tolist())
