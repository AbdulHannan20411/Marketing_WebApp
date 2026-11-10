-- Rebrand: NextReach -> GrowBusinesss in the stored auto-reply texts.
-- Only the brand word changes, so any wording an admin has edited is kept.
update public.admin_settings
set
  auto_ack_en = replace(auto_ack_en, 'NextReach', 'GrowBusinesss'),
  auto_ack_ur = replace(auto_ack_ur, 'NextReach', 'GrowBusinesss')
where auto_ack_en like '%NextReach%' or auto_ack_ur like '%NextReach%';
