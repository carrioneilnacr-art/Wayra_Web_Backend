# 🥢 Wayra Nikkei - Backend API

API RESTful desarrollada para la gestión integral del restaurante Wayra Nikkei. Este sistema maneja la disponibilidad de mesas, control de reservas, procesamiento de comandas transaccionales y panel de métricas para el staff.

## 🚀 Tecnologías Utilizadas

* **Entorno:** Node.js
* **Framework:** Express.js
* **Base de Datos:** MySQL (Desplegada en Railway)
* **Arquitectura:** Modelo-Vista-Controlador (MVC) Orientada a Servicios

## 🏗️ Estructura del Proyecto (Arquitectura en Capas)

El código está estructurado para garantizar escalabilidad y separación de responsabilidades:

* **`/config`**: Conexión asíncrona a la base de datos (Pool de MySQL).
* **`/routes`**: Definición de endpoints de la API.
* **`/controllers`**: Manejo de peticiones HTTP (Req/Res).
* **`/services`**: Lógica de negocio pura y consultas SQL parametrizadas (ACID).

## ⚙️ Instalación y Configuración Local

1. Clona este repositorio:
   \`\`\`bash
   git clone https://github.com/TU-USUARIO/Wayra_Web_Backend.git
   \`\`\`
2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`
3. Crea un archivo \`.env\` en la raíz del proyecto y agrega tu URL de conexión:
   \`\`\`env
   DATABASE_URL="mysql://usuario:password@host:puerto/database"
   PORT=3000
   \`\`\`
4. Inicia el servidor:
   \`\`\`bash
   npm start
   \`\`\`
