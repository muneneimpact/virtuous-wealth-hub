import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "gold" | "success" | "warning" | "danger";
}

const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatsCardProps) => {
  const variantStyles = {
    default: {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    gold: {
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
    },
    success: {
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    warning: {
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    danger: {
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card variant="elevated" className="hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="font-display text-2xl lg:text-3xl font-bold mb-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-sm font-medium ${
                    trend.isPositive ? "text-success" : "text-destructive"
                  }`}
                >
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${styles.iconBg}`}>
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
