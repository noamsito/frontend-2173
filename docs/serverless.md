# Guía para desplegar aplicación Serverless de boletas PDF

## Requisitos previos

1. Node.js (versión 18.x o posterior)
2. Cuenta de AWS
3. AWS CLI instalado y configurado
4. Credenciales de AWS configuradas

## Configurar AWS CLI y credenciales.

Antes de desplegar, se deben tener las siguientes credenciales de AWS:
```bash
INSERTAR CREDENCIALES
```

## Instalar dependencias
Ubicado en el directorio `boletas-serverless` ejecuta:
```bash
npm install
```

## Verificar la configuración

Revisar que el archivo `serverless.yml` tenga las siguientes configuraciones:

- service: boletas-pdf-grupo1
- provider - name: aws
- provider - runtime: nodejs18.x
- provider - region: us-east-1
- custom - bucketName: boletas-grupo-1-${stage}

## Desplegar aplicación

Para desplegar la aplicación, ejecuta:
```bash
npm run deploy
```

## Verificar despliegue

Una vez desplegado, se debiese ver una salida similar a:

```console
Service Information
service: boletas-pdf-grupo1
stage: dev
region: us-east-1
stack: boletas-pdf-grupo1-dev
resources: 13
api keys:
  None
endpoints:
  POST - https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/generate-boleta
  GET - https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/boleta/{boletaId}
  GET - https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/health
functions:
  generateBoleta: boletas-pdf-grupo1-dev-generateBoleta
  getBoletaStatus: boletas-pdf-grupo1-dev-getBoletaStatus
  healthCheck: boletas-pdf-grupo1-dev-healthCheck
```
Guarda los endpoints para utilizarlos más adelante.

## Probar aplicación

### 1. Verificar el estado del servicio

Se puede comprobar si el servicio está funcionando haciendo una petición GET al endpoint de salud:

```bash
curl https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/health
```

Se debería recibir una respuesta con status "healthy".

### 2. Generar una boleta PDF

Para generar una boleta, envía una petición POST al endpoint de generación con los datos requeridos:

```bash
curl -X POST \
  https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/generate-boleta \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "12345",
    "userName": "Usuario Ejemplo",
    "userEmail": "usuario@ejemplo.com",
    "purchaseId": "P98765",
    "stockSymbol": "AAPL",
    "quantity": 10,
    "pricePerShare": 150.50,
    "totalAmount": 1505.00
  }'
```

### 3. Verificar el estado de una boleta

Una vez generada una boleta, se puede verificar su estado con una petición GET:

```bash
curl https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/boleta/{boletaId}
```
Se debe reemplazar {boletaId} con el Id recibido en la respuesta del paso anterior.

##  Monitoreo de Logs

Para monitorear los logs de la función principal de generación de boletas:

```bash
npm run logs
```

O con un comando más especifico:
```bash
serverless logs -f generateBoleta -t
```

## Arquitectura del servicio

Este servicio serverless consta de:

1. Funciones Lambda:

    - `generateBoleta`: Genera boletas PDF para compras de acciones
    - `getBoletaStatus`: Obtiene el estado y URL de descarga de una boleta
    - `healthCheck`: Endpoint de salud para monitoreo
2. Recursos AWS:

    - Bucket S3 (`boletas-grupo1-{stage}`): Para almacenar las boletas PDF
    - Políticas IAM para acceso al bucket
    - CloudWatch LogGroup para logs
3. API Gateway:

    - Endpoints HTTP para interactuar con las funciones Lambda
    - Configuración CORS para permitir acceso desde diferentes orígenes

## Consideraciones adicionales

- El bucket S3 se configura con acceso público para la lectura de boletas
- La aplicación utiliza PDFKit para generar los archivos PDF
- Cada boleta recibe un ID único generado con UUID
- Los archivos se almacenan en la ruta `boletas/{boletaId}.pdf` dentro del bucket S3