<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('batch_number');
            $table->date('manufacturing_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('initial_quantity', 15, 3);
            $table->decimal('quantity_on_hand', 15, 3);
            $table->string('status')->default('ACTIVE');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['batch_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
