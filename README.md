# Anime Store

Tienda de anime con frontend en React y una API en Laravel 12. Las vistas están en `react-frontend`; Laravel devuelve JSON y gestiona sesiones, permisos y datos.

## Módulo disponible

- Catálogo público de productos con precio, descripción, existencias e imagen.
- Registro de clientes, login y cierre de sesión.
- Perfil: edición de nombre, correo y contraseña. Cambiar correo o contraseña requiere la contraseña actual.
- Administración de usuarios: listado paginado, búsqueda por nombre/correo, filtro por rol, creación, edición y eliminación con confirmación.
- Administración de productos: búsqueda, creación, edición de datos e imagen, inventario y eliminación con confirmación.
- Roles `admin` y `cliente`: el registro público siempre crea clientes. La API comprueba los permisos y protege la cuenta propia del administrador.

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
```

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
| `/` | Inicio y catálogo público de productos |
| `/login` | Inicio de sesión |
| `/registro` | Crear cuenta de cliente |
| `/mi-cuenta` | Perfil del usuario autenticado |
| `/admin/usuarios` | Gestión de usuarios, solo administradores |
| `/admin/productos` | Gestión de productos, solo administradores |

Vite reenvía `/api`, `/sanctum` y `/storage` a `http://127.0.0.1:8000`. Para usar otro puerto del backend, copia `react-frontend/.env.example` como `.env.local` y cambia `LARAVEL_API_URL`. Si frontend y backend se sirven desde dominios distintos, configura `VITE_STORAGE_URL` con el origen de Laravel para cargar las imágenes.

La sesión utiliza cookies HttpOnly de Sanctum y protección CSRF. No se guardan contraseñas ni tokens en localStorage. Los dominios locales de Vite están configurados en `config/sanctum.php`; si defines `SANCTUM_STATEFUL_DOMAINS`, incluye el host y puerto desde el que abres React.

## API del módulo

| Método y ruta | Acceso |
| --- | --- |
| `GET /sanctum/csrf-cookie` | Inicializar protección CSRF |
| `POST /api/register` | Registro de clientes |
| `POST /api/login` | Login, con límite de intentos |
| `GET /api/me` | Consultar sesión |
| `POST /api/logout` | Cerrar sesión |
| `PUT /api/profile` | Actualizar perfil propio |
| `GET /api/products` | Consultar catálogo público |
| `GET /api/product/{id}` | Consultar un producto |
| `POST /api/product` | Administrador: crear producto con formulario multipart |
| `PUT /api/product/{id}` | Administrador: actualizar producto |
| `DELETE /api/product/{id}` | Administrador: eliminar producto |
| `GET /api/users?search=&role=&page=1` | Administrador: consultar usuarios |
| `POST /api/users` | Administrador: crear |
| `PUT /api/users/{id}` | Administrador: editar |
| `DELETE /api/users/{id}` | Administrador: eliminar |

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

Referencias: [sesiones SPA de Sanctum](https://laravel.com/docs/12.x/sanctum#spa-authentication), [proxy de Vite](https://vite.dev/config/server-options.html#server-proxy).
