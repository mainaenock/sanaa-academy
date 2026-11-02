-- Adopt the poster orange for existing installations using the original green.
-- Preserve custom brand colors and every other website setting.
UPDATE site_settings
SET value=json_set(value, '$.accentColor', '#ff8a00'), updated_at=CURRENT_TIMESTAMP
WHERE key='website'
  AND lower(json_extract(value, '$.accentColor')) IN ('#a9ef70', '#b4ef80');
