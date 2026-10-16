import { Outlet } from "react-router-dom";
import { MarketingHeader } from "../components/marketing-header";
import { MarketingFooter } from "../components/marketing-footer";

export function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFECE4] selection:bg-[#5C4033] selection:text-white">
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
