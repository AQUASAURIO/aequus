import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * Cron job endpoint for revaluation alerts.
 * Checks for properties whose last valuation is older than 6 months.
 *
 * Production integration:
 * - Vercel Cron Jobs (vercel.json → cron)
 * - AWS EventBridge Scheduler
 * - GitHub Actions (scheduled workflow)
 * - Systemd timer / crontab
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "aequo-cron-secret";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Find properties with valuations older than 6 months
    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, valuations(*)")
      .eq("status", "VALUADO");

    if (error) throw error;

    const alerts: {
      propertyId: string;
      propertyName: string;
      lastValuation: string;
      daysSinceValuation: number;
      city: string;
    }[] = [];

    for (const property of properties || []) {
      const vals = (property.valuations || [])
        .sort(
          (a, b) =>
            new Date(b.valuated_at).getTime() -
            new Date(a.valuated_at).getTime(),
        );

      const lastValuation = vals[0];
      if (!lastValuation) continue;

      const valuationDate = new Date(lastValuation.valuated_at);
      const daysSince = Math.floor(
        (now.getTime() - valuationDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSince > 180) {
        alerts.push({
          propertyId: property.id,
          propertyName: property.name,
          lastValuation: lastValuation.valuated_at,
          daysSinceValuation: daysSince,
          city: property.city,
        });

        // Update status to EN_REVISION
        await supabase
          .from("properties")
          .update({ status: "EN_REVISION" })
          .eq("id", property.id);
      }
    }

    // Production: send email notifications via SendGrid/AWS SES here

    return NextResponse.json({
      success: true,
      checkedAt: now.toISOString(),
      propertiesNeedingRevaluation: alerts.length,
      alerts: alerts.slice(0, 10),
    });
  } catch (error) {
    console.error("Cron revaluation alert error:", error);
    return NextResponse.json(
      { error: "Error processing revaluation alerts" },
      { status: 500 },
    );
  }
}
