"use client";

import { Navbar } from "~/components/Navbar/Navbar";
import { withPrivateRoute } from "~/providers/AuthProvider/withPrivateRoute";

const LayoutViewComponent = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex h-full w-full grow flex-col justify-center px-3 md:items-center md:px-0">
        <div className="flex-1 py-6 md:container md:py-8">{children}</div>
      </main>
    </>
  );
};

export const LayoutView = withPrivateRoute(LayoutViewComponent);
