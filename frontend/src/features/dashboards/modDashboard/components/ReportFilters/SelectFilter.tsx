import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectFilterProps<T extends string | number> {
  label: string;
  value: string;
  options: { value: T; label: string }[];
  onChange: (value: string) => void;
}

export const SelectFilter = <T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectFilterProps<T>) => (
  <div>
    <label className="text-sm font-medium mb-2 block">{label}</label>

    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>

      <SelectContent>
        {options.map((o) => (
          <SelectItem key={String(o.value)} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
