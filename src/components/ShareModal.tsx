import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Copy, Twitter, Linkedin, Mail } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shareButtons = [
  { icon: Copy, label: "Link kopieren", action: () => { navigator.clipboard.writeText(window.location.href); toast.success("Link kopiert!"); } },
  { icon: Twitter, label: "Auf Twitter teilen", action: () => { window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, "_blank"); } },
  { icon: Linkedin, label: "Auf LinkedIn teilen", action: () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank"); } },
  { icon: Mail, label: "Per E-Mail teilen", action: () => { window.open(`mailto:?body=${encodeURIComponent(window.location.href)}`, "_blank"); } },
];

function ShareButtons() {
  return (
    <div className="space-y-3 pt-2">
      {shareButtons.map(({ icon: Icon, label, action }) => (
        <Button key={label} variant="outline" className="w-full justify-start gap-3" onClick={action}>
          <Icon className="w-4 h-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}

const ShareModal = ({ open, onOpenChange }: ShareModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="font-serif">Teilen</DrawerTitle>
          </DrawerHeader>
          <ShareButtons />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Teilen</DialogTitle>
        </DialogHeader>
        <ShareButtons />
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
