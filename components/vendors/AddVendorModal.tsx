import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AddVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorAdded?: () => void;
}

interface VendorFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  specialization: string[];
  rating: number;
  notes: string;
}

export function AddVendorModal({ open, onOpenChange, onVendorAdded }: AddVendorModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameErrors, setNameErrors] = useState({
    name: '',
    contactPerson: ''
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    specialization: [],
    rating: 0,
    notes: '',
  });
  const { token } = useAuth();

  const validateNameField = (field: 'name' | 'contactPerson', value: string) => {
    const alphabetPattern = /^[A-Za-z\s]*$/;
    
    if (value && !alphabetPattern.test(value)) {
      setNameErrors(prev => ({
        ...prev,
        [field]: 'please enter a valid name'
      }));
      return false;
    } else {
      setNameErrors(prev => ({
        ...prev,
        [field]: ''
      }));
      return true;
    }
  };

  // Phone validation function
  const validatePhoneField = (value: string) => {
    // Allow digits, +, spaces, and dashes only
    const phonePattern = /^[+\d\s-]*$/;
    // Extract only digits for length validation
    const digitsOnly = value.replace(/[^0-9]/g, '');
    
    if (value && !phonePattern.test(value)) {
      setPhoneError('Please enter a valid phone number');
      return false;
    } else if (value && (digitsOnly.length < 10 || digitsOnly.length > 15)) {
      setPhoneError('Phone number must contain minimum 10 digits');
      return false;
    } else {
      setPhoneError(null);
      return true;
    }
  };

  const handleInputChange = (field: keyof VendorFormData, value: string | number | string[]) => {
    if ((field === 'name' || field === 'contactPerson') && typeof value === 'string') {
      validateNameField(field, value);
    }
    
    // Validate phone field
    if (field === 'phone' && typeof value === 'string') {
      validatePhoneField(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialization: checked 
        ? [...prev.specialization, specialization]
        : prev.specialization.filter(s => s !== specialization)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Vendor name is required');
      return false;
    }
    if (!formData.contactPerson.trim()) {
      setError('Contact person is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Check for name validation errors
    const hasNameErrors = Object.values(nameErrors).some(error => error !== '');
    if (hasNameErrors) {
      setError('Please correct the name field errors');
      return false;
    }
    
    // Check for phone validation errors
    if (phoneError) {
      setError('Please correct the phone number field');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          name: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          specialization: [],
          rating: 0,
          notes: '',
        });
        setStep(1);
        onOpenChange(false);
        onVendorAdded?.();
      } else {
        setError(data.error || 'Failed to create vendor');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Vendor Information" },
    { number: 2, title: "Contact Details" },
    { number: 3, title: "Specialization & Notes" },
  ];

  const specializationOptions = [
    'IT Recruitment',
    'Executive Search',
    'Healthcare Staffing',
    'Finance & Accounting',
    'Engineering',
    'Sales & Marketing',
    'Manufacturing',
    'Construction',
    'Legal',
    'Education',
    'Other'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>

          <div className="flex justify-between mt-4">
            {steps.map((s) => (
              <div
                key={s.number}
                className={`flex items-center ${
                  s.number !== steps.length ? "flex-1" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= s.number
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s.number}
                </div>
                <div
                  className={`ml-2 text-sm ${
                    step >= s.number ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  {s.title}
                </div>
                {s.number !== steps.length && (
                  <div className="flex-1 h-0.5 bg-gray-200 ml-2" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Name*</Label>
                  <Input 
                    id="vendorName" 
                    placeholder="Enter vendor name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className={nameErrors.name ? 'border-red-500' : ''}
                  />
                  {nameErrors.name && (
                    <p className="text-xs text-red-500">{nameErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person*</Label>
                  <Input 
                    id="contactPerson" 
                    placeholder="Enter contact person name"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    required
                    className={nameErrors.contactPerson ? 'border-red-500' : ''}
                  />
                  {nameErrors.contactPerson && (
                    <p className="text-xs text-red-500">{nameErrors.contactPerson}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  placeholder="Enter vendor address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Select 
                  value={formData.rating.toString()} 
                  onValueChange={(value) => handleInputChange('rating', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - No rating</SelectItem>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Fair</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={phoneError ? 'border-red-500' : ''}
                />
                {phoneError && (
                  <p className="text-xs text-red-500">{phoneError}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Specialization Areas</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {specializationOptions.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={spec}
                        checked={formData.specialization.includes(spec)}
                        onCheckedChange={(checked) => 
                          handleSpecializationChange(spec, checked as boolean)
                        }
                      />
                      <Label htmlFor={spec} className="text-sm">{spec}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
                  placeholder="Add any additional notes about the vendor..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Review Vendor Information:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Contact Person:</strong> {formData.contactPerson}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  {formData.specialization.length > 0 && (
                    <p><strong>Specialization:</strong> {formData.specialization.join(', ')}</p>
                  )}
                  <p><strong>Rating:</strong> {formData.rating}/5</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                onOpenChange(false);
              }
            }}
            disabled={isLoading}
          >
            {step === 1 ? "Cancel" : "Previous"}
          </Button>
          <Button
            onClick={() => {
              if (step < steps.length) {
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (step === steps.length ? "Save Vendor" : "Next")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}