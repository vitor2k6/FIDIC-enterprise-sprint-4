# FIDIC InsightFlow — Frontend

## Como rodar

1. Instale as dependências:
```
npm install
```

2. Inicie em modo desenvolvimento:
```
npm run dev
```

3. Acesse: http://localhost:5173

> ⚠️ O backend deve estar rodando em http://localhost:8000

## Build para produção
```
npm run build
```

## Estrutura
```
frontend/
├── src/
│   ├── App.jsx      # Componente principal (dashboard completo)
│   ├── App.css      # Estilos
│   └── main.jsx     # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Funcionalidades
- 📊 KPIs: Total cedentes, Score médio, Inadimplência, Perda total
- 🥧 Gráfico de pizza: Distribuição de risco
- 📊 Gráfico de barras: Cedentes por UF
- 📊 Top 10: Maiores atrasos
- 🔵 Dispersão: Score × Inadimplência
- 📋 Tabela paginada com filtros por UF e risco
