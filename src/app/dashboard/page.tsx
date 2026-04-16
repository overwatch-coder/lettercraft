"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { DashboardSidebar, type DashboardView } from "@/components/layout/dashboard-sidebar";
import { OverviewView } from "@/components/dashboard/overview-view";
import { LettersView } from "@/components/dashboard/letters-view";
import { ResumesView } from "@/components/dashboard/resumes-view";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function DashboardPage() {
  const { coverLetters, hydrate } = useAppStore();
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <DashboardSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 overflow-auto">
        {/* Mobile header with sidebar trigger */}
        <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium capitalize">{activeView}</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeView === "overview" && <OverviewView />}
          {activeView === "letters" && <LettersView />}
          {activeView === "resumes" && <ResumesView />}
          {activeView === "analytics" && <AnalyticsCharts letters={coverLetters} />}
        </div>
      </div>
    </div>
  );
}
