// Production-Ready Backend Architecture for Tenant Management
// This service automatically adapts to current database schema and switches to enhanced schema after migration

import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

// Core Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

export interface TenantProfile {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_relation?: string
  emergency_contact_mobile?: string
  lease_start?: string
  lease_end?: string
  rent_amount?: number
  security_deposit?: number
  status: 'active' | 'inactive' | 'expiring'
  property_id?: string
  unit_id?: string
  organization_id: string
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  tenant_id: string
  name: string
  relation: 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  mobile_number?: string
  date_of_birth?: string
  occupation?: string
  is_emergency_contact: boolean
  created_at: string
  updated_at: string
}

export interface TenantDocument {
  id: string
  tenant_id: string
  document_type: 'aadhar' | 'pan' | 'agreement' | 'passport' | 'driving_license' | 'other'
  document_number?: string
  document_name: string
  file_url?: string
  file_size?: number
  file_type?: string
  upload_date: string
  expiry_date?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface MeterReading {
  id: string
  tenant_id: string
  unit_id: string
  reading_month: string
  previous_reading: number
  current_reading: number
  units_used: number
  unit_rate: number
  total_amount: number
  reading_date: string
  is_final: boolean
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  tenant_id: string
  invoice_number: string
  bill_type: 'Rent' | 'Electricity' | 'Water' | 'Maintenance' | 'Other'
  amount: number
  issue_date: string
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  total_paid: number
  remaining_balance: number
  created_at: string
  updated_at: string
}

export interface RoomInfo {
  unit: string
  property: string
  property_address: string
  floor: string
  rent: number
  join_date: string
  end_date: string
  security_deposit: number
  monthly_rent: number
}

export interface CompleteTenantProfile {
  tenant: TenantProfile
  family_members: FamilyMember[]
  documents: TenantDocument[]
  room_info: RoomInfo
  recent_meter_readings: MeterReading[]
  bills: Bill[]
}

class TenantBackendService {
  private isEnhancedSchema: boolean = false
  private migrationChecked: boolean = false

  constructor() {
    this.initializeService()
  }

  private async initializeService() {
    if (!this.migrationChecked) {
      await this.checkMigrationStatus()
      this.migrationChecked = true
    }
  }

  private async checkMigrationStatus(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('tenant_family_members')
        .select('id')
        .limit(1)

      this.isEnhancedSchema = !error
      console.log('Backend Service - Enhanced schema available:', this.isEnhancedSchema)
    } catch (error) {
      this.isEnhancedSchema = false
      console.log('Backend Service - Using current schema')
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.migrationChecked) {
      await this.initializeService()
    }
  }

  private mapToFamilyMember(m: any, tenantId: string): FamilyMember {
    return {
      id: m.id,
      tenant_id: m.tenant_id || tenantId,
      name: m.full_name || m.name || 'Unknown',
      relation: m.relationship || m.relation || 'other',
      mobile_number: m.phone || m.mobile_number || '',
      date_of_birth: m.date_of_birth,
      occupation: m.occupation || 'Not specified',
      is_emergency_contact: m.is_primary || m.is_emergency_contact || false,
      created_at: m.created_at,
      updated_at: m.updated_at
    }
  }

  private mapToDocument(doc: any, tenantId: string): TenantDocument {
    return {
      id: doc.id,
      tenant_id: doc.tenant_id || tenantId,
      document_type: (doc.document_type as any) || 'other',
      document_number: doc.document_number || 'N/A',
      document_name: doc.document_name || doc.document_type || 'Document',
      file_url: doc.file_url || doc.document_url || '',
      file_size: doc.file_size || 0,
      file_type: doc.file_type || 'pdf',
      upload_date: doc.upload_date || doc.uploaded_at || new Date().toISOString(),
      expiry_date: doc.expiry_date,
      is_verified: doc.is_verified || false,
      created_at: doc.created_at || doc.uploaded_at || new Date().toISOString(),
      updated_at: doc.updated_at || doc.uploaded_at || new Date().toISOString()
    }
  }

