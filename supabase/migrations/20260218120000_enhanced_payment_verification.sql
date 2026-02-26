-- Enhanced function to get pending QR payments with full relational data
CREATE OR REPLACE FUNCTION public.get_pending_qr_payments_enhanced()
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    tenant_name TEXT,
    tenant_email TEXT,
    tenant_phone TEXT,
    tenant_code TEXT,
    property_name TEXT,
    unit_number TEXT,
    bill_ids TEXT[],
    bill_details JSONB,
    amount NUMERIC,
    payment_reference TEXT,
    status TEXT,
    payment_screenshot_url TEXT,
    verification_notes TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    time_ago TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qr.id,
        qr.tenant_id,
        tp.full_name as tenant_name,
        tp.email as tenant_email,
        tp.phone as tenant_phone,
        tp.tenant_code,
        p.name as property_name,
        u.unit_number,
        qr.bill_ids,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', tb.id,
                    'bill_type', tb.bill_type,
                    'bill_number', tb.bill_number,
                    'amount', tb.amount,
                    'due_date', tb.due_date,
                    'bill_period_start', tb.bill_period_start,
                    'bill_period_end', tb.bill_period_end,
                    'status', tb.status
                )
            )
            FROM public.tenant_bills tb
            WHERE tb.id = ANY(qr.bill_ids)
        ) as bill_details,
        qr.amount,
        qr.payment_reference,
        qr.status,
        qr.payment_screenshot_url,
        qr.verification_notes,
        qr.created_at,
        qr.expires_at,
        CASE 
            WHEN qr.created_at > now() - interval '1 hour' THEN 'Just now'
            WHEN qr.created_at > now() - interval '24 hours' THEN floor(extract(epoch from (now() - qr.created_at))/3600) || ' hours ago'
            ELSE floor(extract(epoch from (now() - qr.created_at))/86400) || ' days ago'
        END as time_ago
    FROM public.tenant_qr_payments qr
    JOIN public.tenants_profile tp ON qr.tenant_id = tp.id
    LEFT JOIN public.tenant_rooms tr ON tr.tenant_id = tp.id AND tr.status = 'active'
    LEFT JOIN public.properties p ON tr.property_id = p.id
    LEFT JOIN public.units u ON tr.unit_id = u.id
    WHERE qr.status = 'pending'
    ORDER BY qr.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pending_qr_payments_enhanced TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_pending_qr_payments_enhanced IS 'Get all pending QR payments with full relational data including tenant, property, and bill details';
