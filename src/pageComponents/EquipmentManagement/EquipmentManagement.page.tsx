"use client";

import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Plus, Package, AlertTriangle } from "lucide-react";

function formatCurrency(centimes: number) {
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

export default function EquipmentManagement() {
  const { data: equipment, isLoading } = api.equipment.list.useQuery({});
  const { data: lowStock } = api.equipment.getLowStock.useQuery({});

  const items = (equipment ?? []) as Array<Record<string, unknown>>;
  const alerts = (lowStock ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-sm text-muted-foreground">
            Track inventory, allocations, and condition
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-sm text-orange-800">
                Low Stock Alerts ({alerts.length})
              </span>
            </div>
            <div className="text-xs text-orange-700">
              {alerts.map((item) => (
                <span key={item.id as string} className="mr-3">
                  {item.name as string} ({item.quantityAvailable as number}/{item.quantityTotal as number})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading equipment...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No equipment added yet</p>
          </div>
        ) : (
          items.map((item) => {
            const available = item.quantityAvailable as number;
            const total = item.quantityTotal as number;
            const pct = total > 0 ? Math.round((available / total) * 100) : 0;

            return (
              <Card key={item.id as string}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{item.name as string}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {(item.category as string).replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-xs font-medium">
                      {available}/{total}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Condition: {item.condition as string}
                    {item.costPerUnit ? (
                      <span className="ml-2">
                        Value: {formatCurrency(item.costPerUnit as number)}/unit
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
