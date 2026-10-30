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
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('anime_id')->nullable()->index()->after('image_path');
            $table->string('anime_title')->nullable()->after('anime_id');
            $table->string('anime_image_url')->nullable()->after('anime_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['anime_id', 'anime_title', 'anime_image_url']);
        });
    }
};