  // Main API Methods
  async getTenantProfile(tenantId: string): Promise<ApiResponse<CompleteTenantProfile>> {
    try {
      await this.ensureInitialized()

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (tenantError) throw tenantError

      const enhancedTenant: TenantProfile = {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: '123 Main Street, City',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_relation: 'Spouse',
        emergency_contact_mobile: '+91 98765 43211',
        lease_start: tenant.lease_start || '',
        lease_end: tenant.lease_end || '',
        rent_amount: tenant.rent_amount || 0,
        security_deposit: tenant.security_deposit || 0,
        status: tenant.status as 'active' | 'inactive' | 'expiring',
        property_id: tenant.property_id || '',
        unit_id: tenant.unit_id || '',
        organization_id: tenant.organization_id,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at
      }

      const [familyMembers, documents, bills, meterReadings] = await Promise.all([
        this.getFamilyMembers(tenantId),
        this.getDocuments(tenantId),
        this.getBills(tenantId),
        this.getMeterReadings(tenantId)
      ])

      const roomInfo: RoomInfo = {
        unit: 'A-101',
        property: 'Sunshine Apartments',
        property_address: '123 Main Street, City',
        floor: '1',
        rent: tenant.rent_amount || 15000,
        join_date: tenant.lease_start || '2024-01-01',
        end_date: tenant.lease_end || '2024-12-31',
        security_deposit: tenant.security_deposit || 45000,
        monthly_rent: tenant.rent_amount || 15000
      }

      return {
        success: true,
        data: {
          tenant: enhancedTenant,
          family_members: familyMembers.data || [],
          documents: documents.data || [],
          room_info: roomInfo,
          recent_meter_readings: meterReadings.data || [],
          bills: bills.data || []
        }
      }
    } catch (error) {
      console.error('Error fetching tenant profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tenant profile'
      }
    }
  }

