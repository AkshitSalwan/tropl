import { useState } from "react";
import { ArrowLeft, Clipboard, Upload, Edit, CheckCircle, AlertCircle, Upload as UploadIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useJobDescriptionUpload } from "@/hooks/useJobDescriptionUpload";

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobModal({ open, onOpenChange }: CreateJobModalProps) {
  const [step, setStep] = useState(1);
  const [creationMethod, setCreationMethod] = useState<"paste" | "upload" | "manual" | null>(null);
  const [jobData, setJobData] = useState({
    jobTitle: "",
    city: "",
    state: "",
    country: "",
    companyName: "",
    department: "",
    industryType: "",
    description: "",
    experienceRequired: "",
    educationUG: "",
    educationPG: "",
    additionalSkills: "",
    salaryPerAnnum: "",
    keySkills: ""
  });
  
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const { uploadJobDescription, isUploading, uploadProgress } = useJobDescriptionUpload();

  const handleJobDescriptionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus({ status: 'uploading', message: 'Processing job description with AI...' });

    try {
      const result = await uploadJobDescription(file);
      
      if (result.success && result.extractedData) {
        const data = result.extractedData;
        
        // Debug logging
        console.log('AI Extracted Job Data:', data);
        
        // Auto-fill form fields
        setJobData(prev => ({
          ...prev,
          jobTitle: data.jobTitle || prev.jobTitle,
          city: data.location?.city || prev.city,
          state: data.location?.state || prev.state,
          country: data.location?.country || prev.country,
          companyName: data.companyName || prev.companyName,
          department: data.department || prev.department,
          industryType: data.industryType || prev.industryType,
          description: data.description || prev.description,
          experienceRequired: data.experienceRequired || prev.experienceRequired,
          educationUG: data.requirements?.education || prev.educationUG,
          educationPG: prev.educationPG, // Will be filled manually
          additionalSkills: data.requirements?.skills?.join(', ') || prev.additionalSkills,
          salaryPerAnnum: data.salaryRange?.min && data.salaryRange?.max ? 
            `${data.salaryRange.min} - ${data.salaryRange.max} ${data.salaryRange.currency || 'INR'}` : 
            prev.salaryPerAnnum,
          keySkills: data.requirements?.skills?.join(', ') || prev.keySkills
        }));

        setUploadStatus({ 
          status: 'success', 
          message: `Job description processed successfully! Auto-filled job details including ${
            data.responsibilities?.length || 0
          } responsibilities and ${
            data.requirements?.skills?.length || 0
          } required skills.`
        });
      }
    } catch (error) {
      console.error('Job description upload error:', error);
      setUploadStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to process job description' 
      });
    }
  };

  const steps = [
    { number: 1, title: "Job Description" },
    { number: 2, title: "Job Details" },
    { number: 3, title: "Share" },
  ];

  const renderStep1 = () => (
    <div className="space-y-6">
      {!creationMethod ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setCreationMethod("paste")}>
            <div className="flex flex-col items-center text-center space-y-2">
              <Clipboard className="w-8 h-8 text-blue-600" />
              <h3 className="font-medium">Paste Job Description</h3>
              <p className="text-sm text-gray-500">Copy and paste job description from any source</p>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setCreationMethod("upload")}>
            <div className="flex flex-col items-center text-center space-y-2">
              <Upload className="w-8 h-8 text-blue-600" />
              <h3 className="font-medium">Upload Description Document</h3>
              <p className="text-sm text-gray-500">Upload a document containing job description</p>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => {
            setCreationMethod("manual");
            setStep(2);
          }}>
            <div className="flex flex-col items-center text-center space-y-2">
              <Edit className="w-8 h-8 text-blue-600" />
              <h3 className="font-medium">Skip & Fill Manually</h3>
              <p className="text-sm text-gray-500">Enter job details manually</p>
            </div>
          </Card>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={() => setStep(2)} 
            disabled={!creationMethod || creationMethod === "manual"}
          >
            Continue
          </Button>
        </div>
        </>
      ) : (
        <>
          {creationMethod === "paste" && (
            <div className="space-y-4">
              <Textarea
                placeholder="Paste job description here..."
                className="min-h-[200px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreationMethod(null)}>Back</Button>
                <Button onClick={() => setStep(2)}>Continue</Button>
              </div>
            </div>
          )}

          {creationMethod === "upload" && (
            <div className="space-y-4">
              {/* Upload Status Alert */}
              {uploadStatus.status !== 'idle' && (
                <Alert className={uploadStatus.status === 'error' ? 'border-red-200 bg-red-50' : 
                                 uploadStatus.status === 'success' ? 'border-green-200 bg-green-50' : 
                                 'border-blue-200 bg-blue-50'}>
                  <div className="flex items-center gap-2">
                    {uploadStatus.status === 'uploading' && <UploadIcon className="h-4 w-4 animate-spin" />}
                    {uploadStatus.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {uploadStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    <AlertDescription>{uploadStatus.message}</AlertDescription>
                  </div>
                  {uploadStatus.status === 'uploading' && Object.keys(uploadProgress).length > 0 && (
                    <div className="mt-2">
                      {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="space-y-1">
                          <div className="text-xs text-gray-600">{fileName}</div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </Alert>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  className="hidden"
                  id="jobDescription"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleJobDescriptionUpload}
                  disabled={isUploading}
                />
                <Label
                  htmlFor="jobDescription"
                  className="cursor-pointer text-blue-600 hover:text-blue-700"
                >
                  Click to upload or drag and drop
                </Label>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreationMethod(null)}>Back</Button>
                <Button onClick={() => setStep(2)} disabled={uploadStatus.status !== 'success'}>Continue</Button>
              </div>
            </div>
          )}

          {creationMethod === "manual" && (
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Job Details</h3>
        
        {/* Title - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Title<span className="text-red-500">*</span></Label>
          <Input 
            id="jobTitle" 
            placeholder="Enter job title"
            value={jobData.jobTitle}
            onChange={(e) => setJobData(prev => ({ ...prev, jobTitle: e.target.value }))}
            required
          />
        </div>

        {/* Location - Mandatory */}
        <div className="space-y-2">
          <Label>Location<span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-3 gap-2">
            <Input 
              placeholder="City"
              value={jobData.city}
              onChange={(e) => setJobData(prev => ({ ...prev, city: e.target.value }))}
              required
            />
            <Input 
              placeholder="State"
              value={jobData.state}
              onChange={(e) => setJobData(prev => ({ ...prev, state: e.target.value }))}
              required
            />
            <Input 
              placeholder="Country"
              value={jobData.country}
              onChange={(e) => setJobData(prev => ({ ...prev, country: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Company Name - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name<span className="text-red-500">*</span></Label>
          <Input 
            id="companyName" 
            placeholder="Enter company name"
            value={jobData.companyName}
            onChange={(e) => setJobData(prev => ({ ...prev, companyName: e.target.value }))}
            required
          />
        </div>

        {/* Department - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="department">Department<span className="text-red-500">*</span></Label>
          <Input 
            id="department" 
            placeholder="Enter department"
            value={jobData.department}
            onChange={(e) => setJobData(prev => ({ ...prev, department: e.target.value }))}
            required
          />
        </div>

        {/* Industry - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="industryType">Industry<span className="text-red-500">*</span></Label>
          <Select 
            value={jobData.industryType}
            onValueChange={(value) => setJobData(prev => ({ ...prev, industryType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Information Technology">Information Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Consulting">Consulting</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Real Estate">Real Estate</SelectItem>
              <SelectItem value="Telecommunications">Telecommunications</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Responsibilities/Description - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="description">Job Responsibilities/Description<span className="text-red-500">*</span></Label>
          <Textarea 
            id="description"
            placeholder="Enter job responsibilities and description"
            value={jobData.description}
            onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
            className="min-h-[120px]"
            required
          />
        </div>

        {/* Experience Required - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="experienceRequired">Experience Required<span className="text-red-500">*</span></Label>
          <Input 
            id="experienceRequired" 
            placeholder="e.g., 2-5 years, 5+ years"
            value={jobData.experienceRequired}
            onChange={(e) => setJobData(prev => ({ ...prev, experienceRequired: e.target.value }))}
            required
          />
        </div>

        {/* Education UG - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="educationUG">Education UG<span className="text-red-500">*</span></Label>
          <Input 
            id="educationUG" 
            placeholder="e.g., B.Tech, BCA, B.Com"
            value={jobData.educationUG}
            onChange={(e) => setJobData(prev => ({ ...prev, educationUG: e.target.value }))}
            required
          />
        </div>

        {/* Education PG - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="educationPG">Education PG<span className="text-red-500">*</span></Label>
          <Input 
            id="educationPG" 
            placeholder="e.g., M.Tech, MCA, MBA"
            value={jobData.educationPG}
            onChange={(e) => setJobData(prev => ({ ...prev, educationPG: e.target.value }))}
            required
          />
        </div>

        {/* Additional Skills */}
        <div className="space-y-2">
          <Label htmlFor="additionalSkills">Additional Skills</Label>
          <Textarea 
            id="additionalSkills"
            placeholder="Enter additional skills (comma separated)"
            value={jobData.additionalSkills}
            onChange={(e) => setJobData(prev => ({ ...prev, additionalSkills: e.target.value }))}
            className="min-h-[80px]"
          />
        </div>

        {/* Salary per Annum - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="salaryPerAnnum">Salary per Annum<span className="text-red-500">*</span></Label>
          <Input 
            id="salaryPerAnnum" 
            placeholder="e.g., 5-8 LPA, 10-15 LPA"
            value={jobData.salaryPerAnnum}
            onChange={(e) => setJobData(prev => ({ ...prev, salaryPerAnnum: e.target.value }))}
            required
          />
        </div>

        {/* Key Skills/Remarks - Mandatory */}
        <div className="space-y-2">
          <Label htmlFor="keySkills">Key Skills/Remarks<span className="text-red-500">*</span></Label>
          <Textarea 
            id="keySkills"
            placeholder="Enter key skills and remarks"
            value={jobData.keySkills}
            onChange={(e) => setJobData(prev => ({ ...prev, keySkills: e.target.value }))}
            className="min-h-[100px]"
            required
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button onClick={() => setStep(3)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="onsite" id="onsite" />
              <Label htmlFor="onsite">On Site</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hybrid" id="hybrid" />
              <Label htmlFor="hybrid">Hybrid</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Client & Vendor Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client1">Client 1</SelectItem>
                <SelectItem value="client2">Client 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>End Client</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select end client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="endclient1">End Client 1</SelectItem>
                <SelectItem value="endclient2">End Client 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Organization Manager</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager1">Manager 1</SelectItem>
                <SelectItem value="manager2">Manager 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Recruiter</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select recruiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recruiter1">Recruiter 1</SelectItem>
                <SelectItem value="recruiter2">Recruiter 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Pay Rate Details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Bill Rate (INR)</Label>
            <Input type="number" placeholder="Enter bill rate" />
          </div>
          <div className="space-y-2">
            <Label>Vendor Pay Rate (C2C)</Label>
            <Input type="number" placeholder="Enter vendor pay rate" />
          </div>
          <div className="space-y-2">
            <Label>Candidate Pay Rate</Label>
            <Input type="number" placeholder="Enter candidate pay rate" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Bill Rate Frequency</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vendor Pay Frequency</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Candidate Pay Frequency</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Location</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>City*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>State*</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maharashtra">Maharashtra</SelectItem>
                <SelectItem value="karnataka">Karnataka</SelectItem>
                <SelectItem value="tamilnadu">Tamil Nadu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Country*</Label>
            <Select defaultValue="india">
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="usa">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Skills</h3>
        <div className="space-y-2">
          <Label>Primary Skills*</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select primary skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="node">Node.js</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Skills</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="link" className="p-0">
          Upload Job Description
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Job Description</h3>
        <Textarea
          placeholder="Enter detailed job description..."
          className="min-h-[200px]"
        />
      </div>

      <div className="flex justify-end">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            setStep(1);
            setCreationMethod(null);
          }}>Back</Button>
          <Button onClick={() => setStep(3)}>Continue</Button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Share Job</h3>
        <div className="space-y-2">
          <Label>Share with Vendors</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vendor1">Vendor 1</SelectItem>
              <SelectItem value="vendor2">Vendor 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Share with Recruiters</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select recruiters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recruiter1">Recruiter 1</SelectItem>
              <SelectItem value="recruiter2">Recruiter 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
          <Button 
            onClick={() => {
              // Handle form submission
              onOpenChange(false);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            Create New Job
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            {step > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>New Job</DialogTitle>
          </div>
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
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </DialogContent>
    </Dialog>
  );
}