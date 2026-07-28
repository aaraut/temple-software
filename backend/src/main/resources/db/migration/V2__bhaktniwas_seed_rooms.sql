-- Bhaktniwas Module v4.0 — seed real room inventory after the Phase 1 reset.
-- Numbers/splits as given: BN1 Attached 1-20, NA 21-29; BN2 AC 1-8, Normal 9;
-- BN3 All-AC 1-12 (person-count pricing, base = 2 persons, +Rs 300/person up to 4).
-- Room numbers are prefixed with the block code (e.g. BN1-01) since room_number
-- is globally unique across all blocks.

-- 1) Room categories (upsert — room_category was not truncated in V1).
INSERT INTO room_category (name, description, is_active, pricing_type) VALUES
    ('Attached',     'BN1 attached rooms',      true, 'FIXED'),
    ('Non-Attached', 'BN1 non-attached rooms',  true, 'FIXED'),
    ('AC',           'BN2 AC rooms',            true, 'FIXED'),
    ('Normal',       'BN2 normal rooms',        true, 'FIXED'),
    ('All AC',       'BN3 AC rooms, per-person pricing', true, 'PERSON_COUNT')
ON CONFLICT (name) DO UPDATE SET
    pricing_type = excluded.pricing_type,
    is_active = true;

-- 2) BN1 — Attached, rooms 1-20 — Rs.500/day, max 4 persons, no extra-person surcharge.
INSERT INTO room (room_number, category_id, bhaktniwas_block_id, floor, max_occupancy,
                   base_rent24hr, default_security_deposit, allow_extra_person, extra_person_cost,
                   is_active, status, cleaning_status, created_at)
SELECT
    'BN1-' || LPAD(n::text, 2, '0'),
    (SELECT id FROM room_category WHERE name = 'Attached'),
    (SELECT id FROM bhaktniwas_block WHERE code = 'BN1'),
    NULL, 4, 500, 0, false, 0, true, 'AVAILABLE', 'CLEAN', now()
FROM generate_series(1, 20) AS n
ON CONFLICT (room_number) DO NOTHING;

-- 3) BN1 — Non-Attached, rooms 21-29 — Rs.300/day, STRICT max 2 persons.
INSERT INTO room (room_number, category_id, bhaktniwas_block_id, floor, max_occupancy,
                   base_rent24hr, default_security_deposit, allow_extra_person, extra_person_cost,
                   is_active, status, cleaning_status, created_at)
SELECT
    'BN1-' || LPAD(n::text, 2, '0'),
    (SELECT id FROM room_category WHERE name = 'Non-Attached'),
    (SELECT id FROM bhaktniwas_block WHERE code = 'BN1'),
    NULL, 2, 300, 0, false, 0, true, 'AVAILABLE', 'CLEAN', now()
FROM generate_series(21, 29) AS n
ON CONFLICT (room_number) DO NOTHING;

-- 4) BN2 — AC, rooms 1-8 — Rs.1200/day, max 4 persons.
INSERT INTO room (room_number, category_id, bhaktniwas_block_id, floor, max_occupancy,
                   base_rent24hr, default_security_deposit, allow_extra_person, extra_person_cost,
                   is_active, status, cleaning_status, created_at)
SELECT
    'BN2-' || LPAD(n::text, 2, '0'),
    (SELECT id FROM room_category WHERE name = 'AC'),
    (SELECT id FROM bhaktniwas_block WHERE code = 'BN2'),
    NULL, 4, 1200, 0, false, 0, true, 'AVAILABLE', 'CLEAN', now()
FROM generate_series(1, 8) AS n
ON CONFLICT (room_number) DO NOTHING;

-- 5) BN2 — Normal, room 9 — Rs.500/day, max 4 persons (category flag, changeable later).
INSERT INTO room (room_number, category_id, bhaktniwas_block_id, floor, max_occupancy,
                   base_rent24hr, default_security_deposit, allow_extra_person, extra_person_cost,
                   is_active, status, cleaning_status, created_at)
VALUES (
    'BN2-09',
    (SELECT id FROM room_category WHERE name = 'Normal'),
    (SELECT id FROM bhaktniwas_block WHERE code = 'BN2'),
    NULL, 4, 500, 0, false, 0, true, 'AVAILABLE', 'CLEAN', now()
)
ON CONFLICT (room_number) DO NOTHING;

-- 6) BN3 — All AC, rooms 1-12 — PERSON_COUNT pricing: base Rs.1500 (2 persons),
--    +Rs.300/extra person up to max 4 (Rs.1800 @3, Rs.2100 @4).
INSERT INTO room (room_number, category_id, bhaktniwas_block_id, floor, max_occupancy,
                   base_rent24hr, default_security_deposit, allow_extra_person, extra_person_cost,
                   is_active, status, cleaning_status, created_at)
SELECT
    'BN3-' || LPAD(n::text, 2, '0'),
    (SELECT id FROM room_category WHERE name = 'All AC'),
    (SELECT id FROM bhaktniwas_block WHERE code = 'BN3'),
    NULL, 4, 1500, 0, true, 300, true, 'AVAILABLE', 'CLEAN', now()
FROM generate_series(1, 12) AS n
ON CONFLICT (room_number) DO NOTHING;
