<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\OrderItem;
use App\Models\ProductionPlanItem;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        return Unit::orderBy('type')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'symbol' => 'required|string|max:20|unique:units,symbol',
            'type' => 'required|in:weight,volume,count',
            'is_default' => 'nullable|boolean',
        ]);

        // If new unit is default => unset other defaults
        if (!empty($validated['is_default'])) {
            Unit::where('type', $validated['type'])->update(['is_default' => false]);
        }

        return Unit::create($validated);
    }

    public function update(Request $request, int $id)
    {
        $unit = Unit::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'symbol' => 'required|string|max:20|unique:units,symbol,' . $unit->id,
            'type' => 'required|in:weight,volume,count',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            Unit::where('type', $validated['type'])->update(['is_default' => false]);
        }

        $unit->update($validated);
        return $unit;
    }

    public function destroy(int $id)
    {
        $unit = Unit::findOrFail($id);

        // Không xóa nếu đang được dùng ở các nơi đang lưu chuỗi unit symbol
        if (Item::where('unit', $unit->symbol)->exists()) {
            return response()->json(['message' => 'Không thể xóa — đơn vị đang được sử dụng (Item).'], 422);
        }
        if (OrderItem::where('unit', $unit->symbol)->exists()) {
            return response()->json(['message' => 'Không thể xóa — đơn vị đang được sử dụng (OrderItem).'], 422);
        }
        if (ProductionPlanItem::where('unit', $unit->symbol)->exists()) {
            return response()->json(['message' => 'Không thể xóa — đơn vị đang được sử dụng (ProductionPlanItem).'], 422);
        }

        $unit->delete();
        return response()->json(['message' => 'Đã xóa.']);
    }
}
