import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Currency = 'INR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number, originalCurrency?: Currency) => string;
  getCurrencySymbol: () => string;
  convertAmount: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [currency, setCurrencyState] = useState<Currency>('INR');
  
  // Fixed conversion rate: 1 USD = 83 INR (approximate)
  const CONVERSION_RATE = 83;

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && (savedCurrency === 'INR' || savedCurrency === 'USD')) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Convert from INR to USD
    if (fromCurrency === 'INR' && toCurrency === 'USD') {
      return amount / CONVERSION_RATE;
    }
    
    // Convert from USD to INR
    if (fromCurrency === 'USD' && toCurrency === 'INR') {
      return amount * CONVERSION_RATE;
    }
    
    return amount;
  };

  const formatAmount = (amount: number, originalCurrency?: Currency): string => {
    // If originalCurrency is provided, convert from that currency to the current display currency
    let displayAmount = amount;
    if (originalCurrency && originalCurrency !== currency) {
      displayAmount = convertAmount(amount, originalCurrency, currency);
    }
    
    const symbol = currency === 'INR' ? '₹' : '$';
    const formattedAmount = displayAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formattedAmount}`;
  };

  const getCurrencySymbol = (): string => {
    return currency === 'INR' ? '₹' : '$';
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatAmount,
        getCurrencySymbol,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
