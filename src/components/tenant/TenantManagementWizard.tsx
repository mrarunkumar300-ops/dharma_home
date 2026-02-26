import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Home, 
  CreditCard, 
  Zap, 
  FileText, 
  DollarSign, 
  UserPlus,
  QrCode,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Settings,
  BookOpen,
  AlertCircle,
  Clock,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  current: boolean;
}

interface TenantManagementWizardProps {
  onComplete?: () => void;
}

export function TenantManagementWizard({ onComplete }: TenantManagementWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps: WizardStep[] = [
    {
      id: "create-tenant",
      title: "Create Tenant",
      description: "Add new tenant with user account",
      icon: UserPlus,
      completed: completedSteps.includes("create-tenant"),
      current: currentStep === 0
    },
    {
      id: "assign-unit",
      title: "Assign Unit",
      description: "Select property and unit for tenant",
      icon: Home,
      completed: completedSteps.includes("assign-unit"),
      current: currentStep === 1
    },
    {
      id: "family-details",
      title: "Family Details",
      description: "Add family members for emergency contacts",
      icon: Users,
      completed: completedSteps.includes("family-details"),
      current: currentStep === 2
    },
    {
      id: "meter-reading",
      title: "Meter Reading",
      description: "Record initial meter readings",
      icon: Zap,
      completed: completedSteps.includes("meter-reading"),
      current: currentStep === 3
    },
    {
      id: "generate-bills",
      title: "Generate Bills",
      description: "Create initial rent and utility bills",
      icon: FileText,
      completed: completedSteps.includes("generate-bills"),
      current: currentStep === 4
    },
    {
      id: "payment-setup",
      title: "Payment Setup",
      description: "Configure payment methods and QR codes",
      icon: QrCode,
      completed: completedSteps.includes("payment-setup"),
      current: currentStep === 5
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, steps[currentStep].id]);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete wizard
      setCompletedSteps([...completedSteps, steps[currentStep].id]);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= completedSteps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const progress = ((completedSteps.length + (steps[currentStep].current ? 0 : 1)) / steps.length) * 100;

  const StepContent = ({ step }: { step: WizardStep }) => {
    switch (step.id) {
      case "create-tenant":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UserPlus className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Create New Tenant</h3>
              <p className="text-muted-foreground mb-6">
                Add a new tenant and create their user account for portal access
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <label className="text-sm">Create user account</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="text-blue-800">
                      ✓ Tenant will receive login credentials
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "assign-unit":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Home className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Assign Unit</h3>
              <p className="text-muted-foreground mb-6">
                Select property and unit for the tenant
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Property *</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Units</label>
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rent Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rent Amount (₹) *</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lease Start</label>
                      <div className="h-10 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lease End</label>
                      <div className="h-10 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "family-details":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Family Details</h3>
              <p className="text-muted-foreground mb-6">
                Add family members for emergency contacts
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Family Members</CardTitle>
                <CardDescription>
                  Add family members who will be living with the tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Family Members Added</span>
                  <Badge variant="outline">0</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No family members added yet</p>
                    <Button>
                      <Users className="w-4 h-4 mr-2" />
                      Add Family Member
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded text-sm">
                  <p className="text-blue-800">
                    <strong>Note:</strong> Family members are important for emergency contacts and communication.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "meter-reading":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Meter Reading</h3>
              <p className="text-muted-foreground mb-6">
                Record initial meter readings for utilities
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Electricity Meter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Initial Reading</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit Rate (₹/unit)</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reading Date</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Water Meter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Initial Reading</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit Rate (₹/kl)</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="bg-yellow-50 p-3 rounded text-sm">
                    <p className="text-yellow-800">
                      <strong>Optional:</strong> Water meter can be added later
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "generate-bills":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Generate Initial Bills</h3>
              <p className="text-muted-foreground mb-6">
                Create initial rent and utility bills
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bill Generation</CardTitle>
                <CardDescription>
                  Generate initial bills for the tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <p className="font-medium">Rent Bill</p>
                      <p className="text-sm text-muted-foreground">Monthly rent charges</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Ready</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <p className="font-medium">Electricity Bill</p>
                      <p className="text-sm text-muted-foreground">Based on meter reading</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <p className="font-medium">Maintenance Fee</p>
                      <p className="text-sm text-muted-foreground">Building maintenance charges</p>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800">Optional</Badge>
                  </div>
                </div>
                
                <Button className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Bills
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "payment-setup":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Payment Setup</h3>
              <p className="text-muted-foreground mb-6">
                Configure payment methods and QR codes
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">QR Code Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 p-4 rounded">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">QR Code System Ready</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Tenants can pay via QR code with manual verification
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">UPI ID</label>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="text-blue-800">
                      <strong>Setup Complete:</strong> QR payment system is ready to use
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">QR Code Payments</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Manual Recording</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Online Gateway</span>
                      <Badge className="bg-gray-100 text-gray-800">Coming Soon</Badge>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded text-sm">
                    <p className="text-purple-800">
                      <strong>Next:</strong> Tenant can start paying immediately
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tenant Setup Wizard</h2>
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                step.current
                  ? "bg-primary text-primary-foreground"
                  : step.completed
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              disabled={index > completedSteps.length}
            >
              <step.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{step.title}</span>
              {step.completed && !step.current && (
                <CheckCircle className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <StepContent step={steps[currentStep]} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button onClick={handleNext}>
          {currentStep === steps.length - 1 ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Setup
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
