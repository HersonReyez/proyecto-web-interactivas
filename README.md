# Anime Store

Tienda de anime con frontend en React y una API en Laravel 12. Las vistas están en `react-frontend`; Laravel devuelve JSON y gestiona sesiones, permisos y datos.

## Módulos y funcionalidades disponibles

- Catálogo público de productos con precio, descripción, existencias e imagen.
- **Integración con APIs públicas de Anime (Jikan REST API v4 & Kitsu API)**:
  - Búsqueda en tiempo real y vinculación de figuras/coleccionables con la serie de anime correspondiente desde el panel de administración.
  - Botón de asignación manual de texto cuando se requiera ingresar nombres personalizados sin esperar a la red.
  - Filtro dinámico por serie mediante *chips* en el catálogo público para explorar únicamente los productos del anime seleccionado.
  - **Hover Cards Interactivas**: Tarjeta flotante inteligente que detecta los bordes de la pantalla (desplegándose a la derecha o izquierda sin desbordarse) mostrando la portada oficial, título kanji/romaji, calificación, estado, año, géneros y sinopsis completa de la obra.
- Registro de clientes, login y cierre de sesión.
- Carrito de compras con control de stock y cálculo de totales en tiempo real.
- Perfil: edición de nombre, correo y contraseña. Cambiar correo o contraseña requiere la contraseña actual.
- Administración de usuarios: listado paginado, búsqueda por nombre/correo, filtro por rol, creación, edición y eliminación con confirmación.
- Administración de productos: búsqueda, vinculación con anime, creación, edición de datos e imagen, inventario y eliminación con confirmación.
- Roles `admin` y `cliente`: el registro público siempre crea clientes. La API comprueba los permisos y protege la cuenta propia del administrador.
- **Simulación de Compras**:
  - Modal de confirmación de pago directamente desde el carrito, con selección de método de pago (tarjeta, efectivo, transferencia) y notas opcionales.
  - Generación automática de número de folio único por orden con formato `ORD-AAAAMMDD-XXXX`.
  - Los artículos de cada orden se guardan como *snapshot* (nombre, precio, anime, imagen), preservando la trazabilidad histórica aunque el producto sea editado o eliminado posteriormente.
- **Historial de compras del cliente** en `/mis-compras`: vista paginada con desglose por artículo, serie/anime, precio unitario y subtotal.
- **Dashboard de trazabilidad para administradores** en `/admin/dashboard`: métricas globales en tiempo real (ventas totales, órdenes, unidades vendidas, clientes únicos) y tabla de auditoría de todas las transacciones con búsqueda y filtro por estado.

## Simulación de Compras y Trazabilidad

El módulo de órdenes simula un flujo de compra completo sin pasarela de pago real:

### Flujo de compra

1. El cliente agrega productos al carrito (el stock se reserva en este momento).
2. Desde el carrito, presiona **Confirmar compra**: se abre un modal para elegir método de pago (tarjeta de crédito / débito, efectivo o transferencia bancaria) y agregar notas opcionales.
3. Al confirmar, el backend genera la orden con un folio único (`ORD-AAAAMMDD-XXXX`), almacena una instantánea (*snapshot*) de cada artículo comprado y vacía el carrito.
4. Se muestra una tarjeta de confirmación con el número de folio y el resumen de la compra.

> **Nota**: no se integra ningún procesador de pagos real; todos los pagos son simulados con fines de demostración.

### Patrón de snapshot en `order_items`

Cada ítem de orden guarda en base de datos los valores del momento de la compra: `product_name`, `price`, `anime_title` e `image_path`. Esto garantiza que el historial sea inmutable e independiente de cambios futuros en el catálogo.

### Métricas del dashboard (administrador)

El endpoint `GET /api/admin/orders` devuelve el objeto `stats` con las siguientes claves:

| Clave | Descripción |
| --- | --- |
| `total_sales` | Suma de todos los ingresos registrados |
| `total_orders` | Número total de órdenes |
| `total_units_sold` | Unidades vendidas en todas las órdenes |
| `unique_customers` | Clientes distintos que han realizado al menos una compra |

### Tablas de base de datos creadas

