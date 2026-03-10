<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ensure sqlite database file exists and schema is applied when using sqlite driver
        if (config('database.default') === 'sqlite') {
            $dbPath = database_path(config('database.connections.sqlite.database', 'database.sqlite'));
            if (!file_exists($dbPath)) {
                // create empty sqlite file
                @touch($dbPath);
                // run migrations and seeders so tables are ready
                try {
                    \Artisan::call('migrate', ['--force' => true]);
                    \Artisan::call('db:seed', ['--force' => true]);
                } catch (\Throwable $e) {
                    // log error but don't break application startup
                    logger()->error('Failed to migrate/seed sqlite database: '.$e->getMessage());
                }
            }
        }
    }
}
