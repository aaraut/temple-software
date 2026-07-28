-- Adds an English name alongside the existing Hindi-only name so dropdowns
-- (e.g. the Bartan/Bichayat item picker in Rental Issue) can be found by
-- typing in English — native <select> keyboard type-ahead only matches the
-- start of the option text, which was Hindi-only before this.
ALTER TABLE inventory_item ADD COLUMN IF NOT EXISTS material_name_en VARCHAR(150);

-- Best-effort English names/transliterations for the current Bartan list
-- (seeded in V3). Review these in the Inventory screen and correct any
-- that don't match local usage — several are regional utensil names with
-- no single standard English equivalent.
UPDATE inventory_item SET material_name_en = 'Ganj (Large)'                 WHERE category = 'BARTAN' AND material_name_hi = 'गंज (बडा)';
UPDATE inventory_item SET material_name_en = 'Ganj (Medium)'                WHERE category = 'BARTAN' AND material_name_hi = 'गंज (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Ganj (Small)'                 WHERE category = 'BARTAN' AND material_name_hi = 'गंज (छोटा)';
UPDATE inventory_item SET material_name_en = 'Jhakati (Skimmer)'           WHERE category = 'BARTAN' AND material_name_hi = 'झाकती';
UPDATE inventory_item SET material_name_en = 'Sigdi (Stove)'               WHERE category = 'BARTAN' AND material_name_hi = 'सिगडी';
UPDATE inventory_item SET material_name_en = 'Chair'                       WHERE category = 'BARTAN' AND material_name_hi = 'चेयर (खुर्ची)';
UPDATE inventory_item SET material_name_en = 'Kadhai (Large)'               WHERE category = 'BARTAN' AND material_name_hi = 'कढ़ाई (बडी)';
UPDATE inventory_item SET material_name_en = 'Kadhai (Medium)'              WHERE category = 'BARTAN' AND material_name_hi = 'कढ़ाई (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Kadhai (Small)'               WHERE category = 'BARTAN' AND material_name_hi = 'कढ़ाई (छोटी)';
UPDATE inventory_item SET material_name_en = 'Bucket (Steel)'              WHERE category = 'BARTAN' AND material_name_hi = 'बाल्टी (स्टील)';
UPDATE inventory_item SET material_name_en = 'Jug'                         WHERE category = 'BARTAN' AND material_name_hi = 'जग';
UPDATE inventory_item SET material_name_en = 'Plate (Thali)'               WHERE category = 'BARTAN' AND material_name_hi = 'थाली';
UPDATE inventory_item SET material_name_en = 'Bowl (Katori)'               WHERE category = 'BARTAN' AND material_name_hi = 'कटोरी';
UPDATE inventory_item SET material_name_en = 'Spoon'                       WHERE category = 'BARTAN' AND material_name_hi = 'चम्मच';
UPDATE inventory_item SET material_name_en = 'Davla (Container)'           WHERE category = 'BARTAN' AND material_name_hi = 'डवला';
UPDATE inventory_item SET material_name_en = 'Kopar (Large)'                WHERE category = 'BARTAN' AND material_name_hi = 'कोपर (बडा)';
UPDATE inventory_item SET material_name_en = 'Kopar (Medium)'               WHERE category = 'BARTAN' AND material_name_hi = 'कोपर (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Kopar (Small)'                WHERE category = 'BARTAN' AND material_name_hi = 'कोपर (छोटा)';
UPDATE inventory_item SET material_name_en = 'Rice Server (Panja)'         WHERE category = 'BARTAN' AND material_name_hi = 'चावल (पंजा)';
UPDATE inventory_item SET material_name_en = 'Bowl (Katora)'               WHERE category = 'BARTAN' AND material_name_hi = 'कटोरा';
UPDATE inventory_item SET material_name_en = 'Rolling Board & Pin (Pat-Belan)' WHERE category = 'BARTAN' AND material_name_hi = 'पाट-बेलन';
UPDATE inventory_item SET material_name_en = 'Mat (Large)'                 WHERE category = 'BARTAN' AND material_name_hi = 'मेटींग (बडी)';
UPDATE inventory_item SET material_name_en = 'Mat (Small)'                 WHERE category = 'BARTAN' AND material_name_hi = 'मेटींग (छोटी)';
UPDATE inventory_item SET material_name_en = 'Sarata (Large)'               WHERE category = 'BARTAN' AND material_name_hi = 'सराटा (बडा)';
UPDATE inventory_item SET material_name_en = 'Sarata (Medium)'              WHERE category = 'BARTAN' AND material_name_hi = 'सराटा (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Sarata (Small)'              WHERE category = 'BARTAN' AND material_name_hi = 'सराटा (छोटा)';
UPDATE inventory_item SET material_name_en = 'Mortar & Pestle (Khalbatta)' WHERE category = 'BARTAN' AND material_name_hi = 'खलबत्ता';
UPDATE inventory_item SET material_name_en = 'Pavsi'                       WHERE category = 'BARTAN' AND material_name_hi = 'पावसी';
UPDATE inventory_item SET material_name_en = 'Serving Ladle (Vadhani)'     WHERE category = 'BARTAN' AND material_name_hi = 'वाढनी';
UPDATE inventory_item SET material_name_en = 'Grater (Kisni)'              WHERE category = 'BARTAN' AND material_name_hi = 'किसनी';
UPDATE inventory_item SET material_name_en = 'Strainer (Large, Jhara)'      WHERE category = 'BARTAN' AND material_name_hi = 'झारा (बडा)';
UPDATE inventory_item SET material_name_en = 'Strainer (Medium, Jhara)'    WHERE category = 'BARTAN' AND material_name_hi = 'झारा (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Tongs (Chimta)'              WHERE category = 'BARTAN' AND material_name_hi = 'चिमटा';
UPDATE inventory_item SET material_name_en = 'Salt Container'              WHERE category = 'BARTAN' AND material_name_hi = 'नमक-पात्र';
UPDATE inventory_item SET material_name_en = 'Buffet Table'                WHERE category = 'BARTAN' AND material_name_hi = 'बफे टेबल';
UPDATE inventory_item SET material_name_en = 'Dhama (Large Vessel)'        WHERE category = 'BARTAN' AND material_name_hi = 'धामा';
UPDATE inventory_item SET material_name_en = 'Tawa (Large)'                WHERE category = 'BARTAN' AND material_name_hi = 'तावा (बडा)';
UPDATE inventory_item SET material_name_en = 'Tawa (Medium)'               WHERE category = 'BARTAN' AND material_name_hi = 'तावा (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Tawa (Small)'                WHERE category = 'BARTAN' AND material_name_hi = 'तावा (छोटा)';
UPDATE inventory_item SET material_name_en = 'Korpat & Rolling Pin (Belan)' WHERE category = 'BARTAN' AND material_name_hi = 'कोरपाट-बेलन';
UPDATE inventory_item SET material_name_en = 'Tai (Griddle)'               WHERE category = 'BARTAN' AND material_name_hi = 'तई';
UPDATE inventory_item SET material_name_en = 'Tray'                        WHERE category = 'BARTAN' AND material_name_hi = 'स्ट्रे';
UPDATE inventory_item SET material_name_en = 'Meal Plate (Large Thali)'    WHERE category = 'BARTAN' AND material_name_hi = 'भोजन पत्ती (बड़ी थाली)';
