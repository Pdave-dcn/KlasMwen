import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ReportStatusEnum, Report } from "@/zodSchemas/report.zod";

export type ControlsProps = {
  localStatus: ReportStatusEnum;
  localIsHidden: boolean;
  localNotes: string;
  onNotesChange: (v: string) => void;
  onSaveNotes: () => void;
  onStatusChange: (s: ReportStatusEnum) => void;
  onToggleHidden: () => void;
  report: Report;
};

export const ReportControls = ({
  localStatus,
  localIsHidden,
  localNotes,
  onNotesChange,
  onSaveNotes,
  onStatusChange,
  onToggleHidden,
}: ControlsProps) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={localStatus} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="hidden">Content Hidden</Label>
          <Switch
            id="hidden"
            checked={localIsHidden}
            onCheckedChange={onToggleHidden}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Moderator Notes</Label>
        <Textarea
          id="notes"
          value={localNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes about this report..."
          rows={4}
          className="mt-2"
        />
        <Button
          onClick={onSaveNotes}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Save Notes
        </Button>
      </div>
    </div>
  );
};
