# Reporte de Aseguramiento de la Calidad y Evaluación de Software

## Proyecto: Wayra Nikkei - Backend API
Este documento evidencia la aplicación de modelos y normas internacionales de calidad de software (**ISO/IEC 25010**), el detalle de las pruebas desarrolladas, las herramientas de automatización y de análisis de código implementadas, el enfoque de accesibilidad en la capa de servicios conforme a la **Ley N° 29973** (Perú) y la evaluación integral del producto.

---

## 1. Alineación con el Modelo de Calidad del Software (Norma ISO/IEC 25010)

La norma **ISO/IEC 25010** define la calidad del producto de software a través de 8 características principales. A continuación, se detalla cómo el backend de **Wayra Nikkei** evidencia y cumple con cada una de ellas:

### A. Adecuación Funcional (Functional Suitability)
*   **Completitud funcional:** La API implementa la totalidad de los módulos críticos para el restaurante: autenticación de usuarios, gestión del catálogo de productos, control físico de mesas, reservas de comensales, procesamiento de comandas/pedidos y la generación de estadísticas para el panel de administración.
*   **Corrección funcional:** La lógica de negocio expuesta en las rutas y controladores interactúa correctamente con los servicios y la base de datos relacional. Los resultados esperados se validan rigurosamente mediante aserciones automatizadas de códigos de estado HTTP e integridad de los datos de respuesta JSON.

### B. Eficiencia de Desempeño (Performance Efficiency)
*   **Comportamiento temporal:** La arquitectura implementa un **Pool de Conexiones a MySQL** ([db.js](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/config/db.js)). Esto evita la sobrecarga de abrir y cerrar conexiones TCP por cada request de la API, manteniendo los tiempos de latencia mínimos (usualmente < 100ms para consultas directas).
*   **Utilización de recursos:** Al estar desarrollado sobre **Node.js + Express**, aprovecha el bucle de eventos (*Event Loop*) asíncrono y no bloqueante para el manejo de I/O de red, permitiendo procesar cientos de peticiones simultáneas con una huella de memoria RAM reducida.

### C. Compatibilidad (Compatibility)
*   **Interoperabilidad:** El sistema funciona como una API REST estándar que intercambia datos exclusivamente mediante **JSON** (`application/json`). Esto garantiza que pueda interoperar con cualquier cliente moderno, sea la interfaz web (frontend de usuario/administrador) o futuras aplicaciones móviles en iOS y Android.
*   **Coexistencia:** Al utilizar variables de entorno y puertos de red dinámicos, el backend puede ejecutarse en el mismo entorno de alojamiento que otros servicios sin generar conflictos por el uso de puertos o configuraciones globales del sistema.

### D. Usabilidad (Usability / Accesibilidad)
*   **Operabilidad y Accesibilidad:** La usabilidad a nivel de backend se traduce en la facilidad de consumo y la consistencia en el diseño de las rutas (RESTful). Las respuestas estructuradas facilitan el renderizado accesible en el cliente.
*   **Soporte de Accesibilidad:** *Ver sección 5 para la alineación detallada con la Ley 29973.*

### E. Fiabilidad (Reliability)
*   **Madurez e Inmunidad a fallos:** Se utiliza el control estructurado de errores con bloques `try-catch` en todos los controladores y la lógica de base de datos en los servicios. Esto previene que una consulta defectuosa o un error lógico detengan abruptamente el proceso del servidor Express.
*   **Recuperabilidad:** El pool de conexiones del driver `mysql2` tiene la capacidad de reconectarse automáticamente ante caídas temporales de la base de datos MySQL alojada externamente.

