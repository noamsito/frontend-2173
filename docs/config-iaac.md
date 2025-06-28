# Documentación IaaC - AWS CDK

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Arquitectura de la Solución](#arquitectura-de-la-solución)
3. [Prerrequisitos](#prerrequisitos)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración del Entorno](#configuración-del-entorno)
6. [Flujo de Despliegue](#flujo-de-despliegue)
7. [Recursos Creados](#recursos-creados)
8. [Comandos Útiles](#comandos-útiles)
9. [Versionado Semántico](#versionado-semántico)
10. [Troubleshooting](#troubleshooting)

## Introducción

Este documento describe la implementación de Infrastructure as Code (IaaC) usando AWS CDK (Cloud Development Kit) para el proyecto CPDP Stock Market. La solución automatiza el despliegue de la infraestructura necesaria para alojar tanto el frontend como el backend de la aplicación en AWS.

### Tecnologías Utilizadas
- **AWS CDK**: Framework para definir infraestructura en código
- **TypeScript**: Lenguaje de programación para definir la infraestructura
- **AWS Services**: S3, EC2, VPC, API Gateway, CloudFront
- **Node.js**: Runtime para ejecutar CDK


## Prerrequisitos

Antes de ejecutar el despliegue, asegúrate de tener:

1. **AWS CLI configurado** con credenciales válidas
2. **Node.js** (versión 14 o superior)
3. **AWS CDK CLI** instalado globalmente
4. **Cuenta AWS** con permisos necesarios
5. **Archivos del frontend** en la carpeta `.frontend-2173`

### Instalación de Prerrequisitos

```bash
# Instalar Node.js (si no está instalado)
# Descargar desde https://nodejs.org/

# Instalar AWS CDK CLI
npm install -g aws-cdk

# Verificar instalación
cdk --version

# Configurar AWS CLI (si no está configurado)
aws configure
```

## Estructura del Proyecto

```
proyecto/
├── bin/
│   └── cdk-project.js          # Punto de entrada del CDK
├── lib/
│   └── cdk-project-stack.ts    # Definición del stack principal
├── .frontend-2173/             # Archivos del frontend a desplegar
├── .env                        # Variables de entorno
├── package.json                # Dependencias del proyecto
├── cdk.json                    # Configuración de CDK
├── tsconfig.json              # Configuración de TypeScript
└── README.md                   # Documentación básica
```

## Configuración del Entorno

### Variables de Entorno (.env)

El archivo `.env` contiene las configuraciones necesarias:

```env
# Backend Configuration
BACKEND_KEY_NAME=backend-credenciales
BACKEND_API_ID=r12c7vfhig
BACKEND_API_ROOT_RESOURCE_ID=4c5vecj62m
BACKEND_AZ=us-east-1

# CloudFront Configuration
CLOUDFRONT_DISTRIBUTION_DOMAIN=d3esfume8qonrq.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E2HU5XW44BGH1C

# AWS Configuration
AWS_ACCOUNT_ID=131844918762
AWS_REGION=us-east-1

# Private key (mantener seguro)
BACKEND_PAIR_KEY=[clave_privada_ec2]
```

### Dependencias (package.json)

Las principales dependencias incluyen:

```json
{
  "dependencies": {
    "aws-cdk-lib": "2.201.0",
    "@aws-sdk/client-ec2": "^3.839.0",
    "dotenv": "^16.6.1",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "aws-cdk": "2.1019.2",
    "typescript": "~5.6.3",
    "ts-node": "^10.9.2"
  }
}
```

## Flujo de Despliegue

### 1. Inicialización del Proyecto

```bash
# Clonar o crear el proyecto
mkdir cdk-stock-market
cd cdk-stock-market

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### 2. Configuración de AWS CDK

```bash
# Bootstrap CDK (solo la primera vez)
cdk bootstrap aws://ACCOUNT-ID/REGION

# Ejemplo (aplicado para este proyecto):
cdk bootstrap aws://131844918762/us-east-1
```

### 3. Síntesis y Validación

```bash
# Sintetizar el template de CloudFormation
cdk synth

# Comparar cambios con el stack desplegado
cdk diff
```

### 4. Despliegue

```bash
# Desplegar el stack
cdk deploy

# Despliegue con aprobación automática
cdk deploy --require-approval never
```

### 5. Verificación Post-Despliegue

Después del despliegue exitoso, CDK mostrará los outputs:

```
Outputs:
CdkProjectStack.FrontendURL = http://frontend-stockmarket-123456789.s3-website-us-east-1.amazonaws.com
CdkProjectStack.BucketName = frontend-stockmarket-123456789
CdkProjectStack.ApiUrl = https://r12c7vfhig.execute-api.us-east-1.amazonaws.com
```

## Recursos Creados

### Stack Principal (CdkProjectStack)

El stack crea los siguientes recursos:

#### 1. S3 Bucket para Frontend
```typescript
const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
  bucketName: `frontend-stockmarket-${Date.now()}`,
  websiteIndexDocument: 'index.html',
  websiteErrorDocument: 'error.html',
  publicReadAccess: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true
});
```

**Características:**
- Nombre único generado con timestamp
- Configurado para hosting de sitios web estáticos
- Acceso de lectura público habilitado
- Política de eliminación automática para desarrollo

#### 2. Despliegue de Archivos Frontend
```typescript
new s3deploy.BucketDeployment(this, 'DeployFrontend', {
  sources: [s3deploy.Source.asset(path.join(__dirname, '../.frontend-2173'))],
  destinationBucket: frontendBucket,
  exclude: ['*.map']
});
```

**Características:**
- Despliega archivos desde `.frontend-2173/`
- Excluye archivos `.map` para optimización
- Actualización automática en cada despliegue

#### 3. Outputs del Stack
- **FrontendURL**: URL del sitio web en S3
- **BucketName**: Nombre del bucket creado
- **ApiUrl**: URL del API Gateway (hardcodeada)

### Recursos Referenciados (Versión Completa)

En la versión completa del stack, también se referencian:

#### VPC Existente
```typescript
const vpc = ec2.Vpc.fromLookup(this, 'VpcLookup', {
  vpcName: 'vpc-backend'
});
```

#### Instancia EC2
```typescript
const ec2Instance = new ec2.Instance(this, 'backend-iic2173', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
  machineImage: new ec2.AmazonLinuxImage(),
  vpc,
  keyName: process.env.BACKEND_KEY_NAME
});
```

#### API Gateway Existente
```typescript
const api = apigateway.RestApi.fromRestApiAttributes(this, 'stockmarket-backend-api', {
  restApiId: process.env.BACKEND_API_ID!,
  rootResourceId: process.env.BACKEND_API_ROOT_RESOURCE_ID!
});
```

#### CloudFront Distribution
```typescript
const cloudfrontDistribution = cloudfront.Distribution.fromDistributionAttributes(this, 'CloudFrontDistribution', {
  distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
  domainName: process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN!
});
```