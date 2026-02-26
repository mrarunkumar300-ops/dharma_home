import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export function TenantTest() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testTenantAPI = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Not authenticated")
        return
      }

      // Test statistics endpoint
      const statsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-management/statistics`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      const statsData = await statsResponse.json()
      
      // Test tenants endpoint
      const tenantsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-management/tenants`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      const tenantsData = await tenantsResponse.json()

      setResults({
        stats: statsData,
        tenants: tenantsData,
        authenticated: true
      })

      toast.success("API test completed successfully")
    } catch (error: any) {
      toast.error("Test failed: " + error.message)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tenant Management API Test</CardTitle>
        <CardDescription>
          Test the tenant management backend endpoints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testTenantAPI} disabled={loading}>
          {loading ? "Testing..." : "Test API"}
        </Button>

        {results && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            
            {results.authenticated && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                ✅ Authenticated successfully
              </div>
            )}

            {results.stats && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium">Statistics Response:</h4>
                <pre className="text-xs mt-2 overflow-auto">
                  {JSON.stringify(results.stats, null, 2)}
                </pre>
              </div>
            )}

            {results.tenants && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium">Tenants Response:</h4>
                <pre className="text-xs mt-2 overflow-auto">
                  {JSON.stringify(results.tenants, null, 2)}
                </pre>
              </div>
            )}

            {results.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="font-medium text-red-800">Error:</h4>
                <p className="text-sm text-red-600">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
