# 📊 Reporte Integral de Pruebas Unitarias y de Integración (Backend)

Este documento detalla todas las pruebas automatizadas (Tests) implementadas en el backend de Wayra Nikkei. Es ideal para exponer y sustentar la calidad y robustez del sistema.

## Resumen Ejecutivo
El sistema cuenta con una batería de **78 pruebas automatizadas** que cubren el ciclo de vida completo de cada módulo. Las pruebas verifican tanto el **Flujo Feliz** (Happy Path) como los **Escenarios de Falla** (Manejo de errores 400, 401, 403, 404 y 500).

Se ha alcanzado una cobertura de código (Code Coverage) general superior al **93%**, garantizando que las reglas del negocio funcionan correctamente, incluso ante caídas simuladas de la base de datos.

---

## 🔐 1. Módulo de Autenticación (`auth.test.js`)
* **`POST /api/login`**
  * ✅ Debería iniciar sesión correctamente (Status 200) y devolver datos del usuario.
  * ✅ Debería rechazar login con credenciales incorrectas (Status 401).
  * ✅ Debería rechazar la petición si faltan datos (Status 400).
  * ✅ Debería manejar error interno de la Base de Datos (Status 500).
* **`POST /api/logout`**
  * ✅ Debería cerrar sesión correctamente (Status 200).
  * ✅ Debería dar error si no se envía el ID (Status 400).
  * ✅ Debería manejar error interno de la Base de Datos (Status 500).

---

## 🍽️ 2. Módulo de Mesas (`mesa.test.js`)
* **`GET /api/mesas`**
  * ✅ Debería obtener todas las mesas disponibles y ocupadas (Status 200).
  * ✅ Debería retornar 500 si la base de datos falla al listar.
* **`PUT /api/mesas/:id/liberar`**
  * ✅ Debería liberar una mesa correctamente (Status 200).
  * ✅ Debería lanzar error 500 si la mesa no existe (Status 500).
* **`POST /api/mesas/asignar`**
  * ✅ Debería asignar un mozo a una mesa exitosamente (Status 200).
  * ✅ **[Regla de Negocio]** Debería rechazar si el mozo excede el límite de 4 mesas asignadas (Status 403).
  * ✅ Debería retornar 400 si faltan datos en el body.
  * ✅ Debería retornar 500 si hay error interno de base de datos en la asignación.

---

## 🧾 3. Módulo de Pedidos (`pedido.test.js`)
Este es el módulo más complejo, evaluado con pruebas **Transaccionales** (Rollback / Commit).

* **`GET /api/pedidos/hoy`**
  * ✅ Debería retornar la lista de pedidos del día (Status 200).
  * ✅ Debería devolver un array vacío y manejar el error de BD (Status 500).
* **`POST /api/pedidos`**
  * ✅ Debería crear un pedido exitosamente ejecutando el COMMIT en base de datos.
  * ✅ **[Regla de Negocio]** Debería bloquear la creación y hacer ROLLBACK si el mozo excede las 4 mesas (Status 403).
  * ✅ Debería rechazar un pedido sin items (Status 400).
  * ✅ Debería hacer ROLLBACK si hay error interno al crear (Status 500).
* **`PUT /api/pedidos/:id/checkout`**
  * ✅ Debería procesar el pago correctamente y liberar la mesa vinculada (Status 200).
  * ✅ Debería retornar 500 y hacer ROLLBACK si falla el checkout.
* **Rutas Secundarias (Items y Comprobantes)**
  * ✅ Debería agregar, eliminar items y actualizar observaciones.
  * ✅ Debería generar la data de la Boleta correctamente.
  * ✅ Debería devolver 404 si el comprobante no existe.
  * ✅ Deberían manejar correctamente errores de base de datos devolviendo Status 500.

---

## 📅 4. Módulo de Reservas (`reserva.test.js`)
También probado mediante transacciones para evitar cruces de información.

* **`GET /api/reservas`**
  * ✅ Debería obtener las reservas por fecha.
* **`POST /api/reservas (Transaccional)`**
  * ✅ Debería crear la reserva, actualizar la mesa y hacer COMMIT (Status 200).
  * ✅ Debería hacer ROLLBACK si falla la actualización paralela de la mesa (Status 500).
* **Gestión (Check-In y Anulación)**
  * ✅ Debería confirmar la reserva (Check-In) y auditar en base de datos.
  * ✅ Debería anular la reserva correctamente.
* **Consultas Estadísticas**
  * ✅ `/ocupadas` Debería retornar las horas reservadas.
  * ✅ `/conteo-mensual` Debería retornar agrupaciones por mes.
  * ✅ `/hoy` Debería retornar las reservas filtradas para un mozo.
  * ✅ Todos los endpoints manejan errores internos de base de datos (Status 500).

---

## 👥 5. Módulo de Usuarios/Staff (`usuario.test.js`)
* **`GET /api/admin/usuarios`**
  * ✅ Debería devolver la lista de staff cruzando información de sus métricas (Mesas asignadas, Check-ins diarios).
* **`GET /api/asignar-mozo`**
  * ✅ Debería devolver un mozo libre (Status 200).
  * ✅ Debería avisar correctamente mediante JSON si no hay mozos disponibles.
* **`POST, PUT, DELETE /api/admin/usuarios`**
  * ✅ Debería crear un usuario nuevo.
  * ✅ Debería actualizar un usuario con cambio de contraseña.
  * ✅ Debería eliminar un usuario del sistema.
  * ✅ Validaciones de fallos (400, 500) ante caídas de la base de datos o datos corruptos.

---

## ⚙️ 6. Inicialización del Servidor (`index.test.js`)
* ✅ Verifica que el servidor (puerto y escucha activa) arranque correctamente en ambientes de Producción/Desarrollo (cuando `NODE_ENV` no es `test`), garantizando que la aplicación nunca se quede colgada y libere la conexión (Open Handles).

---
*Reporte generado automáticamente para la sustentación del proyecto.*