### F. Seguridad (Security)
*   **Confidencialidad e Integridad:** Cuenta con un flujo estructurado de autenticación de credenciales en [authController.js](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/controllers/authController.js) y [authService.js](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/services/authService.js) que valida usuarios, actualiza estados de sesión en base de datos y mantiene un registro detallado en la tabla `historial_sesiones` para fines de auditoría.
*   **Mitigación de ataques comunes:**
    *   **Inyección SQL:** Se utilizan consultas preparadas y parametrizadas (mediante marcadores `?`) provistas por `mysql2` en todos los métodos SQL de la capa `/services`, evitando que código malicioso inyectado por usuarios modifique la base de datos.
    *   **CORS (Cross-Origin Resource Sharing):** Se implementa el middleware de `cors` para definir orígenes autorizados, evitando ataques de suplantación desde dominios maliciosos no registrados.

### G. Mantenibilidad (Maintainability)
*   **Modularidad (Arquitectura en Capas):** Se implementa una clara separación de responsabilidades:
    *   `routes/`: Define las rutas URL del backend.
    *   `controllers/`: Gestiona las peticiones HTTP y da formato a las respuestas.
    *   `services/`: Contiene la lógica de negocio pura y las transacciones de persistencia (SQL).
    *   `config/`: Inicializa la conexión del pool a la base de datos.
*   **Testabilidad:** El código está desacoplado de tal forma que se pueden inyectar mocks sobre los servicios o la base de datos para probar componentes de forma aislada.

### H. Portabilidad (Portability)
*   **Adaptabilidad:** A través del uso de variables de entorno administradas con la librería `dotenv`, la configuración del servidor, puertos y credenciales de base de datos pueden cambiarse instantáneamente al pasar de desarrollo, a staging o a producción sin modificar una sola línea de código fuente.
*   **Instalabilidad:** El backend está desarrollado bajo la especificación de módulos de JavaScript estándar (ES Modules - `"type": "module"` en [package.json](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/package.json)), facilitando su ejecución nativa en Node.js, empaquetado en contenedores Docker y despliegues automáticos en plataformas en la nube como Railway.

---

## 2. Estrategia y Tipos de Pruebas Realizadas

Se ha estructurado un plan de pruebas para evaluar diferentes perspectivas de calidad del software en el backend:

### A. Pruebas Unitarias e Integrales de API (Con Mocking)
Ubicadas en la carpeta [tests/](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/tests). Estas pruebas evalúan de forma integrada las rutas, controladores y servicios, pero aislando la base de datos física mediante técnicas de simulación (*mocking*).
*   **Cómo se realizan:** Se utiliza `jest.spyOn(db, 'query')` para definir valores simulados de retorno que la base de datos entregaría en un flujo real. Por ejemplo, en [auth.test.js](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/tests/auth.test.js):
    *   Se mockea la consulta de búsqueda de usuario exitosa, la actualización de sesión y la inserción del historial.
    *   Se utiliza **Supertest** para enviar una petición HTTP `POST /api/login` virtual.
    *   Se verifica que la lógica responda con HTTP `200`, `success: true` y retorne la estructura JSON del usuario correcta.
*   **Efectividad:** Aísla el servidor de la disponibilidad de la base de datos externa, permitiendo ejecutar las pruebas en milisegundos en entornos locales o de CI/CD.

### B. Pruebas Funcionales (Criterios de Aceptación)
Validan que las reglas de negocio declaradas por el cliente se ejecuten correctamente:
*   **Validación de Credenciales:** Probar que el envío de una contraseña incorrecta devuelva código `401 Unauthorized` con un mensaje estructurado.
*   **Validación de Entradas (Filtro Sanitizador):** Probar que si no se envían los datos obligatorios en el cuerpo de la petición (por ejemplo, falta la contraseña en el login), la API responda inmediatamente con HTTP `400 Bad Request` y el mensaje "Faltan credenciales", evitando procesar código innecesario.
*   **Gestión del Estado de Negocio:** Evaluar que el cierre de sesión cambie correctamente el estado del usuario en el sistema.

### C. Pruebas No Funcionales
*   **Seguridad Estática (SAST):** Análisis del código fuente mediante patrones de seguridad predefinidos para evitar el uso de funciones vulnerables, fugas de información en consola y control de dependencias.
*   **Eficiencia en Transacciones (ACID):** Validación en la capa de servicios para que las consultas de inserción complejas (por ejemplo, en el módulo de pedidos) utilicen la estructura correcta para salvaguardar la integridad relacional de la información frente a escrituras concurrentes.

