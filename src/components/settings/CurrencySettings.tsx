import { useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { IndianRupee, DollarSign, Save } from 'lucide-react';

const CurrencySettings = () => {
  const { currency, setCurrency, formatAmount, getCurrencySymbol } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  const handleSaveCurrency = () => {
    setCurrency(selectedCurrency);
    toast.success(`Currency changed to ${selectedCurrency}`);
  };

  const currencies = [
    {
      code: 'INR' as const,
      name: 'Indian Rupee',
      symbol: '₹',
      icon: IndianRupee,
      description: 'Default currency for Indian operations',
    },
    {
      code: 'USD' as const,
      name: 'US Dollar',
      symbol: '$',
      icon: DollarSign,
      description: 'International standard currency',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <IndianRupee className="w-5 h-5" />
          Currency Settings
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your preferred currency for all financial transactions and reports.
        </p>
      </div>

      <div className="grid gap-4">
        {currencies.map((curr) => {
          const Icon = curr.icon;
          const isSelected = selectedCurrency === curr.code;
          
          return (
            <Card
              key={curr.code}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/5 border-primary/20'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedCurrency(curr.code)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{curr.name}</h4>
                        <span className="text-sm text-muted-foreground">({curr.code})</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{curr.description}</p>
                      <div className="mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          Example: {formatAmount(10000)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <h4 className="font-medium text-sm">Current Active Currency</h4>
          <p className="text-xs text-muted-foreground">
            All amounts will be displayed in {currency} ({getCurrencySymbol()})
          </p>
        </div>
        <div className="text-lg font-bold">
          {getCurrencySymbol()}
        </div>
      </div>

      {selectedCurrency !== currency && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveCurrency} className="gap-2">
            <Save className="w-4 h-4" />
            Save Currency Settings
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default CurrencySettings;
