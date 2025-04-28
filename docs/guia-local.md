# Guía de Ejecución Local

Esta guía te ayudará a configurar y ejecutar todo el proyecto en tu entorno local, desde la instalación hasta el uso de las funcionalidades principales.

## Requisitos Previos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- Docker y Docker Compose

## Estructura del Proyecto

El proyecto está dividido en dos componentes principales:
- `backend-2173`: API REST y cliente MQTT para la comunicación con el broker de acciones y la base de datos.
- `frontend-2173`: Interfaz de usuario

## Configuración del Backend y Frontend

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `backend-2173/api` con la siguiente información:
```
AUTH0_DOMAIN=domain-auth
AUTH0_AUDIENCE=audience
```
Ahora en la carpeta `frontend-2173` crea un archivo `.env` con la siguiente información:
```
VITE_AUTH0_DOMAIN=domain-auth
VITE_AUTH0_CLIENT_ID=client-id
VITE_API_URL=http://localhost:3000
```
Estas variables son necesarias para la autentificación, de ser requeridas, solicitarselas al grupo 1, ya que bajo ninguna circunstancia se pueden compartir públicamente.
### 2. Levantar Contenedores

Desde la raiz tanto como del frontend como del backend, ejecuta el siguiente comando para levantar los contenedores de Docker:
```bash
docker-compose down && docker-compose build --no-cache && docker-compose up
```

Con esto tendremos funcionando tanto la api del backend, la base de datos, el cliente mqtt y el frontend, todos en difrentes contenedores.

### 3. Acceder a la Aplicación

Abre tu navegador y dirígete a `http://localhost:5173` para acceder a la interfaz de usuario. La API estará disponible en `http://localhost:3000`.

### 4. Funcionalidades Principales

#### 1. Registro y Autenticación
- El sistema utiliza Auth0 para la autenticación
- Al iniciar sesión por primera vez, tu cuenta se sincronizará automáticamente

#### 2. Ver Acciones Disponibles
- En la página principal encontrarás un listado de acciones disponibles
- Puedes ver detalles como precio, nombre completo y cantidad disponible

#### 3. Comprar Acciones
- Selecciona una acción y especifica la cantidad que deseas comprar
- El sistema reservará temporalmente las acciones mientras se procesa la solicitud
- Recibirás notificaciones sobre el estado de tu compra

#### 4. Ver tu Cartera (Wallet)
- Accede a la sección "Mi Cartera" para ver tu saldo y acciones adquiridas
- Podrás ver el historial de transacciones y el valor actual de tus inversiones

#### 5. Historial de Compras
- En la sección "Compras" encontrarás el historial de todas tus solicitudes
- Cada compra muestra información como estado, cantidad, precio y fecha