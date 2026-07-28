-- V4 used semantic English translations for some Bartan items (e.g. "Mortar
-- & Pestle (Khalbatta)"), which nobody locally recognizes. Switch to plain
-- Hinglish transliteration (Sarata, Pavsi, Davla, ...) instead — the goal is
-- just making the dropdown type-ahead work, not translating meaning.
UPDATE inventory_item SET material_name_en = 'Ganj (Bada)'          WHERE category = 'BARTAN' AND material_name_hi = 'गंज (बडा)';
UPDATE inventory_item SET material_name_en = 'Ganj (Medium)'        WHERE category = 'BARTAN' AND material_name_hi = 'गंज (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Ganj (Chota)'         WHERE category = 'BARTAN' AND material_name_hi = 'गंज (छोटा)';
UPDATE inventory_item SET material_name_en = 'Jhakati'              WHERE category = 'BARTAN' AND material_name_hi = 'झाकती';
UPDATE inventory_item SET material_name_en = 'Sigdi'                WHERE category = 'BARTAN' AND material_name_hi = 'सिगडी';
UPDATE inventory_item SET material_name_en = 'Chair (Khurchi)'      WHERE category = 'BARTAN' AND material_name_hi = 'चेयर (खुर्ची)';
UPDATE inventory_item SET material_name_en = 'Kadhai (Badi)'        WHERE category = 'BARTAN' AND material_name_hi = 'कढ़ाई (बडी)';
UPDATE inventory_item SET material_name_en = 'Kadhai (Medium)'      WHERE category = 'BARTAN' AND material_name_hi = 'कढ़ाई (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Kadhai (Choti)'       WHERE category = 'BARTAN' AND material_name_hi = 'कढ़ाई (छोटी)';
UPDATE inventory_item SET material_name_en = 'Balti (Steel)'        WHERE category = 'BARTAN' AND material_name_hi = 'बाल्टी (स्टील)';
UPDATE inventory_item SET material_name_en = 'Jag'                  WHERE category = 'BARTAN' AND material_name_hi = 'जग';
UPDATE inventory_item SET material_name_en = 'Thali'                WHERE category = 'BARTAN' AND material_name_hi = 'थाली';
UPDATE inventory_item SET material_name_en = 'Katori'               WHERE category = 'BARTAN' AND material_name_hi = 'कटोरी';
UPDATE inventory_item SET material_name_en = 'Chammach'             WHERE category = 'BARTAN' AND material_name_hi = 'चम्मच';
UPDATE inventory_item SET material_name_en = 'Davla'                WHERE category = 'BARTAN' AND material_name_hi = 'डवला';
UPDATE inventory_item SET material_name_en = 'Kopar (Bada)'         WHERE category = 'BARTAN' AND material_name_hi = 'कोपर (बडा)';
UPDATE inventory_item SET material_name_en = 'Kopar (Medium)'       WHERE category = 'BARTAN' AND material_name_hi = 'कोपर (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Kopar (Chota)'        WHERE category = 'BARTAN' AND material_name_hi = 'कोपर (छोटा)';
UPDATE inventory_item SET material_name_en = 'Chawal (Panja)'       WHERE category = 'BARTAN' AND material_name_hi = 'चावल (पंजा)';
UPDATE inventory_item SET material_name_en = 'Katora'               WHERE category = 'BARTAN' AND material_name_hi = 'कटोरा';
UPDATE inventory_item SET material_name_en = 'Pat-Belan'            WHERE category = 'BARTAN' AND material_name_hi = 'पाट-बेलन';
UPDATE inventory_item SET material_name_en = 'Metting (Badi)'       WHERE category = 'BARTAN' AND material_name_hi = 'मेटींग (बडी)';
UPDATE inventory_item SET material_name_en = 'Metting (Choti)'      WHERE category = 'BARTAN' AND material_name_hi = 'मेटींग (छोटी)';
UPDATE inventory_item SET material_name_en = 'Sarata (Bada)'        WHERE category = 'BARTAN' AND material_name_hi = 'सराटा (बडा)';
UPDATE inventory_item SET material_name_en = 'Sarata (Medium)'      WHERE category = 'BARTAN' AND material_name_hi = 'सराटा (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Sarata (Chota)'       WHERE category = 'BARTAN' AND material_name_hi = 'सराटा (छोटा)';
UPDATE inventory_item SET material_name_en = 'Khalbatta'            WHERE category = 'BARTAN' AND material_name_hi = 'खलबत्ता';
UPDATE inventory_item SET material_name_en = 'Pavsi'                WHERE category = 'BARTAN' AND material_name_hi = 'पावसी';
UPDATE inventory_item SET material_name_en = 'Vadhani'              WHERE category = 'BARTAN' AND material_name_hi = 'वाढनी';
UPDATE inventory_item SET material_name_en = 'Kisni'                WHERE category = 'BARTAN' AND material_name_hi = 'किसनी';
UPDATE inventory_item SET material_name_en = 'Jhara (Bada)'         WHERE category = 'BARTAN' AND material_name_hi = 'झारा (बडा)';
UPDATE inventory_item SET material_name_en = 'Jhara (Medium)'       WHERE category = 'BARTAN' AND material_name_hi = 'झारा (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Chimta'               WHERE category = 'BARTAN' AND material_name_hi = 'चिमटा';
UPDATE inventory_item SET material_name_en = 'Namak-Patra'          WHERE category = 'BARTAN' AND material_name_hi = 'नमक-पात्र';
UPDATE inventory_item SET material_name_en = 'Buffet Table'         WHERE category = 'BARTAN' AND material_name_hi = 'बफे टेबल';
UPDATE inventory_item SET material_name_en = 'Dhama'                WHERE category = 'BARTAN' AND material_name_hi = 'धामा';
UPDATE inventory_item SET material_name_en = 'Tawa (Bada)'          WHERE category = 'BARTAN' AND material_name_hi = 'तावा (बडा)';
UPDATE inventory_item SET material_name_en = 'Tawa (Medium)'        WHERE category = 'BARTAN' AND material_name_hi = 'तावा (मिडियम)';
UPDATE inventory_item SET material_name_en = 'Tawa (Chota)'         WHERE category = 'BARTAN' AND material_name_hi = 'तावा (छोटा)';
UPDATE inventory_item SET material_name_en = 'Korpat-Belan'         WHERE category = 'BARTAN' AND material_name_hi = 'कोरपाट-बेलन';
UPDATE inventory_item SET material_name_en = 'Tai'                  WHERE category = 'BARTAN' AND material_name_hi = 'तई';
UPDATE inventory_item SET material_name_en = 'Stray'                WHERE category = 'BARTAN' AND material_name_hi = 'स्ट्रे';
UPDATE inventory_item SET material_name_en = 'Bhojan Patti (Badi Thali)' WHERE category = 'BARTAN' AND material_name_hi = 'भोजन पत्ती (बड़ी थाली)';
