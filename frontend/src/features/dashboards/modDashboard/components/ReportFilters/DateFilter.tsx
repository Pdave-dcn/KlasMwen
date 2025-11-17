import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateFilterProps {
  label: string;
  date?: Date;
  onChange: (date?: Date) => void;
  disabled?: (date: Date) => boolean;
}

export const DateFilter = ({
  label,
  date,
  onChange,
  disabled,
}: DateFilterProps) => (
  <div>
    <label className="text-sm font-medium mb-2 block">{label}</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  </div>
);
