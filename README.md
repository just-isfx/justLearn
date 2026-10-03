<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

# justLearnCode

justLearnCode is a desktop-oriented programming learning application built
with Laravel, PHP, React, MySQL, HTML, CSS, and JavaScript. It combines
structured courses with progress tracking, quizzes, an AI learning tutor, and
learning engagement tools.

## Features

- Registration, login, logout, profile editing, and validated profile pictures
- Programming languages, courses, lessons, library search, notes, and favorites
- Real lesson progress, learning history, time tracking, and continue learning
- Server-side scored quizzes, retakes, result review, and quiz history
- AI Tutor conversations with server-side credentials, ownership checks, and rate limiting
- Browser Text-to-Speech for lessons, articles, AI responses, and quiz questions
- English, French, and Spanish interface translations with persistent preferences
- Achievements, daily learning streaks, and persistent notifications
- Administrator dashboard with user management and educational content CRUD

## Technology

- Laravel 12 and PHP 8.2+
- React 18 with Vite
- MySQL 8+
- Axios, React Router, react-i18next, and Tailwind CSS

## Requirements

Install PHP with Composer, Node.js with npm, and MySQL. Create a MySQL
database matching the `DB_DATABASE` value in `.env`.

## Installation

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
npm install
php artisan migrate --seed
php artisan storage:link
```

Set the database values and `AI_OPENAI_KEY` in `.env`. The AI key is used only
by Laravel and must never be placed in React source or committed to Git.

## Running

Start Laravel and Vite in separate terminals:

```powershell
php artisan serve
npm run dev
```

For a production frontend bundle:

```powershell
npm run build
```

## Database and seeders

`php artisan migrate --seed` creates the learning, quiz, engagement, and admin
schema and seeds languages, courses, lessons, library articles, quizzes,
questions, options, and achievements. Use `php artisan migrate:fresh --seed`
only when intentionally rebuilding a development database.

The project does not create a public administrator password. Assign the admin
role through a controlled development database operation, then change or
remove that account before any production deployment.

## Admin access

Administrators use `/admin`. Laravel requires authentication and the `admin`
middleware for every admin endpoint. The UI supports users, languages,
courses, lessons, articles, quizzes, questions, and options.

## Security notes

Passwords are hashed by Laravel, profile images are MIME/type and size
validated, user-owned resources are authorization-checked, quiz answers are
graded server-side, and `.env`, dependencies, logs, and generated builds are
ignored by Git.

## Testing

```powershell
php artisan test
npm run build
```

The browser Speech Synthesis API and responsive layouts should also be checked
manually in the target browser at 1280x720, 1366x768, and 1920x1080.

## Original Laravel documentation

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
