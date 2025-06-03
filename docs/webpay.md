# Documentación de integración de Webpay

## 1. Variables de entorno

Primero se debe ejecutar el siguiente comando en una terminal ubicada en `backend-2173/api`:
```bash
npm install transbank-sdk
```
Luego, modifica el archivo `.env` ubicado en `backend-2173/api` agregando la siguiente información:
```
TRANSBANK_ENVIRONMENT=integration
TRANSBANK_COMMERCE_CODE=597055555532
TRANSBANK_API_KEY=579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C
TRANSBANK_RETURN_URL=http://localhost:3000/webpay/return
TRANSBANK_FINAL_URL=http://localhost:80/payment/result
```


## 2. Archivos agregados

Se agregaron los siguientes archivos:

### Backend:

- **webpayService.js** en /api/src/services
- **webpayController.js** en /api/src/controllers
- **webpayRoutes.js** en /api/src/routes

Estos 3 archivos existen con la finalidad de manejar la lógica de webpay en el servidor.

## 3. Archivos modificados

Se modificaron los siguientes archivos

### Backend:

#### Server.js
Se modificó el endpoint `stocks/buy` para que este funcione con webpay.

Se agregó `GET /stats` al final para tratar de resolver un error con my-purchases.

### tables.sql

Se agregó la tabla de transacciones de webpay.


## Flujo de Webpay

Se va a pedir una tarjeta para comprar por webpay. Se puede usar cualquiera de las siguientes.

| Tipo             | Número de tarjeta   | Vencimiento (MM/AA)           | CVV  |
| ---------------- | ------------------- | ----------------------------- | ---- |
| VISA             | 4051 8856 0044 6623 | cualquier futuro, p.ej. 12/25 | 123  |
| MasterCard       | 5555 6666 7777 8884 | 12/25                         | 123  |
| American Express | 3782 822463 10005   | 12/25                         | 1234 |
| Débito           | 4051 8862 8041 9744 | 12/25                         | 123  |

Luego ek usuario será redirigido a una pagina en donde se pedirá rut y contraseña.
Las credenciales para la integración son:
rut: 11.111.111-1 (puede ser sin puntos o guión)
contraseña: 123


## Consideraciones adicionales

### N. Problema con stats

Al comprar una stock y realizar todo el proceso de transacción a traves de webpay, la compra se borraba una vez el usuario volvía a la app.
Como solución temporal, cree el endpoint GET /stats, pero queda pendiente para revisión más tarde.