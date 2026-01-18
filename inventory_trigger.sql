-- Migration: Add Inventory Deduction Logic
-- Run this in your Supabase SQL Editor

-- 1. Add tracking column to orders if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_deducted boolean DEFAULT false;

-- 2. Create the Function
CREATE OR REPLACE FUNCTION manage_inventory_on_order_change()
RETURNS TRIGGER AS $$
DECLARE
    order_item jsonb;
    item_product_name text;
    item_quantity numeric;
    
    prod_id uuid;
    
    rec record;
    recipe_quantity numeric;
    supply_id uuid;
    
    calculated_deduction numeric;
BEGIN
    -- Logging context (visible in Supabase logs)
    RAISE NOTICE 'Trigger manage_inventory for Order % Status: % (Old Status: %, Deducted: %)', 
        NEW.id, NEW.status, OLD.status, OLD.inventory_deducted;

    -- CASE 1: DEDUCTION (Venta Cerrada)
    -- Trigger when status becomes 'ENTREGADO' and we haven't deducted yet
    IF (NEW.status = 'ENTREGADO' AND (OLD.inventory_deducted IS DISTINCT FROM true)) THEN
        
        RAISE NOTICE 'Starting Inventory Deduction for Order %', NEW.id;
        
        -- Loop through items in the JSON array
        -- Expected JSON structure: [{"product": "Name", "quantity": 1}, ...]
        FOR order_item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            item_product_name := order_item->>'product';
            item_quantity := (order_item->>'quantity')::numeric;
            
            -- Find Product ID by Name (Case Insensitive Match)
            SELECT id INTO prod_id FROM products WHERE lower(name) = lower(item_product_name) LIMIT 1;
            
            IF prod_id IS NOT NULL THEN
                -- Find all ingredients (recipes) for this product
                FOR rec IN SELECT * FROM recipes WHERE product_id = prod_id
                LOOP
                    recipe_quantity := rec.quantity;
                    supply_id := rec.supply_id;
                    
                    calculated_deduction := recipe_quantity * item_quantity;
                    
                    -- Update Supply Stock
                    UPDATE supplies 
                    SET current_stock = current_stock - calculated_deduction,
                        updated_at = now()
                    WHERE id = supply_id;
                    
                    RAISE NOTICE 'Deducted % from Supply % for Product %', calculated_deduction, supply_id, item_product_name;
                END LOOP;
            ELSE
                RAISE NOTICE 'Product not found for deduction: %', item_product_name;
            END IF;
        END LOOP;

        -- Mark as deducted to prevent double counting
        -- We update the specific row. NOTE: In an AFTER trigger, we must execute a separate UPDATE statement.
        -- To avoid infinite recursion, we only update if the value is changing (which we checked in IF).
        UPDATE orders SET inventory_deducted = true WHERE id = NEW.id;
        
    -- CASO 2: ROLLBACK (Corrección de Error)
    -- Trigger if status is NO LONGER 'ENTREGADO' (e.g., Cancelled or moved back to Pending)
    -- AND it was previously deducted.
    ELSIF (NEW.status <> 'ENTREGADO' AND OLD.inventory_deducted = true) THEN
        
        RAISE NOTICE 'Starting Inventory Rollback for Order %', NEW.id;

        -- Loop through items to ADD BACK
        FOR order_item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            item_product_name := order_item->>'product';
            item_quantity := (order_item->>'quantity')::numeric;
            
            SELECT id INTO prod_id FROM products WHERE lower(name) = lower(item_product_name) LIMIT 1;
            
            IF prod_id IS NOT NULL THEN
                FOR rec IN SELECT * FROM recipes WHERE product_id = prod_id
                LOOP
                    recipe_quantity := rec.quantity;
                    supply_id := rec.supply_id;
                    
                    calculated_deduction := recipe_quantity * item_quantity;
                    
                    -- Restore Supply Stock
                    UPDATE supplies 
                    SET current_stock = current_stock + calculated_deduction,
                        updated_at = now()
                    WHERE id = supply_id;
                    
                    RAISE NOTICE 'Restored % to Supply % for Product %', calculated_deduction, supply_id, item_product_name;
                END LOOP;
            END IF;
        END LOOP;

        -- Mark as NOT deducted
        UPDATE orders SET inventory_deducted = false WHERE id = NEW.id;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS trg_manage_inventory ON orders;

CREATE TRIGGER trg_manage_inventory
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION manage_inventory_on_order_change();
