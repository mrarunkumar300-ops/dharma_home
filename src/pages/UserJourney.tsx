import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Calendar, 
  FileText, 
  CreditCard, 
  Home, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Star,
  MessageSquare,
  Settings
} from "lucide-react";

const UserJourney = () => {
  const journeySteps = [
    {
      id: 1,
      title: "Property Discovery",
      description: "Browse and find your ideal property",
      icon: MapPin,
      status: "completed",
      progress: 100,
      actions: ["View Properties", "Save Favorites", "Compare Options"]
    },
    {
      id: 2,
      title: "Application Process",
      description: "Submit your rental application",
      icon: FileText,
      status: "completed", 
      progress: 100,
      actions: ["Complete Application", "Upload Documents", "Background Check"]
    },
    {
      id: 3,
      title: "Lease Agreement",
      description: "Review and sign your lease",
      icon: CreditCard,
      status: "in_progress",
      progress: 75,
      actions: ["Review Terms", "Sign Lease", "Pay Security Deposit"]
    },
    {
      id: 4,
      title: "Move-In Ready",
      description: "Prepare for your move",
      icon: Home,
      status: "pending",
      progress: 0,
      actions: ["Schedule Move-In", "Utilities Setup", "Change Address"]
    },
    {
      id: 5,
      title: "Settle In",
      description: "Get comfortable in your new home",
      icon: Users,
      status: "pending",
      progress: 0,
      actions: ["Meet Neighbors", "Explore Area", "Join Community"]
    }
  ];

  const recentActivities = [
    {
      title: "Application Approved",
      description: "Your rental application has been approved",
      time: "2 hours ago",
      type: "success",
      icon: CheckCircle
    },
    {
      title: "Document Uploaded",
      description: "Proof of income successfully uploaded",
      time: "1 day ago", 
      type: "info",
      icon: FileText
    },
    {
      title: "Payment Processed",
      description: "Application fee payment confirmed",
      time: "2 days ago",
      type: "success",
      icon: CreditCard
    }
  ];

  const upcomingTasks = [
    {
      title: "Sign Lease Agreement",
      description: "Review and electronically sign your lease",
      dueDate: "Due in 2 days",
      priority: "high",
      icon: FileText
    },
    {
      title: "Pay Security Deposit",
      description: "Complete security deposit payment",
      dueDate: "Due in 3 days", 
      priority: "high",
      icon: CreditCard
    },
    {
      title: "Schedule Move-In",
      description: "Choose your preferred move-in date",
      dueDate: "Due in 1 week",
      priority: "medium",
      icon: Calendar
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50";
      case "in_progress": return "text-blue-600 bg-blue-50";
      case "pending": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "in_progress": return Clock;
      case "pending": return AlertCircle;
      default: return AlertCircle;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Journey</h1>
          <p className="text-muted-foreground mt-1">Track your progress from application to move-in</p>
        </div>

        {/* Journey Progress Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Journey Completion</span>
                <span className="text-sm text-muted-foreground">55%</span>
              </div>
              <Progress value={55} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You're making great progress! 2 of 5 major steps completed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Journey Steps */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Journey Steps</h2>
          <div className="grid gap-4">
            {journeySteps.map((step, index) => {
              const StatusIcon = getStatusIcon(step.status);
              const StepIcon = step.icon;
              
              return (
                <Card key={step.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                          <StepIcon className="w-6 h-6" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={step.status === 'completed' ? 'default' : step.status === 'in_progress' ? 'secondary' : 'outline'}>
                              {step.status.replace('_', ' ')}
                            </Badge>
                            <StatusIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                        
                        {step.progress > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">Progress</span>
                              <span className="text-xs text-muted-foreground">{step.progress}%</span>
                            </div>
                            <Progress value={step.progress} className="h-1" />
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {step.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              disabled={step.status === 'pending'}
                            >
                              {action}
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {index < journeySteps.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-border -z-10" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => {
                  const TaskIcon = task.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <TaskIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${
                            task.priority === 'high' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {task.dueDate}
                          </span>
                          <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => {
                  const ActivityIcon = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <ActivityIcon className={`w-4 h-4 ${
                          activity.type === 'success' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                <span className="text-sm">Contact Support</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-sm">View Documentation</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">Community Forum</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserJourney;
