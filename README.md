# Tienda Anime
Desarrollado en Laravel + React con XAMPP y Composer

## Entorno de desarrollo
```bash
$ nvm --version
0.39.7
$ node --version
v24.18.0
$ npm --version
11.16.0
$ php --version
PHP 8.2.12 (cli)
$ composer --version
2.10.3
```

## Crear proyecto Laravel

```bash
# Levantar servidor XAMPP y bd
$ sudo /opt/lampp/lampp start

# Crear proyecto
$ composer create-project laravel/laravel:^12.0 tienda-anime
$ cd sistema-torneos
$ npm install

# Instalar API y Sanctum 
$ php artisan install:api

# Crear migraciones y modelos
$ php artisan make:model Product -m

# Crear controladores
$ php artisan make:controller AuthController
$ php artisan make:controller ProductController

# Crear middleware
php artisan make:middleware CheckRole
```

El administrador se creo mediente un seeder en sistema-torneos/database/seeders/DatabaseSeeder.php
```php
 User::create([
            'name' => 'Administrador',
            'email' => 'admin@torneos.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);
```
Levantamos el proyecto con las migraciones y seeders
```bash
# Ejecutar las migraciones
$ php artisan migrate --seed

# Levantar el proyecto (backend)
$ php artisan serve 
```

## Crear proyecto React

```bash
$ npx create vite
$ cd react-frontend
$ npm i axios bootstrap react-router-dom@6

# Levantar proyecto
$ npm run dev
```
