import { forwardRef } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { IndianRupee, DollarSign, LucideProps } from "lucide-react";

interface CurrencyIconProps extends LucideProps {}

export const CurrencyIcon = forwardRef<SVGSVGElement, CurrencyIconProps>(
  ({ className, size, ...props }, ref) => {
    const { currency } = useCurrency();
    
    if (currency === 'INR') {
      return <IndianRupee ref={ref} className={className} size={size} {...props} />;
    }
    
    return <DollarSign ref={ref} className={className} size={size} {...props} />;
  }
);

CurrencyIcon.displayName = "CurrencyIcon";
