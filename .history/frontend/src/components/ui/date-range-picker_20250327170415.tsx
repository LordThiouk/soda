"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  align?: "center" | "start" | "end";
  locale?: Locale;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = "start",
  locale = fr,
  ...props
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    dateRange || {
      from: new Date(),
      to: addDays(new Date(), 7),
    }
  );

  // Mettre à jour l'état local lorsque la prop change
  React.useEffect(() => {
    if (dateRange) {
      setDate(dateRange);
    }
  }, [dateRange]);

  // Gérer le changement de date et propager vers le parent
  const handleDateChange = (range: DateRange | undefined) => {
    setDate(range);
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  // Préréglages de périodes communes
  const quickSelects = [
    {
      label: "7 derniers jours",
      onSelect: () => {
        const today = new Date();
        const range = {
          from: addDays(today, -6),
          to: today,
        };
        handleDateChange(range);
      },
    },
    {
      label: "30 derniers jours",
      onSelect: () => {
        const today = new Date();
        const range = {
          from: addDays(today, -29),
          to: today,
        };
        handleDateChange(range);
      },
    },
    {
      label: "Mois en cours",
      onSelect: () => {
        const today = new Date();
        const range = {
          from: new Date(today.getFullYear(), today.getMonth(), 1),
          to: today,
        };
        handleDateChange(range);
      },
    },
    {
      label: "Mois précédent",
      onSelect: () => {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const range = {
          from: lastMonth,
          to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
        };
        handleDateChange(range);
      },
    },
  ];

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full lg:w-auto justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale })
              )
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-col sm:flex-row">
            <div className="border-r p-2 space-y-2">
              <div className="px-3 py-2 text-sm font-medium">Préréglages</div>
              <div className="space-y-1">
                {quickSelects.map((preset, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full justify-start text-left text-sm"
                    onClick={preset.onSelect}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
              locale={locale}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 