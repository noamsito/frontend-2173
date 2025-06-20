# StockMarketU - Frontend

## Descripción
Frontend para la aplicación StockMarketU, una plataforma de simulación de mercado de acciones que permite ver, comprar y gestionar acciones en tiempo real con estimaciones predictivas.

## Tecnologías
- React 18
- Vite
- Auth0 (autenticación)
- React Router DOM
- Axios para API calls
- CSS personalizado

## Documentación en la carpeta `docs`

## URL de la aplicación

- [https://antonioescobar.lat](https://antonioescobar.lat)

## Funcionalidades Implementadas

### 🔐 Sistema de Autenticación
- Login/Logout con Auth0
- Perfil de usuario
- Protección de rutas

### 📊 Gestión de Stocks
- **Listado de stocks disponibles** con información en tiempo real
- **Búsqueda y filtrado** de acciones por símbolo
- **Compra de acciones** con validación de cantidad y precio
- **Paginación** para navegar entre stocks

### 💼 Sistema de Compras (RF02 - Algoritmo de Estimación Lineal)
- **Vista de "Mis Compras"** con estadísticas del portafolio:
  - Total invertido
  - Valor actual del portafolio
  - Ganancia/pérdida total
  - Número de compras realizadas
- **Filtros avanzados**:
  - Búsqueda por símbolo
  - Ordenamiento por fecha, símbolo, valor, rendimiento
  - Filtros por rentabilidad (todas, ganancias, pérdidas)
- **Vista detallada de cada compra** con:
  - Información original de la compra
  - Rendimiento actual vs precio de compra
  - **Estimación lineal a futuro** (30 días)
  - Indicadores visuales de ganancia/pérdida

### 🔮 Algoritmo de Estimación Lineal
- **Cálculo de métricas actuales**:
  - Ganancia/pérdida en dólares y porcentaje
  - Valor actual vs inversión inicial
- **Proyección lineal**:
  - Precio estimado a 30 días
  - Valor total estimado del portafolio
  - Nivel de confianza (LOW/MEDIUM/HIGH)
- **Disclaimers de responsabilidad** para decisiones de inversión

### 💰 Gestión de Billetera
- Visualización del saldo actual
- Historial de transacciones

### 📋 Registro de Eventos
- Log de actividades del sistema
- Seguimiento de operaciones realizadas

## Estructura de Componentes

```
src/
├── components/
│   ├── AuthComponents.jsx     # Login, Logout, Profile
│   └── Navigation.jsx         # Barra de navegación
├── pages/
│   ├── MyPurchases.jsx        # Vista listado de compras
│   ├── PurchaseDetail.jsx     # Vista detalle con estimación
│   ├── StockDetail.jsx        # Detalle de stock individual
│   ├── Wallet.jsx             # Gestión de billetera
│   └── EventLog.jsx           # Registro de eventos
├── api/
│   └── purchases.js           # API calls para compras
├── styles/
│   └── purchases.css          # Estilos para compras
└── testStocks.js             # Lista principal de stocks
```

## Rutas Implementadas

- `/` → Redirección a `/stocks`
- `/stocks` → Listado principal de stocks
- `/stocks/:symbol` → Detalle de stock específico
- `/my-purchases` → Vista de compras del usuario
- `/purchases/:id` → Estimación detallada de compra
- `/wallet` → Gestión de billetera
- `/event-log` → Registro de eventos

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Ejecutar con Docker
docker-compose up --build
```

## Variables de Entorno

```env
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
VITE_API_URL=http://localhost:3000
```

## Documentación en la carpeta `docs`

## URL de la aplicación

- [https://antonioescobar.lat](https://antonioescobar.lat)

## Características Técnicas

### Responsabilidad de Componentes
- **MyPurchases**: Gestión completa del portafolio con filtros y estadísticas
- **PurchaseDetail**: Estimación predictiva con algoritmo lineal
- **AuthComponents**: Manejo seguro de autenticación
- **API Layer**: Comunicación eficiente con backend

### Algoritmo de Estimación Implementado
El sistema utiliza un modelo de **regresión lineal simple** que:

1. **Calcula el rendimiento actual**: `(valor_actual - inversión_inicial) / inversión_inicial * 100`
2. **Proyecta la tendencia**: `precio_estimado = precio_actual * (1 + tasa_cambio * 0.5)`
3. **Estima valor futuro**: `valor_estimado = cantidad * precio_estimado`
4. **Asigna confianza**: Basado en volatilidad y tiempo transcurrido

### Manejo de Estados
- **Loading states** para todas las operaciones asíncronas
- **Error handling** con mensajes user-friendly
- **Optimistic updates** para mejor UX
- **Cache local** de datos frecuentemente accedidos

## Testing

```bash
# Ejecutar tests
npm test

# Coverage
npm run test:coverage
```

## 🚀 Nuevas Funcionalidades E3

### 🏛️ Sistema de Subastas (RF04)
- **Crear subastas**: Los usuarios autenticados pueden crear nuevas subastas de acciones
- **Hacer ofertas**: Participar en subastas activas con ofertas competitivas
- **Cerrar subastas**: Finalizar subastas y determinar ganadores
- **Vista en tiempo real**: Actualización automática cada 30 segundos

### 🔄 Sistema de Intercambios (RF05)
- **Proponer intercambios**: Ofrecer acciones propias a cambio de otras
- **Gestionar propuestas**: Aceptar o rechazar intercambios pendientes
- **Historial completo**: Ver todos los intercambios pasados
- **Comunicación entre grupos**: Intercambiar con otros grupos del curso

## 📱 Páginas Disponibles

1. **Acciones** (`/stocks`): Lista de todas las acciones disponibles
2. **Mis Compras** (`/my-purchases`): Historial de compras del usuario
3. **Billetera** (`/wallet`): Gestión del saldo y transacciones
4. **Registro de Eventos** (`/event-log`): Log de eventos del sistema
5. **🏛️ Subastas** (`/auctions`): Sistema completo de subastas
6. **🔄 Intercambios** (`/exchanges`): Propuestas y gestión de intercambios

## 🛠️ Instalación

```bash
npm install
npm run dev
```

## 🔧 Variables de Entorno

Crear archivo `.env` con:
```
VITE_API_URL=http://localhost:3000
VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id
VITE_AUTH0_AUDIENCE=tu-audience
```

## 🎨 Tecnologías Utilizadas

- React + Vite
- React Router
- Auth0 para autenticación
- CSS moderno con diseño responsive
- Fetch API para comunicación con backend

## 📡 Integración MQTT

El sistema se comunica automáticamente con otros grupos a través del broker MQTT:
- **RNF04**: Recibe subastas e intercambios de otros grupos
- **RNF05**: Publica automáticamente las acciones locales

## 👥 Funcionalidades por Rol

### Usuarios Autenticados
- ✅ Ver todas las subastas activas
- ✅ Hacer ofertas en subastas
- ✅ Crear nuevas subastas
- ✅ Proponer intercambios
- ✅ Gestionar intercambios pendientes

### Notas
- Las validaciones de permisos se manejan en el backend
- La interfaz muestra los botones a todos los usuarios autenticados
- El backend determinará si el usuario tiene permisos para cada acción