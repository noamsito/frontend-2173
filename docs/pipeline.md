# Documentación del Pipeline CI/CD del Backend

Este flujo de trabajo automatiza las pruebas, la construcción y el despliegue de los servicios backend (API y cliente MQTT) a la infraestructura de AWS. A continuación se tiene una explicación detallada de cada sección:

## Disparadores del Flujo de Trabajos

El flujo de trabajo se ejecuta cuando:
- Hay un push a las ramas `main` o `production`
- Se realizan cambios en la API, el cliente MQTT, la base de datos o el propio archivo del flujo de trabajo
- Para pull requests, solo se ejecuta para aquellas dirigidas a la rama `main`

```yaml
on:
  push:
    branches: [ main, production ]
    paths:
      - 'api/**'
      - 'mqtt-client/**'
      - 'db/**'
      - '.github/workflows/backend-api-cicd.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'api/**'
      - 'mqtt-client/**'
```

## Variables de entorno

Se deben tener las siguientes credenciales:
```yaml
env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: public.ecr.aws/your-alias  # cambiar por tu alias
```

## Trabajo 1: Integración continua

Este trabajo verifica la calidad del código y realiza pruebas antes de proceder a los pasos de despliegue.

```yaml
ci:
  name: 🧪 Backend API CI
  runs-on: ubuntu-latest
```
**Pasos:**
1. Checkout del Código: Descarga el código del repositorio al ejecutor de GitHub.
2. Configuración de Node.js: Configura Node.js v18 con caché de npm para la API y el cliente MQTT.
3. Instalación de Dependencias: Ejecuta `npm ci` para ambos servicios para instalar versiones exactas desde package-lock.json.
4. Lint del Código: Ejecuta linting para la API (se omite si no está configurado).
5. Ejecución de Pruebas: Ejecuta pruebas para la API en un entorno de test (se omite si no está configurado)

## Trabajo 2: Construcción y publicación de imágenes Docker

Este trabajo se ejecuta:
- Solo despues de que el trabajo de CI tenga exito.
- Solo en las ramas `main` o `production` (no para pull requests).
- Utiliza una estrategia de matriz para construir los servicios de API y cliente MQTT en paralelo.

```yaml
build-backend:
  name: 🐳 Build Backend Images
  runs-on: ubuntu-latest
  needs: ci
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/production'
```
**Pasos:**
1. Checkout del Código: Descarga el código del repositorio.
2. Configuración de Credenciales AWS: Configura la autenticación de AWS usando secretos del repositorio.
3. Configuración de Docker Buildx: Configura el sistema de construcción de Docker para builds multiplataforma.
4. Inicio de Sesión en ECR: Autentica con el Registro de Contenedores Elásticos de Amazon.
5. Generación de Metadatos de Imagen: Crea etiquetas de imagen Docker basadas en el nombre de la rama y el SHA del commit.
6. Construcción y Publicación: Construye imágenes Docker para cada servicio y las publica en ECR con las etiquetas apropiadas.

## Trabajo 3: Despliegue en EC2

Este trabajo se ejecuta:
- Despues de que las imágenes Docker se hayan construido y publicado con éxito.
- Solo se ejecuta para las ramas `main` o `production`.
- Utiliza AWS CodeDeploy para desplegar en instancias EC2.

```yaml
deploy-backend:
  name: 🚀 Deploy to Backend EC2
  runs-on: ubuntu-latest
  needs: build-backend
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/production'
```
**Pasos:**
1. Checkout del Código: Obtiene el código del repositorio.
2. Configuración de Credenciales AWS: Configura la autenticación de AWS.
3. Crear/Actualizar Aplicación de CodeDeploy:
  - Crea una aplicación de CodeDeploy si no existe.
  - Crea un grupo de despliegue dirigido a instancias EC2 con etiquetas específicas.
4. Preparación del Paquete de Despliegue:
  - Crea un archivo `appspec.yml` para CodeDeploy.
  - Crea scripts de despliegue:
    - `stop_backend.sh`: Detiene los contenedores existentes.
    - `start_backend.sh`: Crea un archivo docker-compose e inicia todos los servicios.
    - `validate_backend.sh`: Verifica el éxito del despliegue.
5. Carga del Paquete a S3: Crea un bucket S3 y carga el paquete de despliegue.
6. Despliegue con CodeDeploy:
  - Inicia el despliegue en instancias EC2.
  - Espera a que el despliegue se complete.

## Trabajo 4: Notificación

Este trabajo se ejecuta:
- Después de todos los demás trabajos, independientemente de su resultado.
- Proporciona notificaciones del estado del despliegue.
- Actualmente envía salidas a los registros del flujo de trabajo.

```yaml
notify-backend:
  name: 📢 Notify Backend Deployment
  runs-on: ubuntu-latest
  needs: [ci, build-backend, deploy-backend]
  if: always()
```
## Arquitectura desplegada

Este pipeline despliega una pila completa del backend con cuatro componentes principales:
1. Servicio API: Tu aplicación principal de API Node.js.
2. Cliente MQTT: Un servicio que se conecta a MQTT y transmite datos a la API.
3. PostgreSQL: Base de datos para almacenar datos del mercado de valores.
4. RabbitMQ: Broker de mensajes para comunicación asíncrona.

Todos los servicios están contenedorizados usando Docker y se despliegan juntos mediante docker-compose.

## Flujo de despliegue 

1. Los cambios de código activan el flujo de trabajo
2. Las pruebas verifican la calidad del código
3. Las imágenes Docker se construyen y publican en ECR
4. AWS CodeDeploy despliega en instancias EC2 etiquetadas
5. Los scripts de despliegue gestionan el ciclo de vida de los contenedores
6. Las comprobaciones de validación confirman el éxito del despliegue