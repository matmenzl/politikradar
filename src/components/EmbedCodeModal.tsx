import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Copy, Code2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmbedCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedUrl: string;
}

function EmbedContent({ embedUrl }: { embedUrl: string }) {
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("600");

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}px"
  style="border: 1px solid #e5e7eb; border-radius: 8px; max-width: 100%;"
  loading="lazy"
  title="Politikradar"
></iframe>`;

  const responsiveCode = `<div style="position: relative; width: 100%; max-width: 720px;">
  <iframe
    src="${embedUrl}"
    style="width: 100%; min-height: ${height}px; border: 1px solid #e5e7eb; border-radius: 8px;"
    loading="lazy"
    title="Politikradar"
  ></iframe>
</div>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Embed-Code kopiert!");
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Breite</label>
          <select value={width} onChange={(e) => setWidth(e.target.value)} className="w-full text-sm rounded-md border border-border bg-background px-3 py-1.5">
            <option value="100%">100% (responsive)</option>
            <option value="720">720px</option>
            <option value="560">560px</option>
            <option value="400">400px</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Höhe</label>
          <select value={height} onChange={(e) => setHeight(e.target.value)} className="w-full text-sm rounded-md border border-border bg-background px-3 py-1.5">
            <option value="400">400px</option>
            <option value="600">600px</option>
            <option value="800">800px</option>
            <option value="1000">1000px</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Einfacher Embed-Code</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => handleCopy(iframeCode)}>
            <Copy className="w-3 h-3" /> Kopieren
          </Button>
        </div>
        <pre className="text-xs bg-secondary/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all text-foreground">{iframeCode}</pre>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Responsive Embed-Code</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => handleCopy(responsiveCode)}>
            <Copy className="w-3 h-3" /> Kopieren
          </Button>
        </div>
        <pre className="text-xs bg-secondary/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all text-foreground">{responsiveCode}</pre>
      </div>

      <p className="text-xs text-muted-foreground">
        Vorschau: <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{embedUrl}</a>
      </p>
    </div>
  );
}

const EmbedCodeModal = ({ open, onOpenChange, embedUrl }: EmbedCodeModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6 max-h-[85vh]">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="font-serif flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Einbetten
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <EmbedContent embedUrl={embedUrl} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Code2 className="w-4 h-4" /> Einbetten
          </DialogTitle>
        </DialogHeader>
        <EmbedContent embedUrl={embedUrl} />
      </DialogContent>
    </Dialog>
  );
};

export default EmbedCodeModal;