La migración `create_orders_and_order_items_tables` añade dos tablas:

- **`orders`**: `id`, `order_number`, `user_id`, `total`, `status`, `payment_method`, `notes`, `timestamps`.
- **`order_items`**: `id`, `order_id`, `product_id` (nullable), `product_name`, `price`, `quantity`, `anime_title`, `image_path`, `timestamps`.

No se requieren pasos de configuración adicionales; `php artisan migrate` crea estas tablas automáticamente.

---

## Integración de APIs de Anime (Jikan y Kitsu)

El proyecto consume información pública de anime sin necesidad de API keys o registros de pago:

1. **Jikan REST API v4 (`https://api.jikan.moe/v4`)**:
   - API de código abierto que indexa MyAnimeList (MAL).
   - Utilizada como fuente principal para consultar animes (`/anime?q={busqueda}`) y obtener sinopsis, portadas y calificaciones (`/anime/{id}`).
2. **Kitsu Anime API (`https://kitsu.io/api/edge`)**:
   - Utilizada como **mecanismo de respaldo automático (*fallback*)** en caso de que Jikan experimente caídas, bloqueos de IP o demoras en la red (timeout de 3.5 segundos).
3. **Caché en Memoria y Deduplicación**:
   - `react-frontend/src/lib/jikan.js` cuenta con una caché de consultas en memoria para evitar peticiones redundantes y respetar la tasa límite de Jikan (3 req/segundo).

### Configuración de las APIs al clonar el proyecto

**No se requieren claves secretas ni variables de entorno adicionales** para las APIs de anime:
- Al clonar el repositorio, las peticiones HTTP a Jikan y Kitsu funcionan de forma inmediata desde el cliente web.
- Al ejecutar las migraciones del backend (`php artisan migrate`), la base de datos incorpora automáticamente las columnas `anime_id`, `anime_title` y `anime_image_url` en la tabla `products`.

## Requisitos

PHP 8.2 o superior con PDO MySQL y SQLite, Composer, Node.js compatible con Vite 8 (el proyecto usa Node 24) y npm. Para MySQL local puedes usar XAMPP.

## Preparar una copia del repositorio

Desde la raíz del repositorio, en PowerShell:

```powershell
cd tienda-anime
composer install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Configura la conexión en `tienda-anime/.env` con las credenciales de tu instalación:

```dotenv
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tienda_anime_db
DB_USERNAME=root
DB_PASSWORD="TU_CONTRASEÑA_MYSQL"
```

Crea la base `tienda_anime_db` en MySQL si no existe. Genera la clave **solo al preparar un entorno que aún no tiene APP_KEY**:

```powershell
php artisan key:generate
php artisan config:clear
php artisan migrate --seed
php artisan storage:link
```

> **Nota sobre imágenes**: `php artisan storage:link` (o la creación de un enlace simbólco/junction hacia `storage/app/public`) es indispensable para que las imágenes subidas en el catálogo sean accesibles públicamente desde `/storage`.

El seeder crea el administrador de desarrollo si no existe:

- Correo: `admin@tienda.com`
- Contraseña inicial: `password123`

Si esa cuenta ya existe, conserva su contraseña actual. Puedes cambiarla desde **Mi perfil**.

En un proyecto clonado, `composer install` restaura las dependencias que generan `vendor/autoload.php`. Sanctum, las rutas y los modelos ya están incluidos; no hay que repetir `install:api` ni crear otra aplicación.

## Ejecutar en desarrollo

Primera terminal, desde `tienda-anime`:

```powershell
php artisan serve
```

Segunda terminal, desde la raíz del repositorio:

```powershell
cd react-frontend
npm ci
npm run dev
```

Abre **http://localhost:5173** para usar la aplicación. El puerto 8000 sirve únicamente la API.

| Ruta React | Vista |
| --- | --- |
| `/` | Inicio, catálogo público, filtro por anime y hover cards interactivas |
| `/login` | Inicio de sesión |
| `/registro` | Crear cuenta de cliente |
| `/carrito` | Carrito de compras (clientes) |
| `/mi-cuenta` | Perfil del usuario autenticado |
| `/admin/usuarios` | Gestión de usuarios, solo administradores |
| `/admin/productos` | Gestión de productos y vinculación con catálogo de anime |
| `/mis-compras` | Historial de compras del usuario autenticado (clientes) |
| `/admin/dashboard` | Dashboard de ventas y trazabilidad global (administradores) |

Vite reenvía `/api`, `/sanctum` y `/storage` a `http://127.0.0.1:8000`. Para usar otro puerto del backend, copia `react-frontend/.env.example` como `.env.local` y cambia `LARAVEL_API_URL`. Si frontend y backend se sirven desde dominios distintos, configura `VITE_STORAGE_URL` con el origen de Laravel para cargar las imágenes.

