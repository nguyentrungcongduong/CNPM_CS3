<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_code')->unique(); // QR code identifier
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->decimal('quantity', 15, 3);
            $table->decimal('initial_quantity', 15, 3);
            $table->date('mfg_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('ACTIVE'); // ACTIVE, EXPIRED, SOLD_OUT
            $table->timestamps();

            $table->index(['item_id', 'warehouse_id']);
            $table->index('expiry_date');
            $table->index('batch_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
