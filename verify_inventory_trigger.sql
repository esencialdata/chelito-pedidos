-- Test Script for Inventory Trigger
-- Run this AFTER applying inventory_trigger.sql

DO $$
DECLARE
    supp_id uuid;
    prod_id uuid;
    order_id uuid;
    initial_stock numeric := 100;
    deduct_amount numeric := 2.5; -- 0.250kg * 10 
    final_stock numeric;
BEGIN
    -- 1. Setup Test Data
    INSERT INTO supplies (name, current_cost, unit, current_stock) 
    VALUES ('Harina Test', 10, 'kg', initial_stock) 
    RETURNING id INTO supp_id;

    INSERT INTO products (name, sale_price, production_cost) 
    VALUES ('Pan Test', 20, 5) 
    RETURNING id INTO prod_id;

    INSERT INTO recipes (product_id, supply_id, quantity, unit)
    VALUES (prod_id, supp_id, 0.250, 'kg'); -- 250g per bread

    -- Create Pending Order (2 items)
    INSERT INTO orders (items, delivery_date, status, total_amount)
    VALUES (
        jsonb_build_array(jsonb_build_object('product', 'Pan Test', 'quantity', 10)),
        now(),
        'PENDIENTE',
        200
    )
    RETURNING id INTO order_id;

    RAISE NOTICE 'Test Data Created. Supply Stock: %', initial_stock;

    -- 2. TEST DEDUCTION (Pending -> Entregado)
    UPDATE orders SET status = 'ENTREGADO' WHERE id = order_id;
    
    -- Verify
    SELECT current_stock INTO final_stock FROM supplies WHERE id = supp_id;
    RAISE NOTICE 'After Delivery (Expected 97.5): %', final_stock;
    
    IF final_stock = 97.5 THEN
        RAISE NOTICE '✅ TEST 1 PASSED: Deduction worked.';
    ELSE
        RAISE NOTICE '❌ TEST 1 FAILED: Stock is %', final_stock;
    END IF;

    -- 3. TEST ROLLBACK (Entregado -> Cancelado)
    UPDATE orders SET status = 'CANCELADO' WHERE id = order_id;

    -- Verify
    SELECT current_stock INTO final_stock FROM supplies WHERE id = supp_id;
    RAISE NOTICE 'After Cancellation (Expected 100): %', final_stock;

    IF final_stock = 100 THEN
        RAISE NOTICE '✅ TEST 2 PASSED: Rollback worked.';
    ELSE
        RAISE NOTICE '❌ TEST 2 FAILED: Stock is %', final_stock;
    END IF;

    -- Cleanup
    DELETE FROM recipes WHERE product_id = prod_id;
    DELETE FROM orders WHERE id = order_id;
    DELETE FROM products WHERE id = prod_id;
    DELETE FROM supplies WHERE id = supp_id;
    
    RAISE NOTICE 'Cleaned up test data.';
END $$;
