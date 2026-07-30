import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "How do I bookmark a help item?", a: "Open the help item and click the bookmark icon in the modal header." },
  { q: "Can I share a help link with my teammates?", a: "Yes — every help item has a permanent link copyable from the viewer modal." },
  { q: "How long does support take to respond?", a: "Within 24 hours for standard, 4 hours for enterprise SLAs." },
  { q: "Where do I see my tickets?", a: "Click 'My Tickets' in the top-right header to see all support requests." },
  { q: "Why don't I see Help on some buttons?", a: "Help is only shown when content exists. Use Contact Support or FAQ instead." },
];

export function FAQDialog({
  open,
  onOpenChange,
  componentLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  componentLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Frequently Asked Questions</DialogTitle>
          <DialogDescription>Common questions about {componentLabel} and the platform.</DialogDescription>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`}>
              <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
