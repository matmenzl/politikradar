import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Twitter, Linkedin, Mail } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareModal = ({ open, onOpenChange }: ShareModalProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link kopiert!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Teilen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
            Link kopieren
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => toast.info("Mock: Twitter öffnen")}>
            <Twitter className="w-4 h-4" />
            Auf Twitter teilen
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => toast.info("Mock: LinkedIn öffnen")}>
            <Linkedin className="w-4 h-4" />
            Auf LinkedIn teilen
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => toast.info("Mock: E-Mail öffnen")}>
            <Mail className="w-4 h-4" />
            Per E-Mail teilen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
