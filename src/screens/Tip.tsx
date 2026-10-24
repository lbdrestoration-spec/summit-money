import { iso, today } from "../calc";
import { tipFor } from "../tips";
import { Card, label } from "../ui";

/** One small saving habit a day. */
export function Tip() {
  return (
    <Card className="space-y-1">
      <div className={label}>Tip for today</div>
      <p className="text-sm">{tipFor(iso(today()))}</p>
    </Card>
  );
}
