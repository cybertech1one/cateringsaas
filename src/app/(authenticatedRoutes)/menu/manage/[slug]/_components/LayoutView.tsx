"use client";

import { useParams } from "next/navigation";
import { Sidebar } from "~/pageComponents/RestaurantDashboard/molecules/Sidebar";
import { MenuManagementToolbar } from "~/pageComponents/MenuCreator/molecules/MenuManagementToolbar";
import { api } from "~/trpc/react";

export const LayoutView = ({ children }: { children: React.ReactNode }) => {
  const { slug } = useParams() as { slug: string };
  const { data: menu } = api.menus.getMenuBySlug.useQuery(
    { slug },
    { enabled: !!slug },
  );

  return (
    <div className="flex h-full min-h-full flex-1 grow flex-col gap-6 md:flex-row">
      <Sidebar />
      <main className="flex w-full grow flex-col border-l border-border/50 px-4 md:px-6">
        {menu && (
          <div className="w-full pt-4">
            <MenuManagementToolbar menuId={menu.id} slug={slug} />
          </div>
        )}
        <div className="w-full flex-1 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};
