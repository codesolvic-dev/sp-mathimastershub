import React from "react";
import { Truck } from "lucide-react";
import {
  deliverySettingsFromPayment,
  formatDeliveryInfoLine,
} from "@/utils/deliveryInfo";

type Props = {
  paymentSettings?: Record<string, unknown> | null;
  formatMoney: (amount: number) => string;
  className?: string;
};

export default function ProductDeliveryInfo({ paymentSettings, formatMoney, className = "" }: Props) {
  const delivery = deliverySettingsFromPayment(paymentSettings);
  const line = formatDeliveryInfoLine(delivery, formatMoney);
  const [titlePart, ...restParts] = line.split(", ");
  const subtitle = restParts.join(", ");

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Truck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--theme-primary)" }} />
        <p className="text-sm text-gray-700 leading-relaxed min-w-0">
          <span className="font-semibold text-gray-900">{titlePart}</span>
          {subtitle ? <span className="text-gray-600">, {subtitle}</span> : null}
        </p>
      </div>
    </div>
    // <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}>
    //   <div className="flex items-start gap-3">
    //     <Truck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--theme-primary)" }} />
    //     <p className="text-sm text-gray-700 leading-relaxed min-w-0">
    //       <span className="font-semibold text-gray-900">{titlePart}</span>
    //       {subtitle ? <span className="text-gray-600">, {subtitle}</span> : null}
    //     </p>
    //   </div>
    // </div>
  );
}
