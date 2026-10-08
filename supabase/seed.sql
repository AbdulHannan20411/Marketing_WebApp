-- Starter data. Safe to run more than once (fixed ids, ON CONFLICT DO NOTHING).
-- Run against your project with: npm run db:seed
-- (With a local Supabase stack, `supabase db reset` also runs this file.)
--
-- It does not create users or Super Admins. Sign up on the site, then:
--   npm run make-superadmin -- you@example.com

-- Saved replies for the Super Admin reply composer.
insert into public.saved_replies (id, title, body, locale) values
  ('00000000-0000-4000-8000-000000000001', 'Thanks, looking into it',
   'Thanks for getting in touch. We are looking into this and will get back to you shortly.', 'en'),
  ('00000000-0000-4000-8000-000000000002', 'Payment received',
   'We have received your payment receipt. Our team will approve it during working hours and your plan will start right away.', 'en'),
  ('00000000-0000-4000-8000-000000000003', 'Book a demo',
   'We would be happy to show you NextReach. Please share two or three times that suit you (PKT), and whether you prefer a WhatsApp call, Google Meet or a phone call.', 'en'),
  ('00000000-0000-4000-8000-000000000004', 'شکریہ، ہم دیکھ رہے ہیں',
   'رابطہ کرنے کا شکریہ۔ ہم اس معاملے کو دیکھ رہے ہیں اور جلد آپ کو جواب دیں گے۔', 'ur'),
  ('00000000-0000-4000-8000-000000000005', 'ادائیگی موصول ہو گئی',
   'ہمیں آپ کی ادائیگی کی رسید مل گئی ہے۔ ہماری ٹیم کام کے اوقات میں اسے منظور کرے گی اور آپ کا پلان فوراً شروع ہو جائے گا۔', 'ur')
on conflict (id) do nothing;

-- The settings row is created by the migrations; make sure it exists.
insert into public.admin_settings (id) values (true) on conflict (id) do nothing;
