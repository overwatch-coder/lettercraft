"use client";

import { useMemo, type ReactNode } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { format, subDays } from "date-fns";
import type { CoverLetter } from "@/lib/types";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--ring))",
  "hsl(var(--foreground))",
];

export function AnalyticsCharts({ letters }: { letters: CoverLetter[] }) {
  const { languageData, toneData, activityData } = useMemo(() => {
    const languageMap = new Map<string, number>();
    const toneMap = new Map<string, number>();
    const activityMap = new Map<string, number>();

    for (const letter of letters) {
      languageMap.set(letter.language, (languageMap.get(letter.language) ?? 0) + 1);
      toneMap.set(letter.tone, (toneMap.get(letter.tone) ?? 0) + 1);
      const day = format(new Date(letter.timestamp), "MMM d");
      activityMap.set(day, (activityMap.get(day) ?? 0) + 1);
    }

    const languageData = [...languageMap.entries()].map(([name, value]) => ({ name, value }));
    const toneData = [...toneMap.entries()].map(([name, value]) => ({ name, value }));

    const lastSeven = Array.from({ length: 7 }, (_, index) => format(subDays(new Date(), 6 - index), "MMM d"));
    const activityData = lastSeven.map((day) => ({ day, count: activityMap.get(day) ?? 0 }));

    return { languageData, toneData, activityData };
  }, [letters]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-6 slide-up">
        <h2 className="mb-4 text-lg font-semibold">By language</h2>
        <ChartShell>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={languageData}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </Card>

      <Card className="p-6 slide-up">
        <h2 className="mb-4 text-lg font-semibold">By tone</h2>
        <ChartShell>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={toneData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {toneData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      </Card>

      <Card className="p-6 slide-up">
        <h2 className="mb-4 text-lg font-semibold">Activity</h2>
        <ChartShell>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={activityData}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ fill: "hsl(var(--secondary))", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>
      </Card>
    </div>
  );
}

function ChartShell({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border bg-background p-3">{children}</div>;
}
