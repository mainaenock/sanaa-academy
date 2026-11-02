-- Publish the academy's confirmed support contacts without changing other settings.
UPDATE site_settings
SET value=json_set(value,
    '$.supportEmail', 'info@sanaacademy.co.ke',
    '$.supportPhone', '+254798578998'),
    updated_at=CURRENT_TIMESTAMP
WHERE key='website';
