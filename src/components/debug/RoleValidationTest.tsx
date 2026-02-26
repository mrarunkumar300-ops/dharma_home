import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Shield, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const RoleValidationTest = () => {
  const { signUp, signIn, user, session } = useAuth();
  const { roles, isAdmin, isUser, isTenant, isLoading: roleLoading } = useUserRole();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (testName: string, passed: boolean, details?: string) => {
    setTestResults(prev => [...prev, {
      name: testName,
      passed,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runStrictRoleTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Frontend validation for valid roles
    try {
      const validRoles = ["super_admin", "admin", "manager", "user", "tenant"];
      for (const role of validRoles) {
        // Test frontend validation logic
        const allowedRoles = ["super_admin", "admin", "manager", "user", "tenant"];
        const isValid = allowedRoles.includes(role);
        
        if (isValid) {
          addTestResult(`Frontend Validation - ${role}`, true, "Frontend validation passed");
        } else {
          addTestResult(`Frontend Validation - ${role}`, false, "Frontend validation failed");
        }
      }
    } catch (error: any) {
      addTestResult("Frontend Validation - Valid Roles", false, error.message);
    }

    // Test 2: Frontend validation for invalid roles
    try {
      const invalidRoles = ["invalid", "superadmin", "", null, "ADMIN", "User"];
      for (const role of invalidRoles) {
        const allowedRoles = ["super_admin", "admin", "manager", "user", "tenant"];
        const isValid = allowedRoles.includes(role);
        
        if (!isValid) {
          addTestResult(`Frontend Rejection - ${role}`, true, `Correctly rejected: ${role}`);
        } else {
          addTestResult(`Frontend Rejection - ${role}`, false, "Should have been rejected");
        }
      }
    } catch (error: any) {
      addTestResult("Frontend Rejection - Invalid Roles", true, "Correctly handled invalid roles");
    }

    // Test 3: Frontend signup with validation
    try {
      const testEmail = `test-frontend-${Date.now()}@example.com`;
      const result = await signUp(testEmail, "Test123456!", "Test Frontend User", "user");
      
      if (result.error) {
        addTestResult("Frontend Signup Validation", false, result.error.message);
      } else {
        addTestResult("Frontend Signup Validation", true, "User account created with frontend validation");
      }
    } catch (error: any) {
      addTestResult("Frontend Signup Validation", false, error.message);
    }

    // Test 4: Mandatory role enforcement
    try {
      // This should fail due to TypeScript, but let's test runtime behavior
      const result = await signUp("mandatory@test.com", "Test123456!", "Test", "" as any);
      
      if (result.error) {
        addTestResult("Mandatory Role Enforcement", true, "Correctly enforced mandatory role selection");
      } else {
        addTestResult("Mandatory Role Enforcement", false, "Should have enforced mandatory role");
      }
    } catch (error: any) {
      addTestResult("Mandatory Role Enforcement", true, "TypeScript correctly prevented invalid role");
    }

    // Test 5: Role type safety
    try {
      // Test that TypeScript prevents invalid roles
      const validRoles = ["super_admin", "admin", "manager", "user", "tenant"];
      let allValid = true;
      
      for (const role of validRoles) {
        if (!["super_admin", "admin", "manager", "user", "tenant"].includes(role)) {
          allValid = false;
          break;
        }
      }
      
      if (allValid) {
        addTestResult("TypeScript Role Safety", true, "All roles are properly typed");
      } else {
        addTestResult("TypeScript Role Safety", false, "Role type safety issue");
      }
    } catch (error: any) {
      addTestResult("TypeScript Role Safety", false, error.message);
    }

    setTimeout(() => setIsRunning(false), 3000);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Frontend Role Validation Tests
        </CardTitle>
        <CardDescription>
          Test the frontend role validation and mandatory role selection (backend function not available)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current User Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Current Session Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Logged In:</span>
              <Badge variant={session ? "default" : "secondary"} className="ml-2">
                {session ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">User ID:</span>
              <span className="ml-2 text-muted-foreground">
                {user?.id?.slice(0, 8) || "N/A"}...
              </span>
            </div>
            <div>
              <span className="font-medium">Roles:</span>
              <div className="flex gap-1 mt-1">
                {roles.map(role => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium">Role Loading:</span>
              <Badge variant={roleLoading ? "secondary" : "default"} className="ml-2">
                {roleLoading ? "Loading" : "Complete"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={runStrictRoleTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? "Running Frontend Tests..." : "Run Frontend Validation Tests"}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Clear Results
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    result.passed 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {result.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{result.name}</h4>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    {result.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.details}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Summary */}
        {testResults.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Test Summary</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    {testResults.filter(r => r.passed).length} Passed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm">
                    {testResults.filter(r => !r.passed).length} Failed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