La sesión utiliza cookies HttpOnly de Sanctum y protección CSRF. No se guardan contraseñas ni tokens en localStorage. Los dominios locales de Vite están configurados en `config/sanctum.php`; si defines `SANCTUM_STATEFUL_DOMAINS`, incluye el host y puerto desde el que abres React.

## API del módulo backend

| Método y ruta | Acceso |
| --- | --- |
| `GET /sanctum/csrf-cookie` | Inicializar protección CSRF |
| `POST /api/register` | Registro de clientes |
| `POST /api/login` | Login, con límite de intentos |
| `GET /api/me` | Consultar sesión |
| `POST /api/logout` | Cerrar sesión |
| `PUT /api/profile` | Actualizar perfil propio |
| `GET /api/products` | Consultar catálogo público (incluye datos de anime) |
| `GET /api/product/{id}` | Consultar un producto |
| `POST /api/product` | Administrador: crear producto (con `anime_id`, `anime_title`, etc.) |
| `PUT /api/product/{id}` | Administrador: actualizar producto |
| `DELETE /api/product/{id}` | Administrador: eliminar producto |
| `GET /api/cart` | Consultar carrito del usuario actual |
| `POST /api/cart/{productId}` | Agregar cantidad al carrito |
| `DELETE /api/cart/{productId}/unit` | Descontar una unidad del carrito |
| `DELETE /api/cart/{productId}` | Quitar producto del carrito |
| `GET /api/users?search=&role=&page=1` | Administrador: consultar usuarios |
| `POST /api/users` | Administrador: crear usuario |
| `PUT /api/users/{id}` | Administrador: editar usuario |
| `DELETE /api/users/{id}` | Administrador: eliminar usuario |
| `POST /api/checkout` | Cliente: confirmar compra y vaciar carrito |
| `GET /api/my-orders` | Cliente: historial paginado de ordenes propias |
| `GET /api/orders/{id}` | Cliente/Admin: detalle de una orden especifica |
| `GET /api/admin/orders?search=&status=&page=1` | Administrador: trazabilidad global con metricas |

Login y registro esperan peticiones de la SPA con cookies, origen permitido y cabecera X-XSRF-TOKEN. Axios se encarga de enviarlas.

## Verificación

Desde `tienda-anime`:

```powershell
php artisan test
```

Las pruebas PHP usan SQLite en memoria, sin tocar MySQL.

Desde `react-frontend`:

```powershell
npm run build
npm run test:e2e
```

Las pruebas de navegador levantan servidores temporales en los puertos 8011 y 4173 y crean una base SQLite independiente en `tests/.runtime`. En Windows usan Microsoft Edge instalado. En otros sistemas instala Chromium con `npx playwright install chromium`. Puedes elegir otro navegador compatible mediante `PLAYWRIGHT_CHANNEL`.

Para publicar el frontend compilado, configura el servidor web para resolver las rutas de React hacia `index.html` y reenviar `/api`, `/sanctum` y `/storage` a Laravel. El proxy de Vite es solo para desarrollo y la previsualización local.

Referencias: [sesiones SPA de Sanctum](https://laravel.com/docs/12.x/sanctum#spa-authentication), [proxy de Vite](https://vite.dev/config/server-options.html#server-proxy), [Jikan REST API v4](https://docs.api.jikan.moe/), [Kitsu API](https://kitsu.docs.apiary.io/), [Laravel Eloquent Relationships](https://laravel.com/docs/12.x/eloquent-relationships).