---

## 3. Herramientas de Automatización Implementadas

La automatización de procesos disminuye el error humano y garantiza la consistencia de las pruebas a lo largo del ciclo de vida del software:

| Herramienta | Tipo | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **Jest** | Framework de Testing | Test runner principal. Ejecuta las suites de pruebas, maneja el ciclo de vida de los mocks (`afterEach`, `afterAll`) y proporciona el motor de aserciones (`expect`). |
| **Supertest** | Framework de Pruebas HTTP | Simula peticiones HTTP a la aplicación Express montada en memoria sin necesidad de abrir puertos de red reales durante el testeo, reduciendo drásticamente el tiempo de ejecución. |
| **cross-env** | Scripting Multiplataforma | Permite declarar variables de entorno (como `NODE_ENV=test`) de forma compatible tanto en entornos Windows, macOS o Linux al ejecutar los scripts de npm. |
| **Nodemon** | Automatización de Desarrollo | Monitorea los cambios en el código de Express y reinicia el servidor automáticamente en el entorno de desarrollo local. |

---

## 4. Herramientas de Evaluación de Calidad

### A. SonarCloud / SonarQube
El backend cuenta con la configuración de análisis automatizado de calidad a través del archivo [sonar-project.properties](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/sonar-project.properties):
*   **Sonar Organization/Project Key:** Vincula el análisis con la plataforma en la nube para reportes interactivos de calidad.
*   **sonar.sources:** Configura los directorios evaluados (`controllers`, `services`, `routes`, `config`, `index.js`), excluyendo del análisis el código de prueba (`tests/`) para evitar distorsiones en las métricas de complejidad.
*   **Calidad de Código Evaluada:**
    *   **Bugs:** Detección de errores lógicos o de sintaxis potencial que puedan derivar en fallos de ejecución.
    *   **Vulnerabilities & Security Hotspots:** Alertas sobre malas prácticas en el código que comprometan la seguridad.
    *   **Code Smells:** Detección de código redundante, variables no utilizadas, funciones excesivamente largas o de alta complejidad ciclomática.
    *   **Duplicidad:** Porcentaje de líneas de código duplicadas que deban ser refactorizadas.

### B. Cobertura de Pruebas (Test Coverage)
La suite de pruebas de Jest está parametrizada con la bandera `--coverage` en el comando `npm run test`.
*   **Salida de Cobertura:** Al ejecutar las pruebas, genera reportes detallados en consola y crea la carpeta `coverage/` que contiene archivos de mapeo LCOV (`lcov.info`).
*   **Vinculación con Sonar:** Configurado mediante `sonar.javascript.lcov.reportPaths=coverage/lcov.info`, lo que permite exportar automáticamente la cobertura exacta obtenida de los tests directamente a SonarCloud para validar el *Quality Gate* del proyecto.

---

## 5. Evaluación de Accesibilidad y Cumplimiento de la Ley N° 29973 (Perú)

La **Ley N° 29973 (Ley General de la Persona con Discapacidad en el Perú)** y su reglamento establecen que los servicios digitales públicos y privados de acceso masivo deben cumplir con estándares de accesibilidad digital de acuerdo con la Norma Técnica Peruana (NTP) de accesibilidad web, la cual toma como base las pautas **WCAG 2.1 (Web Content Accessibility Guidelines)** en su nivel de conformidad AA.

### El Rol del Backend en la Accesibilidad
Aunque el frontend es la capa que renderiza los elementos visuales, el backend juega un rol crítico e indispensable para posibilitar el cumplimiento de la accesibilidad digital:

