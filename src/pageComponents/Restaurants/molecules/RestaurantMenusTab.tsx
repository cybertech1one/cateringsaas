"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { MenuSquare, Plus } from "lucide-react";
import Link from "next/link";

interface Menu {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
}

interface RestaurantMenusTabProps {
  menus: Menu[];
}

export function RestaurantMenusTab({ menus }: RestaurantMenusTabProps) {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Menus</h2>
        <p className="text-sm text-muted-foreground">
          Menus linked to this restaurant
        </p>
      </div>

      {menus.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {menus.map((menu) => (
            <Card key={menu.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{menu.name}</CardTitle>
                  <Badge
                    variant={menu.isPublished ? "default" : "secondary"}
                  >
                    {menu.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                {menu.slug && (
                  <CardDescription className="text-xs">
                    /{menu.slug}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/menu/manage/${menu.slug}/restaurant`}>
                    Manage Menu
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 py-16">
          <MenuSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No menus linked</h3>
          <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
            Create a menu and link it to this restaurant to manage it
            here.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/menu/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Menu
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
