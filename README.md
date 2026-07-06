# 🥢 Wayra Nikkei - Backend API
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white) ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white) ![SonarQube](https://img.shields.io/badge/SonarQube-black?style=for-the-badge&logo=sonarqube&logoColor=4E9BCD) ![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)

API RESTful desarrollada para la gestión integral del restaurante Wayra Nikkei. Este sistema maneja la disponibilidad de mesas, control de reservas, procesamiento de comandas transaccionales y panel de métricas para el staff. Se caracteriza por su alta robustez y calidad de software asegurada.

## 🚀 Tecnologías Utilizadas

* **Entorno:** Node.js
* **Framework:** Express.js
* **Base de Datos:** MySQL (Desplegada en Railway)
* **Arquitectura:** Modelo-Vista-Controlador (MVC) Orientada a Servicios
* **Pruebas Automatizadas:** Jest & Supertest
* **Análisis de Código:** SonarCloud / SonarQube

## 🛡️ Calidad de Software y Pruebas

Este proyecto ha pasado por un riguroso proceso de aseguramiento de calidad (QA), garantizando la máxima confiabilidad para entornos de producción:

* **Pruebas Unitarias y de Integración:** Cuenta con una batería de **78 tests automatizados** que cubren flujos exitosos, reglas de negocio y manejo de errores (400, 401, 403, 404, 500).
* **Cobertura de Código (Code Coverage):** Mantenemos una cobertura general del **93.7%**, asegurando que todos los controladores y servicios principales estén validados, incluso simulando fallos críticos de base de datos (Rollbacks).
* **Análisis Estático (SAST):** El código es evaluado constantemente mediante **SonarQube Scanner**, asegurando que se cumplen estrictos estándares de código, nula duplicidad de código y detección temprana de vulnerabilidades de seguridad.
* **Pruebas de Estrés y Rendimiento:** Se integró **Artillery** para simulaciones de carga (Ramp-up), demostrando que la arquitectura actual soporta de forma estable transacciones concurrentes con tiempos de respuesta óptimos. El límite tolerante del servidor se ubica alrededor de las **25 a 30 peticiones por segundo** antes de presentar degradación (cuello de botella) o denegación de servicio para protección de la base de datos.

## 🏗️ Estructura del Proyecto (Arquitectura en Capas)

El código está estructurado para garantizar escalabilidad y separación de responsabilidades:

* **`/config`**: Conexión asíncrona a la base de datos (Pool de MySQL).
* **`/routes`**: Definición de endpoints de la API.
* **`/controllers`**: Manejo de peticiones HTTP (Req/Res).
* **`/services`**: Lógica de negocio pura y consultas SQL parametrizadas (ACID, control de Transacciones).
* **`/tests`**: Batería de pruebas automatizadas aisladas.

## ⚙️ Instalación y Configuración Local

1. Clona este repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/Wayra_Web_Backend.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz del proyecto y agrega tu URL de conexión:
   ```env
   DATABASE_URL="mysql://usuario:password@host:puerto/database"
   PORT=3000
   ```
4. Para ejecutar las pruebas (y generar el reporte de cobertura `test-report.html`):
   ```bash
   npm run test
   ```
5. Inicia el servidor:
   ```bash
   npm start
   ```
