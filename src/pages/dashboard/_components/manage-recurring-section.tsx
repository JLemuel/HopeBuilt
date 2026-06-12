import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { ActionLink } from "@/components/ui/table-primitives.tsx";
import { CampaignIcon } from "@/components/campaign-icon.tsx";
import type { RecurringSubscription } from "@/lib/hopebuilt-types.ts";

export default function ManageRecurringSection({
  heading,
  subscriptions,
  onPause,
  onCancel,
  onUpdatePayment,
}: {
  heading: string;
  subscriptions: RecurringSubscription[];
  onPause?: (subscription: RecurringSubscription) => void;
  onCancel?: (subscription: RecurringSubscription) => void;
  onUpdatePayment?: (subscription: RecurringSubscription) => void;
}) {
  if (subscriptions.length === 0) return null;

  return (
    <section className="bg-gray-100 text-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-7 px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-xl font-black tracking-tight">{heading}</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <Card
              key={subscription.id}
              className="gap-4 rounded-2xl border-0 py-6 shadow-none bg-white text-black"
            >
              <CardHeader className="gap-1">
                <div className="flex items-start gap-3">
                  <CampaignIcon name={subscription.icon} />
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="text-sm font-semibold">
                      {subscription.campaign}
                    </CardTitle>
                    <p className="text-sm font-bold text-emerald-600">
                      {subscription.amountPerMonth}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-black">
                  {subscription.nextCharge}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription.paymentMethod}
                </p>
              </CardContent>
              <CardFooter className="gap-4">
                <button
                  type="button"
                  onClick={() => onPause?.(subscription)}
                  className="rounded-md border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-600 transition-colors outline-none hover:bg-amber-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer"
                >
                  Pause
                </button>
                <ActionLink
                  tone="red"
                  className="text-xs"
                  onClick={() => onCancel?.(subscription)}
                >
                  Cancel
                </ActionLink>
                <ActionLink
                  className="text-xs"
                  onClick={() => onUpdatePayment?.(subscription)}
                >
                  Update Payment
                </ActionLink>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
