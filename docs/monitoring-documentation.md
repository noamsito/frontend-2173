# Documentación del Flujo de Monitoreo

## Introducción

Este documento detalla los pasos necesarios para instalar, configurar y seguir el flujo de monitoreo de nuestra aplicación de Stock Market. Hemos implementado múltiples capas de monitoreo para asegurar la robustez del sistema, la detección temprana de errores y la capacidad de recuperación ante fallos.

## Componentes de Monitoreo Implementados

Nuestro sistema cuenta con varias capas de monitoreo:

1. **Logs de aplicación**: Implementamos logs detallados en todos los componentes críticos
2. **Sistema de registro de eventos**: Almacenamiento persistente de eventos importantes en base de datos
3. **Monitoreo de conexión MQTT**: Supervisión continua del estado de la conexión con el broker
4. **Mecanismo de reintentos con retraso Fibonacci**: Para operaciones que pueden fallar temporalmente
5. **Monitoreo de infraestructura con New Relic**: Para supervisión en tiempo real del rendimiento

## 1. Instalación y Configuración del Monitoreo

### Configuración de New Relic (Monitoreo de Infraestructura)

Para replicar nuestra configuración de monitoreo con New Relic:

1. Crear una cuenta en [New Relic](https://newrelic.com/)
2. Obtener la clave de licencia desde la configuración de la cuenta
3. Agregar la clave de licencia al archivo `.env` de la aplicación:

```
NEW_RELIC_LICENSE_KEY=tu_clave_aquí
NEW_RELIC_APP_NAME=stockmarket-app
```

4. Instalar el agente de New Relic en el contenedor Docker:

Agregar al Dockerfile del backend:

```dockerfile
# Instalar el agente de New Relic
RUN npm install newrelic --save

# Copiar el archivo de configuración
COPY newrelic.js .
```

5. Crear el archivo `newrelic.js` en la raíz del proyecto:

```javascript
'use strict'

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'stockmarket-app'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
```

6. Modificar el archivo `server.js` para importar New Relic al inicio del archivo:

```javascript
require('newrelic');
import express from 'express';
// resto del código...
```

### Configuración de Logs en la Aplicación

Los logs están configurados por defecto en la aplicación. Para asegurar que funcionan correctamente:

1. Verificar que Docker Compose esté configurado para mostrar los logs:

```yaml
services:
  api:
    # Otras configuraciones...
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  
  mqtt-client:
    # Otras configuraciones...
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 2. Seguimiento del Flujo de Monitoreo

### Visualización de Logs en Tiempo Real

Para ver los logs de la aplicación en tiempo real:

```bash
# Ver logs de todos los contenedores
docker-compose logs -f

# Ver logs de un contenedor específico
docker-compose logs -f api
docker-compose logs -f mqtt-client
```

Los logs capturan información crucial como:
- Conexiones al broker MQTT
- Solicitudes de compra enviadas y recibidas
- Validaciones de compra
- Errores y reintentos

### Sistema de Registro de Eventos

Nuestra aplicación registra eventos importantes en la base de datos. Para acceder a estos registros:

1. A través de la API:
   ```
   GET /events
   ```

2. Puede filtrar por tipo de evento:
   ```
   GET /events?type=IPO
   GET /events?type=EMIT
   GET /events?type=PURCHASE_VALIDATION
   GET /events?type=EXTERNAL_PURCHASE
   ```

3. Los eventos incluyen:
   - IPOs y emisiones de acciones
   - Solicitudes de compra
   - Validaciones de compras
   - Compras externas de otros grupos

### Monitoreo de la Conexión MQTT

La conexión con el broker MQTT se monitorea constantemente:

1. En el archivo `mqttConnect.js` implementamos:
   - Detección de desconexiones
   - Reconexión automática con retraso Fibonacci
   - Logs de estado de la conexión

2. Visualización del estado:
   ```bash
   docker-compose logs -f mqtt-client | grep "Conectado"
   docker-compose logs -f mqtt-client | grep "Reconectando"
   ```

### Estrategia de Reintentos con Fibonacci

Implementamos reintentos con retraso Fibonacci para operaciones críticas:

1. Conexión al broker MQTT
2. Envío de actualizaciones de stock a la API
3. Procesamiento de solicitudes y validaciones de compra

Para monitorear este comportamiento:
```bash
docker-compose logs -f mqtt-client | grep "Reintentando"
```

## 3. Dashboard de New Relic

Una vez configurado New Relic, puede acceder al dashboard para visualizar métricas de rendimiento:

1. Iniciar sesión en [New Relic](https://one.newrelic.com)
2. Navegar a "APM & Services" para ver el rendimiento de la aplicación
3. Explorar métricas como:
   - Tiempo de respuesta promedio
   - Throughput (solicitudes por minuto)
   - Error rate (tasa de errores)
   - Consumo de CPU y memoria
   - Tiempo de respuesta de bases de datos

4. Configurar alertas para recibir notificaciones cuando:
   - El tiempo de respuesta supere un umbral definido
   - La tasa de errores aumente significativamente
   - El consumo de recursos sea excesivo

## 4. Depuración y Resolución de Problemas

Los logs detallados han sido fundamentales para probar y depurar la aplicación. Para resolver problemas comunes:

### Problemas de Conexión MQTT

```bash
docker-compose logs -f mqtt-client | grep "Error"
```

Buscar errores como:
- Credenciales incorrectas
- Problemas de red
- Errores en los mensajes enviados

### Validaciones de Compra Fallidas

```bash
docker-compose logs -f api | grep "validation"
```

Examinar:
- Estado de la validación (ACCEPTED, REJECTED, error)
- Razones de rechazo
- Problemas de formato en las solicitudes

### Inconsistencias en las Acciones

Utilizar el endpoint de debug para verificar duplicados:
```
GET /debug/check-duplicates
```

## Resumen

Nuestro sistema de monitoreo multicapa nos permite:
1. Detectar problemas en tiempo real a través de logs detallados
2. Seguir eventos importantes a través del sistema de registro en base de datos
3. Asegurar la resiliencia mediante reconexiones y reintentos automáticos
4. Visualizar métricas de rendimiento en el dashboard de New Relic

La combinación de estos componentes ha sido esencial para garantizar la estabilidad y fiabilidad de nuestra plataforma de trading de acciones, permitiendo una rápida identificación y resolución de problemas durante el desarrollo y en producción.