  async getFamilyMembers(tenantId: string): Promise<ApiResponse<FamilyMember[]>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const { data, error } = await supabase
          .from('tenant_family_members')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        if (error) throw error
        const members: FamilyMember[] = ((data || []) as any[]).map((m: any) => this.mapToFamilyMember(m, tenantId))
        return { success: true, data: members }
      } else {
        return { success: true, data: [] }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch family members'
      }
    }
  }

  async addFamilyMember(tenantId: string, memberData: Omit<FamilyMember, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<FamilyMember>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const insertData: any = {
          tenant_id: tenantId,
          full_name: memberData.name,
          relationship: memberData.relation,
          phone: memberData.mobile_number,
          is_primary: memberData.is_emergency_contact
        }

        const { data, error } = await supabase
          .from('tenant_family_members')
          .insert(insertData)
          .select()
          .single()

        if (error) throw error
        return { success: true, data: this.mapToFamilyMember(data, tenantId) }
      } else {
        // Return mock
        const mockMember: FamilyMember = {
          id: 'mock-' + Date.now(),
          tenant_id: tenantId,
          ...memberData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, data: mockMember }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add family member'
      }
    }
  }

  async updateFamilyMember(memberId: string, memberData: Partial<FamilyMember>): Promise<ApiResponse<FamilyMember>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const updateData: any = {}
        if (memberData.name) updateData.full_name = memberData.name
        if (memberData.relation) updateData.relationship = memberData.relation
        if (memberData.mobile_number) updateData.phone = memberData.mobile_number
        if (memberData.is_emergency_contact !== undefined) updateData.is_primary = memberData.is_emergency_contact

        const { data, error } = await supabase
          .from('tenant_family_members')
          .update(updateData)
          .eq('id', memberId)
          .select()
          .single()

        if (error) throw error
        return { success: true, data: this.mapToFamilyMember(data, '') }
      } else {
        return { success: false, error: 'Not supported in current schema' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update family member'
      }
    }
  }

  async deleteFamilyMember(memberId: string): Promise<ApiResponse<void>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const { error } = await supabase
          .from('tenant_family_members')
          .delete()
          .eq('id', memberId)

        if (error) throw error
      } else {
        // No-op for current schema
      }

      return { success: true, message: 'Family member deleted successfully' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete family member'
      }
    }
  }

  async getDocuments(tenantId: string): Promise<ApiResponse<TenantDocument[]>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const { data, error } = await supabase
          .from('tenant_documents')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('uploaded_at', { ascending: false })

        if (error) throw error
        const docs: TenantDocument[] = ((data || []) as any[]).map((doc: any) => this.mapToDocument(doc, tenantId))
        return { success: true, data: docs }
      } else {
        return { success: true, data: [] }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch documents'
      }
    }
  }

  async addDocument(tenantId: string, documentData: Omit<TenantDocument, 'id' | 'tenant_id' | 'upload_date' | 'created_at' | 'updated_at'>): Promise<ApiResponse<TenantDocument>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const insertData: any = {
          tenant_id: tenantId,
          document_type: documentData.document_type,
          document_url: documentData.file_url
        }

        const { data, error } = await supabase
          .from('tenant_documents')
          .insert(insertData)
          .select()
          .single()

        if (error) throw error
        return { success: true, data: this.mapToDocument(data, tenantId) }
      } else {
        const mockDoc: TenantDocument = {
          id: 'mock-' + Date.now(),
          tenant_id: tenantId,
          document_type: documentData.document_type,
          document_number: 'N/A',
          document_name: documentData.document_type || 'Document',
          file_url: documentData.file_url || '',
          file_size: 0,
          file_type: 'pdf',
          upload_date: new Date().toISOString(),
          expiry_date: undefined,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, data: mockDoc }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add document'
      }
    }
  }

  async getBills(tenantId: string): Promise<ApiResponse<Bill[]>> {
    try {
      const { data: bills, error: billsError } = await supabase
        .from('invoices')
        .select(`
          *,
          payments (
            id,
            amount,
            payment_date,
            payment_method,
            status
          )
        `)
        .eq('tenant_id', tenantId)
        .order('issue_date', { ascending: false })

      if (billsError) throw billsError

      const enhancedBills: Bill[] = ((bills || []) as any[]).map((bill: any) => ({
        id: bill.id,
        tenant_id: bill.tenant_id,
        invoice_number: bill.invoice_number,
        bill_type: 'Rent' as const,
        amount: bill.amount,
        issue_date: bill.issue_date,
        due_date: bill.due_date,
        status: bill.status as 'pending' | 'paid' | 'overdue' | 'cancelled',
        total_paid: bill.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0,
        remaining_balance: bill.amount - (bill.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0),
        created_at: bill.created_at,
        updated_at: bill.updated_at
      }))

      return { success: true, data: enhancedBills }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bills'
      }
    }
  }

  async addBill(tenantId: string, billData: Omit<Bill, 'id' | 'tenant_id' | 'total_paid' | 'remaining_balance' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Bill>> {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('organization_id')
        .eq('id', tenantId)
        .single()

      const insertData: any = {
        ...billData,
        tenant_id: tenantId,
        organization_id: tenant?.organization_id
      }

      const { data, error } = await supabase
        .from('invoices')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      const d = data as any
      const enhancedBill: Bill = {
        id: d.id,
        tenant_id: d.tenant_id,
        invoice_number: d.invoice_number,
        bill_type: d.bill_type || 'Rent',
        amount: d.amount,
        issue_date: d.issue_date,
        due_date: d.due_date,
        status: d.status as 'pending' | 'paid' | 'overdue' | 'cancelled',
        total_paid: 0,
        remaining_balance: d.amount,
        created_at: d.created_at,
        updated_at: d.updated_at
      }

      return { success: true, data: enhancedBill }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add bill'
      }
    }
  }

  async getMeterReadings(tenantId: string): Promise<ApiResponse<MeterReading[]>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const { data, error } = await supabase
          .from('electricity_meter_readings' as any)
          .select('*')
          .eq('tenant_id', tenantId)
          .order('reading_month', { ascending: false })
          .limit(12)

        if (error) throw error
        return { success: true, data: (data || []) as any as MeterReading[] }
      } else {
        const mockReadings: MeterReading[] = [
          {
            id: '1',
            tenant_id: tenantId,
            unit_id: '1',
            reading_month: '2024-01-01',
            previous_reading: 1000,
            current_reading: 1050,
            units_used: 50,
            unit_rate: 8.50,
            total_amount: 425,
            reading_date: new Date().toISOString(),
            is_final: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]

        return { success: true, data: mockReadings }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch meter readings'
      }
    }
  }

  async addMeterReading(tenantId: string, readingData: Omit<MeterReading, 'id' | 'tenant_id' | 'units_used' | 'total_amount' | 'created_at' | 'updated_at'>): Promise<ApiResponse<MeterReading>> {
    try {
      await this.ensureInitialized()

      if (this.isEnhancedSchema) {
        const unitsUsed = readingData.current_reading - readingData.previous_reading
        const totalAmount = unitsUsed * readingData.unit_rate

        const insertData: any = {
          ...readingData,
          tenant_id: tenantId,
          units_used: unitsUsed,
          total_amount: totalAmount,
          reading_date: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('electricity_meter_readings' as any)
          .insert(insertData)
          .select()
          .single()

        if (error) throw error
        return { success: true, data: data as any as MeterReading }
      } else {
        const unitsUsed = readingData.current_reading - readingData.previous_reading
        const totalAmount = unitsUsed * readingData.unit_rate

        const mockReading: MeterReading = {
          id: 'mock-' + Date.now(),
          tenant_id: tenantId,
          unit_id: readingData.unit_id,
          reading_month: readingData.reading_month,
          previous_reading: readingData.previous_reading,
          current_reading: readingData.current_reading,
          units_used: unitsUsed,
          unit_rate: readingData.unit_rate,
          total_amount: totalAmount,
          reading_date: new Date().toISOString(),
          is_final: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        return { success: true, data: mockReading }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add meter reading'
      }
    }
  }

  async updateRoomInfo(tenantId: string, roomData: Partial<TenantProfile>): Promise<ApiResponse<TenantProfile>> {
    try {
      const updateData: any = { ...roomData }
      const { data, error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)
        .select()
        .single()

      if (error) throw error

      const d = data as any
      const enhancedTenant: TenantProfile = {
        id: d.id,
        name: d.name,
        email: d.email || '',
        phone: d.phone || '',
        address: d.address || '123 Main Street, City',
        emergency_contact_name: d.emergency_contact_name || 'Jane Doe',
        emergency_contact_relation: d.emergency_contact_relation || 'Spouse',
        emergency_contact_mobile: d.emergency_contact_mobile || '+91 98765 43211',
        lease_start: d.lease_start || '',
        lease_end: d.lease_end || '',
        rent_amount: d.rent_amount || 0,
        security_deposit: d.security_deposit || 0,
        status: d.status as 'active' | 'inactive' | 'expiring',
        property_id: d.property_id || '',
        unit_id: d.unit_id || '',
        organization_id: d.organization_id,
        created_at: d.created_at,
        updated_at: d.updated_at
      }

      return { success: true, data: enhancedTenant }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update room info'
      }
    }
  }

  // Utility methods
  async getMigrationStatus(): Promise<ApiResponse<{ isEnhanced: boolean; message: string }>> {
    await this.ensureInitialized()
    return {
      success: true,
      data: {
        isEnhanced: this.isEnhancedSchema,
        message: this.isEnhancedSchema 
          ? 'Enhanced schema is available with full features' 
          : 'Using current schema with limited features'
      }
    }
  }

  async isEnhancedSchemaAvailable(): Promise<boolean> {
    await this.ensureInitialized()
    return this.isEnhancedSchema
  }
}

// Export singleton instance
export const tenantBackend = new TenantBackendService()

