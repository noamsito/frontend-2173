# Documentación del Flujo de Monitoreo

## Monitoreo con New Relic para **backend-2173**

Este documento explica **paso a paso** cómo instrumentar el servicio `api` de nuestro proyecto `backend-2173` (Node 18 + Docker Compose) con New Relic APM y cómo validar que los datos lleguen correctamente.


---

## 1  Prerequisitos

| Requisito        | Descripción                                                                                 |
|------------------|---------------------------------------------------------------------------------------------|
| License Key      | Solicitar la key al grupo                     |
| Repo local       | Código del backend clonado                                             |
| Docker + Compose | Versión compatible con `compose` v3.8                                                       |

---

## 2  Instalación del agente

```bash
cd backend-2173/api
npm install newrelic --save       # ➊ Añade la dependencia
```

---

## 3  Configuración

### 3.1  Archivo `newrelic.cjs`
> Colocar en `backend-2173/api/`

```js
'use strict';
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'backend-2173'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: { enabled: true },
  logging: { level: 'info' },
  allow_all_headers: true,
  attributes: { enabled: true }
};
```

**¡No** hardcodear la key! Se pasa por variable de entorno.

---

## 4  Actualizar la imagen Docker

Editar `backend-2173/api/Dockerfile`:

```dockerfile
FROM node:18
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY newrelic.cjs ./newrelic.cjs     # ➌ Copia la config
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 5  Variables de entorno

En `docker-compose.yml` añadir bajo `api.environment`:

```yaml
- NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
- NEW_RELIC_APP_NAME=backend-2173
# (opcional) - NEW_RELIC_LOG=stdout   # Manda los logs a docker logs
```

Editar el archivo `.env` en la raíz:

```env
NEW_RELIC_LICENSE_KEY=****lakey****
NEW_RELIC_APP_NAME=backend-2173
```

---

## 6  Levantar el docker

```bash
docker-compose down && docker-compose build --no-cache && docker-compose up
```

---

## 7  Validación del flujo de monitoreo

1. **Logs de arranque**  

   ```bash
   docker compose logs -f api | grep -i newrelic
   ```
   Debería verse `Agent connected to <collector-...>`.

2. **UI de New Relic**  

   * Navegar a **APM & Services → backend-2173**  
   * Esperar ~2 min; refrescar el panel.  
   * Realizar peticiones a `http://localhost:3000/...` y comprobar que el gráfico de _Throughput_ y la lista de _Transactions_ se actualizan.

3. **Vista de transacciones**  

   * Seleccionar una transacción específica  
   * Ver tiempos de respuesta, SQL (PostgreSQL) y trazas.

   *(Incluye aquí capturas de pantalla si las tienes, por ejemplo `docs/images/apm-overview.png` y `docs/images/apm-transaction.png`).*

*(Si no aparecen, revisar variables de entorno y conexión a Internet).*

---
