import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumeForm } from "@/components/shared/ResumeForm";

interface AddResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResumeModal({ open, onOpenChange }: AddResumeModalProps) {
  const handleSave = async (data: any) => {
    // The ResumeForm component already handles API submission
    // This callback is called after successful save
    console.log('Resume saved successfully from recruiter:', data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Resume</DialogTitle>
        </DialogHeader>

        <ResumeForm
          onSubmit={handleSave}
          submitButtonText="Save Resume Details"
        />
      </DialogContent>
    </Dialog>
  );
}
