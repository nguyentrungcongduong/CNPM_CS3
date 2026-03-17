<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * deliveries       – one delivery per "run" (driver + vehicle + date)
     * delivery_items   – which orders are in this delivery
     */
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_code')->unique(); // DEL-20260317-001
            $table->date('scheduled_date');            // ngày giao dự kiến
            $table->time('scheduled_time')->nullable(); // giờ giao dự kiến
            $table->string('status')->default('PENDING');
            // PENDING → IN_TRANSIT → DELIVERED → CANCELLED
            $table->string('driver_name')->nullable();
            $table->string('driver_phone')->nullable();
            $table->string('vehicle_plate')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('dispatched_at')->nullable(); // khi chuyển sang IN_TRANSIT
            $table->timestamp('completed_at')->nullable();  // khi toàn bộ đơn DELIVERED
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('delivery_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('status')->default('PENDING'); // PENDING | DELIVERED | FAILED
            $table->text('note')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            // Mỗi đơn chỉ xuất hiện 1 lần trong 1 lịch giao
            $table->unique(['delivery_id', 'order_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_items');
        Schema::dropIfExists('deliveries');
    }
};
