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
        Schema::create('production_plans', function (Blueprint $table) {
            $table->id();
            $table->string('plan_code')->unique();
            $table->date('plan_date');
            $table->string('status')->default('PENDING'); // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('production_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_plan_id')->constrained('production_plans')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('planned_quantity', 15, 3);
            $table->decimal('actual_quantity', 15, 3)->nullable();
            $table->string('unit');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        
        // Add production_plan_id to orders table so we can link them
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('production_plan_id')->nullable()->constrained('production_plans')->nullOnDelete()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['production_plan_id']);
            $table->dropColumn('production_plan_id');
        });
        Schema::dropIfExists('production_plan_items');
        Schema::dropIfExists('production_plans');
    }
};
