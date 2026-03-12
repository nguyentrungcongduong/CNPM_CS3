<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the `batches` table with columns and constraints for tracking inventory batches.
     *
     * Creates columns: `id`; `item_id` and `warehouse_id` foreign keys referencing `items` and `warehouses` with cascade on delete; `batch_number`; `manufacturing_date` (nullable); `expiry_date` (nullable); `initial_quantity` and `quantity_on_hand` as decimals (15,3); `status` defaulting to `'ACTIVE'`; timestamps and soft deletes. Adds an index on `batch_number`.
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
     * Drop the 'batches' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
