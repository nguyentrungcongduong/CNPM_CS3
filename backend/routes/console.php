<?php

use App\Jobs\CheckLateDeliveries;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Kiểm tra giao hàng trễ mỗi giờ
Schedule::job(new CheckLateDeliveries)->hourly();
