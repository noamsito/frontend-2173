# Monitoreo New Relic (dashboard)

A continuacion se muestra varias tablas donde se explican puntualmente las condiciones necesarias para poder realizar le monitoreo con New Relic. Junto con las explicaciones de que indican cada parte del dashboard que se presenta en la aplicacion.

## 1. Prerequisitos 
Componente | Versión mínima | Notas
| Componente                     | Versión mínima | Notas                                      |
|--------------------------------|----------------|--------------------------------------------|
| Node.js                        | 18 LTS         | Igual para entorno local y contenedor      |
| npm / pnpm / yarn              | cualquiera     | Usamos npm en los ejemplos                 |
| Cuenta New Relic               | Free Tier      | Necesarios el User key y License key            |
| Docker / Docker Compose        | 24.x           | El backend corre en un contenedor          |

## 2. Instalacion del APM en el backend
#### 1 – Añade la dependencia
```bash
npm install newrelic --save
```

#### 2 – Copia el archivo de configuración base
```bash
cp node_modules/newrelic/newrelic.js ./newrelic.js
```

#### 3 - Creacion de archivo auxiliar para utilizacion de libreria
```bash
touch newrelic-init.cjs
```
Contenido de este ultimo archivo:
```cjs
require('newrelic')
```

## 2.1 Requisitos extras (Dockerfile, docker-compose)

| **Variable**                          | **Valor**   | **Descripción**                                                              |
|---------------------------------------|--------------------|------------------------------------------------------------------------------|
| NEW_RELIC_LICENSE_KEY                 |     2a9b48ca67bc5211688f3a68d3e25d09FFFFNRAL        | Clave de licencia                                                            |
| NEW_RELIC_APP_NAME                    | new_relic_back     | Nombre lógico mostrado en la UI                                              |
| NEW_RELIC_LOG                         | stdout    | Sirve para ver los logs asociados a new relic en la consola |
| NEW_RELIC_DISTRIBUTED_TRACING_ENABLED | true               | Activa trazabilidad de extremo a extremo                                     |

Concretamente el docker-compose se tiene que ver algo por el estilo:
```yml
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      - DB_HOST=db
      - DB_USER=postgres
      - DB_PASSWORD=admin123
      - DB_NAME=stock_data
      - DB_PORT=5432
      - GROUP_ID=1
      - NEW_RELIC_LICENSE_KEY=2a9b48ca67bc5211688f3a68d3e25d09FFFFNRAL
      - NEW_RELIC_APP_NAME=new_relic_back
      - NEW_RELIC_LOG=stdout
```


## 3. Explicaciones del flujo de monitoreo
| Área UI                        | Métrica / Insight                              | Cómo interpretarlo                          |
|----------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------|
| Web transactions time (gráfico de barras apiladas) | Latency por capa (Node.js, Postgres, Response time) | El ancho de banda azul indica tiempo de CPU/loop en Node.js; la franja amarilla simboliza tiempo en queries a tu base de datos |
| Apdex score                      | Satisfacción de usuarios (0 – 1)              | Valores ≥ 0.85 → buen UX; < 0.70 → alerta                                         |
| Transactions (menú lateral)      | Lista de endpoints con mayor duración/promedio | Optimiza los que tengan p95 alto                                                 |
| Databases                        | Consultas más lentas                          | Agrega índices o usa lazy loading                                                |
| Errors inbox / Logs              | Trazas de stack y excepciones                | Relaciónalo con tu Sentry u otro tracker                                         |
| Related entities → Infrastructure| Conexión al agente de infraestructura        | Si hay “2 hosts” ya se está obteniendo métricas de CPU, RAM y disco                |