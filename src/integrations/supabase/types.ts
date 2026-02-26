export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          organization_id: string
          property_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          organization_id: string
          property_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          organization_id?: string
          property_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          organization_id: string
          payment_date: string | null
          payment_method: string | null
          status: string
          tenant_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          organization_id: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          tenant_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          organization_id?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          tenant_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          id: string
          organization_id: string
          priority: string
          property_id: string | null
          status: string
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          priority?: string
          property_id?: string | null
          status?: string
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          priority?: string
          property_id?: string | null
          status?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          frequency: string
          id: string
          in_app_enabled: boolean
          notification_type: string
          push_enabled: boolean
          sms_enabled: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          frequency?: string
          id?: string
          in_app_enabled?: boolean
          notification_type: string
          push_enabled?: boolean
          sms_enabled?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          frequency?: string
          id?: string
          in_app_enabled?: boolean
          notification_type?: string
          push_enabled?: boolean
          sms_enabled?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_price: number | null
          plan_valid_until: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_price?: number | null
          plan_valid_until?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_price?: number | null
          plan_valid_until?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          gateway_provider: string
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          payment_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          gateway_provider: string
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          payment_id?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          gateway_provider?: string
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          payment_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          custom_id: string | null
          email: string | null
          id: string
          image_emoji: string | null
          mobile: string | null
          name: string
          notes: string | null
          occupied_count: number
          organization_id: string
          owner_name: string | null
          revenue: number | null
          status: string
          units_count: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          custom_id?: string | null
          email?: string | null
          id?: string
          image_emoji?: string | null
          mobile?: string | null
          name: string
          notes?: string | null
          occupied_count?: number
          organization_id: string
          owner_name?: string | null
          revenue?: number | null
          status?: string
          units_count?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          custom_id?: string | null
          email?: string | null
          id?: string
          image_emoji?: string | null
          mobile?: string | null
          name?: string
          notes?: string | null
          occupied_count?: number
          organization_id?: string
          owner_name?: string | null
          revenue?: number | null
          status?: string
          units_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_bills: {
        Row: {
          amount: number
          bill_document_url: string | null
          bill_number: string | null
          bill_period_end: string
          bill_period_start: string
          bill_type: string
          created_at: string
          due_date: string
          id: string
          payment_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          bill_document_url?: string | null
          bill_number?: string | null
          bill_period_end: string
          bill_period_start: string
          bill_type: string
          created_at?: string
          due_date: string
          id?: string
          payment_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bill_document_url?: string | null
          bill_number?: string | null
          bill_period_end?: string
          bill_period_start?: string
          bill_type?: string
          created_at?: string
          due_date?: string
          id?: string
          payment_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_bills_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_complaints: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          image_urls: string[] | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          image_urls?: string[] | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_urls?: string[] | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_complaints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_documents: {
        Row: {
          document_type: string | null
          document_url: string
          id: string
          tenant_id: string
          uploaded_at: string
        }
        Insert: {
          document_type?: string | null
          document_url: string
          id?: string
          tenant_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string | null
          document_url?: string
          id?: string
          tenant_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_family_members: {
        Row: {
          age: number | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          id_proof_type: string | null
          id_proof_url: string | null
          is_primary: boolean | null
          phone: string | null
          photo_url: string | null
          relationship: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          id_proof_type?: string | null
          id_proof_url?: string | null
          is_primary?: boolean | null
          phone?: string | null
          photo_url?: string | null
          relationship: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          id_proof_type?: string | null
          id_proof_url?: string | null
          is_primary?: boolean | null
          phone?: string | null
          photo_url?: string | null
          relationship?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_family_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_notifications: {
        Row: {
          action_text: string | null
          action_url: string | null
          channels: string[] | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string | null
          metadata: Json | null
          priority: string
          read_at: string | null
          sent_at: string | null
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          channels?: string[] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          sent_at?: string | null
          tenant_id: string
          title: string
          type?: string
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          channels?: string[] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          sent_at?: string | null
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_methods: {
        Row: {
          created_at: string
          gateway_customer_id: string | null
          gateway_payment_method_id: string | null
          id: string
          is_active: boolean
          is_default: boolean
          metadata: Json | null
          method_identifier: string
          method_type: string
          provider: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gateway_customer_id?: string | null
          gateway_payment_method_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          method_identifier: string
          method_type: string
          provider: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gateway_customer_id?: string | null
          gateway_payment_method_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          method_identifier?: string
          method_type?: string
          provider?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_records: {
        Row: {
          created_at: string
          description: string | null
          id: string
          payment_id: string
          payment_type: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          payment_id: string
          payment_type: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          payment_id?: string
          payment_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_records_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_payment_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_rooms: {
        Row: {
          agreement_document_url: string | null
          agreement_end_date: string | null
          agreement_start_date: string
          created_at: string
          floor_number: number | null
          id: string
          property_id: string
          rent_amount: number
          room_number: string
          security_deposit: number | null
          status: string
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          agreement_document_url?: string | null
          agreement_end_date?: string | null
          agreement_start_date: string
          created_at?: string
          floor_number?: number | null
          id?: string
          property_id: string
          rent_amount: number
          room_number: string
          security_deposit?: number | null
          status?: string
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          agreement_document_url?: string | null
          agreement_end_date?: string | null
          agreement_start_date?: string
          created_at?: string
          floor_number?: number | null
          id?: string
          property_id?: string
          rent_amount?: number
          room_number?: string
          security_deposit?: number | null
          status?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_rooms_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          create_user_account: boolean | null
          created_at: string
          email: string | null
          id: string
          lease_end: string | null
          lease_start: string | null
          name: string
          organization_id: string
          phone: string | null
          property_id: string | null
          rent_amount: number | null
          security_deposit: number | null
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          create_user_account?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          name: string
          organization_id: string
          phone?: string | null
          property_id?: string | null
          rent_amount?: number | null
          security_deposit?: number | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          create_user_account?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          property_id?: string | null
          rent_amount?: number | null
          security_deposit?: number | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants_profile: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          id: string
          id_proof_type: string | null
          id_proof_url: string | null
          phone: string | null
          profile_photo_url: string | null
          security_deposit: number | null
          status: string
          tenant_code: string
          tenant_record_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          id_proof_type?: string | null
          id_proof_url?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          security_deposit?: number | null
          status?: string
          tenant_code: string
          tenant_record_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          id_proof_type?: string | null
          id_proof_url?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          security_deposit?: number | null
          status?: string
          tenant_code?: string
          tenant_record_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_profile_tenant_record_id_fkey"
            columns: ["tenant_record_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          availability: string
          created_at: string
          id: string
          property_id: string
          rent: number
          room_type: string | null
          status: string | null
          tenant_id: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          availability?: string
          created_at?: string
          id?: string
          property_id: string
          rent?: number
          room_type?: string | null
          status?: string | null
          tenant_id?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          availability?: string
          created_at?: string
          id?: string
          property_id?: string
          rent?: number
          room_type?: string | null
          status?: string | null
          tenant_id?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _action_text?: string
          _action_url?: string
          _message?: string
          _metadata?: Json
          _priority?: string
          _tenant_id: string
          _title: string
          _type: string
        }
        Returns: string
      }
      create_tenant_comprehensive: {
        Args: {
          _address?: string
          _date_of_birth?: string
          _email: string
          _emergency_contact_name?: string
          _emergency_contact_phone?: string
          _full_name: string
          _gender?: string
          _id_proof_type?: string
          _id_proof_url?: string
          _phone?: string
          _profile_photo_url?: string
          _user_id: string
        }
        Returns: string
      }
      generate_tenant_code: { Args: never; Returns: string }
      get_tenant_details: { Args: { _tenant_id: string }; Returns: Json }
      get_tenant_payment_statistics: {
        Args: { _tenant_id: string }
        Returns: Json
      }
      get_tenant_statistics: { Args: never; Returns: Json }
      get_upcoming_payments: {
        Args: { _days_ahead?: number; _tenant_id: string }
        Returns: {
          amount: number
          bill_number: string
          days_until_due: number
          due_date: string
          invoice_id: string
          late_fee: number
        }[]
      }
      get_user_org: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_all_notifications_read: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      update_tenant_status: {
        Args: { _new_status: string; _tenant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "super_admin"
        | "tenant"
        | "staff"
        | "guest"
        | "User"
        | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "super_admin",
        "tenant",
        "staff",
        "guest",
        "User",
        "user",
      ],
    },
  },
} as const
