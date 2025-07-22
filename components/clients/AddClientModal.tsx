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

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded?: () => void;
}

interface ClientFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  industry: string;
  companySize: string;
  notes: string;
}

export function AddClientModal({ open, onOpenChange, onClientAdded }: AddClientModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameErrors, setNameErrors] = useState({
    name: '',
    contactPerson: ''
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    companySize: '',
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
  
  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    if (field === 'name' || field === 'contactPerson') {
      validateNameField(field, value);
    }
    
    // Validate phone field
    if (field === 'phone') {
      validatePhoneField(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Client name is required');
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
      const response = await fetch('/api/clients', {
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
          website: '',
          industry: '',
          companySize: '',
          notes: '',
        });
        setStep(1);
        onOpenChange(false);
        onClientAdded?.();
      } else {
        setError(data.error || 'Failed to create client');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Client Information" },
    { number: 2, title: "Contact Details" },
    { number: 3, title: "Additional Info" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>

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
        </DialogHeader>        <div className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name*</Label>
                  <Input 
                    id="clientName" 
                    placeholder="Enter client name"
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
                  placeholder="Enter company address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    value={formData.industry} 
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select 
                    value={formData.companySize} 
                    onValueChange={(value) => handleInputChange('companySize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  placeholder="Enter website URL"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
                  placeholder="Add any additional notes about the client..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Review Client Information:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Contact Person:</strong> {formData.contactPerson}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  {formData.industry && <p><strong>Industry:</strong> {formData.industry}</p>}
                </div>
              </div>
            </div>
          )}        </div>

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
            {isLoading ? "Saving..." : (step === steps.length ? "Save Client" : "Next")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}