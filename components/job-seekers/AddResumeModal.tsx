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
  editData?: any; // Candidate data for editing
  isEditing?: boolean; // Whether this is edit mode
}

export function AddResumeModal({ 
  open, 
  onOpenChange, 
  editData = null,
  isEditing = false 
}: AddResumeModalProps) {
  const handleSave = async (data: any) => {
    // The ResumeForm component already handles API submission
    // This callback is called after successful save
    console.log(isEditing ? 'Resume updated successfully:' : 'Resume saved successfully from recruiter:', data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Resume' : 'Add New Resume'}</DialogTitle>
        </DialogHeader>

        <ResumeForm
          onSubmit={handleSave}
          submitButtonText={isEditing ? "Update Resume Details" : "Save Resume Details"}
          isRecruiterAdding={true}
          editData={editData}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
}
