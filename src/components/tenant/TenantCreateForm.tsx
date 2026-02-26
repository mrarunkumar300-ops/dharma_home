import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

const tenantSchema = z.object({
  user_id: z.string().uuid("Valid user ID is required"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  id_proof_type: z.string().optional(),
  id_proof_url: z.string().url().optional().or(z.literal("")),
  profile_photo_url: z.string().url().optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
})

type TenantFormData = z.infer<typeof tenantSchema>

interface TenantCreateFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function TenantCreateForm({ onSuccess, onCancel }: TenantCreateFormProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      address: "",
      id_proof_type: "",
      id_proof_url: "",
      profile_photo_url: "",
      date_of_birth: "",
      gender: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  })

  // Fetch users without tenant profiles
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true)
      
      // Get users with tenant role who don't have tenant profiles yet
      const { data: tenantUsers, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          user_roles!inner(role)
        `)
        .eq("user_roles.role", "tenant")

      if (error) throw error

      setUsers(tenantUsers || [])
    } catch (error: any) {
      toast.error("Failed to fetch available users: " + error.message)
    } finally {
      setLoadingUsers(false)
    }
  }

  const onSubmit = async (data: TenantFormData) => {
    try {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-management/tenants`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create tenant")
      }

      const result = await response.json()
      toast.success("Tenant created successfully!")
      form.reset()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId)
    if (selectedUser) {
      form.setValue("user_id", userId)
      form.setValue("email", selectedUser.email)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Tenant</CardTitle>
        <CardDescription>
          Add a new tenant to the system. Fill in all the required information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to create tenant profile for" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Loading users...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No available users found
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchAvailableUsers}
                disabled={loadingUsers}
              >
                {loadingUsers ? "Loading..." : "Refresh Users"}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tenant's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="tenant@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter complete address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="id_proof_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Proof Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aadhar">Aadhar Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                        <SelectItem value="voter_id">Voter ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_proof_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Proof URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/id-proof.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="profile_photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/photo.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Emergency contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Tenant"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
