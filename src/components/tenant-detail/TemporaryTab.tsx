import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wrench, AlertTriangle } from "lucide-react"

interface TemporaryTabProps {
  title: string
  description: string
}

export function TemporaryTab({ title, description }: TemporaryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Under Development</p>
            <p className="text-sm text-yellow-600">
              This feature is currently being implemented. Please check back later.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
