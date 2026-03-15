<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Thêm các cột hỗ trợ cho status flow đầy đủ:
     * DRAFT → SUBMITTED → CONFIRMED → IN_PRODUCTION → READY → IN_DELIVERY → DELIVERED → COMPLETED
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Đổi default status từ PENDING → DRAFT
            $table->string('status')->default('DRAFT')->change();

            // Coordinator confirm
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete()->after('approved_by');
            $table->timestamp('confirmed_at')->nullable()->after('confirmed_by');

            // Kitchen production timestamps
            $table->timestamp('production_started_at')->nullable()->after('confirmed_at');
            $table->timestamp('ready_at')->nullable()->after('production_started_at');

            // Delivery timestamps
            $table->timestamp('in_delivery_at')->nullable()->after('ready_at');
            $table->timestamp('delivered_at')->nullable()->after('in_delivery_at');
            $table->timestamp('completed_at')->nullable()->after('delivered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('PENDING')->change();
            $table->dropForeign(['confirmed_by']);
            $table->dropColumn([
                'confirmed_by',
                'confirmed_at',
                'production_started_at',
                'ready_at',
                'in_delivery_at',
                'delivered_at',
                'completed_at',
            ]);
        });
    }
};
