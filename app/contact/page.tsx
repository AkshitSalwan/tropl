'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    inquiry: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [nameError, setNameError] = useState('');

  const validateNameField = (value: string) => {
    const alphabetPattern = /^[A-Za-z\s]*$/;
    
    if (value && !alphabetPattern.test(value)) {
      setNameError('please enter a valid name');
      return false;
    } else {
      setNameError('');
      return true;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'name') {
      validateNameField(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name field before submission
    const isNameValid = validateNameField(formData.name);
    if (!isNameValid) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // TODO: connect to API
      console.log('Contact form submission:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Thank You!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                We've received your message and will get back to you within 24 hours.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-primary hover:bg-primary/90"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ready to transform your hiring process? Get in touch with our team to learn more about tropl.ai
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  We're here to help you revolutionize your recruitment process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Email</h4>
                    <p className="text-gray-600">hello@tropl.ai</p>
                    <p className="text-gray-600">support@tropl.ai</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Phone</h4>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500">Mon-Fri, 9am-6pm EST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Office</h4>
                    <p className="text-gray-600">
                      123 Innovation Drive<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Business Hours</h4>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                      Saturday - Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Enterprise Sales</h3>
                <p className="text-blue-800 text-sm mb-4">
                  Looking for a custom solution for your organization? Our enterprise team is ready to help.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Schedule a Demo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name*</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="John Doe"
                        required
                        className={nameError ? 'border-red-500' : ''}
                      />
                      {nameError && (
                        <p className="text-xs text-red-500 mt-1">{nameError}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address*</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Your Company"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Your Role</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        placeholder="e.g., HR Director, Recruiter"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="inquiry">Type of Inquiry*</Label>
                    <Select onValueChange={(value) => handleInputChange('inquiry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales & Pricing</SelectItem>
                        <SelectItem value="demo">Request a Demo</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                        <SelectItem value="general">General Questions</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message*</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us about your hiring needs and how we can help..."
                      rows={6}
                      required
                    />
                  </div>

                  <Alert>
                    <AlertDescription>
                      By submitting this form, you agree to our privacy policy and terms of service. 
                      We'll only use your information to respond to your inquiry.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.inquiry || !formData.message}
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Quick answers to common questions about tropl.ai
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  How does the AI scoring work?
                </h3>
                <p className="text-gray-600 text-sm">
                  Our AI analyzes resumes, interview responses, and job requirements using advanced 
                  machine learning algorithms to provide objective candidate assessments.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Is my data secure?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes, we use enterprise-grade security with end-to-end encryption and comply with 
                  GDPR, CCPA, and other data protection regulations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  How long does implementation take?
                </h3>
                <p className="text-gray-600 text-sm">
                  Most organizations are up and running within 1-2 weeks, including training and 
                  integration with existing HR systems.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Do you offer custom integrations?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes, we provide custom API integrations with popular ATS, HRIS, and other 
                  enterprise systems for seamless workflow integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}