1.  **Respuestas de Error Semánticas y Comprensibles:**
    *   Los lectores de pantalla y tecnologías de asistencia de personas con discapacidad visual leen el texto proporcionado por la interfaz. Si la API falla y devuelve un error de código crudo de base de datos o un stack trace técnico, la interfaz se vuelve confusa o inaccesible.
    *   **Solución implementada:** El backend de Wayra captura excepciones y devuelve un formato JSON consistente con mensajes de error descriptivos y amigables orientados al usuario final, por ejemplo:
        ```json
        {
          "success": false,
          "message": "Usuario o clave incorrecta"
        }
        ```
    *   Esto permite al frontend mapear el mensaje directamente en un contenedor con el atributo ARIA adecuado (`aria-live="assertive"`), logrando que el lector de pantalla enuncie inmediatamente el error con claridad.

2.  **Paginación y Limitación de Datos (Filtros):**
    *   Cargar listas masivas de información (como el historial completo de comandas o de productos) puede causar congelamiento en dispositivos de tecnologías de asistencia que requieren mayor procesamiento, desorientando a personas con discapacidades cognitivas o motoras.
    *   **Solución implementada:** La capa de servicios define consultas con límites de registros y filtros específicos. Esto reduce la transferencia de datos y garantiza que el cliente frontend cargue pantallas ligeras, optimizando el rendimiento y evitando bloqueos de los programas de asistencia.

3.  **Códigos de Estado HTTP Correctos y Semánticos:**
    *   Las herramientas de accesibilidad y las aplicaciones cliente utilizan los encabezados HTTP para deducir el flujo del sistema.
    *   **Solución implementada:** Se utilizan códigos semánticos estándar:
        *   `200 OK` para consultas/acciones correctas.
        *   `400 Bad Request` para errores de validación de datos del usuario.
        *   `401 Unauthorized` para fallos de login.
        *   `500 Internal Server Error` para fallos internos del servidor.
    *   Esta estructura semántica permite a las tecnologías de asistencia reaccionar adecuadamente ante redirecciones o fallas críticas del sistema.

4.  **Desempeño y Tolerancia a la Latencia:**
    *   Los usuarios con discapacidades motoras que dependen de conmutadores o software de dictado por voz tardan más tiempo en completar flujos transaccionales. Si el servidor es lento o tiene límites de tiempo (*timeouts*) extremadamente cortos en las sesiones sin retroalimentación, el usuario no podrá finalizar su acción.
    *   El uso de consultas optimizadas en los servicios de Wayra disminuye los cuellos de botella, garantizando que el canal de comunicación sea rápido y responda de forma fluida a las peticiones largas.

---

## 6. Evaluación Integral del Producto de Software (Conclusiones)

La evaluación integral del backend de **Wayra Nikkei** bajo las pautas de aseguramiento de la calidad de software concluye que el producto posee un alto nivel de madurez técnica por las siguientes razones:

1.  **Arquitectura Sólida y Mantenible:** La división estructural bajo MVC orientada a servicios permite un desarrollo aislado y testable, facilitando futuras ampliaciones de lógica de negocio del restaurante sin alterar la estabilidad de las funcionalidades base ya probadas.
2.  **Robustez Funcional Automatizada:** El suite de pruebas implementado bajo Jest + Supertest provee una red de seguridad contra regresiones. Las simulaciones de base de datos (`mocks`) optimizan la velocidad de las pruebas y permiten aislar los errores lógicos de los problemas de infraestructura física de la base de datos.
3.  **Calidad Estática Vinculada:** La integración con SonarCloud mediante [sonar-project.properties](file:///d:/Calidad%20Pruebas%20y%20software/Wayra_Web_Backend/sonar-project.properties) automatiza el control de calidad, asegurando que cada integración de código sea evaluada bajo criterios estrictos de seguridad (SAST), duplicidad y legibilidad.
4.  **Alineación Legal y Social:** El diseño de la API REST apoya activamente al cumplimiento de la **Ley N° 29973** a través del suministro de datos limpios, mensajes semánticos de error para lectores de pantalla, y endpoints eficientes y paginados que protegen el procesamiento de los terminales de tecnologías asistivas.
