# Guía de Ejecución Local - Frontend IIC2173

---

## Requisitos previos

Antes de comenzar, se debe tener instalado lo siguiente en la máquina local:

- [Node.js (versión recomendada LTS ≥ 18.x)](https://nodejs.org/)
- npm (viene con Node.js)
- Git

---

## Instalación del proyecto

1. Clona este repositorio:

```bash
git clone https://github.com/noamsito/frontend-2173.git
cd frontend-2173
```
2. Instala las dependencias:
```bash
npm install
```

## Variables de entorno

Si se necesita una URL base para el backend, crea un archivo .env en la raíz del proyecto con el siguiente contenido:
```bash
VITE_API_URL = https://noamsito.lat
```

## Ejecución local

Para levantar el entorno de desarrollo, se ejecuta:
```bash
npm run dev
```
Esto abrirá una aplicación en
```bash
http://localhost:5173
```

## Estructura del proyecto

```bash
frontend-2173/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
├── .env              # Si aplica
├── vite.config.js
├── package.json
└── README.md
```

## Consideraciones adicionales

- El proyecto está construido usando Vite + React.
- El frontend es una Single Page Application (SPA) que se comunica con un backend vía API REST.
- El build generado por npm run build será usado para el despliegue en S3 + CloudFront.