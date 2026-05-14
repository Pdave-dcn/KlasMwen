import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../../../components/ui/accordion";

const TIPS = [
  {
    value: "naming",
    title: "Choosing a great name",
    content:
      'Be specific and descriptive. "AP Calculus BC Study Group" is more discoverable than just "Math Group."',
  },
  {
    value: "tags",
    title: "Picking the right tags",
    content:
      "Add 3–5 relevant tags to help students find your group. Mix broad subjects (Math) with specifics (Calculus).",
  },
  {
    value: "privacy",
    title: "Public vs Private",
    content:
      "Public groups grow faster through discovery. Private groups are ideal for close-knit teams or exam prep with friends.",
  },
];

export function TipsAccordion() {
  return (
    <Accordion
      type="single"
      collapsible
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {TIPS.map((tip, index) => (
        <AccordionItem
          key={tip.value}
          value={tip.value}
          className={
            index < TIPS.length - 1 ? "border-b border-border px-4" : "px-4"
          }
        >
          <AccordionTrigger className="text-sm py-3 hover:no-underline">
            {tip.title}
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            {tip.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
