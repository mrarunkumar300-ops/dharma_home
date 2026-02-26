-- Trigger to stay units_count and occupied_count in sync
CREATE OR REPLACE FUNCTION public.sync_property_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.properties
        SET 
            units_count = (SELECT count(*) FROM public.units WHERE property_id = NEW.property_id),
            occupied_count = (SELECT count(*) FROM public.units WHERE property_id = NEW.property_id AND availability = 'occupied'),
            revenue = (SELECT COALESCE(SUM(rent), 0) FROM public.units WHERE property_id = NEW.property_id AND availability = 'occupied')
        WHERE id = NEW.property_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE public.properties
        SET 
            units_count = (SELECT count(*) FROM public.units WHERE property_id = NEW.property_id),
            occupied_count = (SELECT count(*) FROM public.units WHERE property_id = NEW.property_id AND availability = 'occupied'),
            revenue = (SELECT COALESCE(SUM(rent), 0) FROM public.units WHERE property_id = NEW.property_id AND availability = 'occupied')
        WHERE id = NEW.property_id;
        
        -- If property_id changed, update the old property too
        IF (OLD.property_id <> NEW.property_id) THEN
            UPDATE public.properties
            SET 
                units_count = (SELECT count(*) FROM public.units WHERE property_id = OLD.property_id),
                occupied_count = (SELECT count(*) FROM public.units WHERE property_id = OLD.property_id AND availability = 'occupied'),
                revenue = (SELECT COALESCE(SUM(rent), 0) FROM public.units WHERE property_id = OLD.property_id AND availability = 'occupied')
            WHERE id = OLD.property_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.properties
        SET 
            units_count = (SELECT count(*) FROM public.units WHERE property_id = OLD.property_id),
            occupied_count = (SELECT count(*) FROM public.units WHERE property_id = OLD.property_id AND availability = 'occupied'),
            revenue = (SELECT COALESCE(SUM(rent), 0) FROM public.units WHERE property_id = OLD.property_id AND availability = 'occupied')
        WHERE id = OLD.property_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to units table
DROP TRIGGER IF EXISTS tr_sync_property_counts ON public.units;
CREATE TRIGGER tr_sync_property_counts
AFTER INSERT OR UPDATE OR DELETE ON public.units
FOR EACH ROW EXECUTE FUNCTION public.sync_property_counts();

-- Initial sync for existing data
UPDATE public.properties p
SET 
    units_count = (SELECT count(*) FROM public.units WHERE property_id = p.id),
    occupied_count = (SELECT count(*) FROM public.units WHERE property_id = p.id AND availability = 'occupied');
