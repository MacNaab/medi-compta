import * as React from "react";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "jj/mm/aaaa";
  }

  return date.toLocaleDateString("fr-FR");
}

function formatDateInput(date: Date | undefined) {
  if (!date) {
    return "";
  }
  const offset = date.getTimezoneOffset()
  date = new Date(date.getTime() - (offset*60*1000))
  return date.toISOString().split('T')[0]
}

export function DatePickerInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value?: Date;
  onChange?: (date: string | undefined) => void;
}) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [displayValue, setDisplayValue] = React.useState(formatDate(date));

  const today = new Date();

  // Synchronise l'état local avec la prop value
  React.useEffect(() => {
    setDate(value);
    setDisplayValue(formatDate(value));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (date: Date) => {
    setDate(date);
    setDisplayValue(formatDate(date));
    setMonth(date);
    if (onChange === undefined) return;
    onChange(date ? formatDateInput(date) : "");
  }

  return (
    <Popover>
      <div className="flex items-center gap-2" style={{ position: "relative" }}>
        <Input id={id} value={displayValue} readOnly />
        <PopoverTrigger className="absolute right-0" asChild>
          <Button variant="ghost">
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="start">
        <div className="flex flex-col justify-center gap-2">
          <Calendar
            mode="single"
            locale={fr}
            selected={date}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              handleChange(date);
            }}
          />
          <div className="flex justify-around">
            <Button
              variant="outline"
              className="p-2 hover:bg-red-500"
              onClick={() => {
                handleChange(undefined);
              }}
            >
              Effacer
            </Button>
            <Button
              variant="outline"
              className="p-2 hover:bg-blue-500"
              onClick={() => {
                handleChange(today);
              }}
            >
              Aujourd'hui
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

