import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  currency?: string;
}

const ProgressCard = ({
  title,
  current,
  target,
  currency = "KES",
}: ProgressCardProps) => {
  const percentage = Math.min((current / target) * 100, 100);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <Card variant="gold">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="font-display text-3xl font-bold">
              {currency} {formatNumber(current)}
            </span>
            <span className="text-muted-foreground">
              {" "}/ {currency} {formatNumber(target)}
            </span>
          </div>
          <span className="text-2xl font-bold text-accent">{percentage.toFixed(0)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-gold rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between mt-3 text-sm text-muted-foreground">
          <span>Current</span>
          <span>Target</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
