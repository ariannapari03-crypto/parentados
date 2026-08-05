-- ============================================================================
--  FESTIVA — seed di esempio: locali e promozioni di Alba
--  Esegui DOPO schema.sql, nell'SQL editor di Supabase.
--  I partner hanno owner_id NULL: sono di sistema (gestiti da admin) finché
--  un vero account "locale" non li rivendica. Dati di esempio, modificabili.
--  Rieseguibile: prima ripulisce i partner di sistema e le loro promo.
-- ============================================================================

delete from public.promotions
  where partner_id in (select id from public.partners where owner_id is null);
delete from public.partners where owner_id is null;

insert into public.partners (name, category, city, area, price_min, price_max, rating, reviews_count, description, featured, plan) values
  ('Osteria dell''Arco',    'venue',        'Alba', 'centro',  28, 38, 4.8,  86, 'Cucina di Langa in pieno centro storico', true,  'active'),
  ('Agriturismo Le Colline','venue',        'Alba', 'langhe',  30, 45, 4.7,  61, 'Terrazza panoramica tra i vigneti',       false, 'active'),
  ('Enoteca Barolo',        'venue',        'Alba', 'langhe',  15, 25, 4.6,  74, 'Sala degustazioni e aperitivi',           false, 'active'),
  ('Pasticceria Dulcis',    'catering',     'Alba', 'centro',  60, 120,4.9, 140, 'Torte su misura e piccola pasticceria',   false, 'active'),
  ('Langhe Gourmet Catering','catering',    'Alba', 'piave',   20, 30, 4.4,  52, 'Catering di qualità con servizio',        false, 'active'),
  ('Studio Foto Tanaro',    'photography',  'Alba', 'savona', 140, 280,4.7,  93, 'Reportage di eventi con montaggio',       false, 'active'),
  ('Fiori & Co',            'decorations',  'Alba', 'centro',  40, 90, 4.5,  47, 'Allestimenti floreali e centrotavola',    false, 'active'),
  ('Bar Savona',            'venue',        'Alba', 'savona',  12, 18, 4.3,  38, 'Cocktail bar con dehors in piazza',       false, 'active');

-- Promozioni collegate (per nome del partner)
insert into public.promotions (partner_id, title, description, discount_type, value, min_guests, valid_to, terms, code_prefix, active)
select id, 'Sconto menu di gruppo', 'Sconto sul menu di gruppo per feste ed eventi', 'percent', 15, 8, '2026-12-31', 'Valido su prenotazione, min. 8 persone', 'FST-AL', true
  from public.partners where name = 'Osteria dell''Arco' and owner_id is null;

insert into public.promotions (partner_id, title, description, discount_type, value, min_guests, valid_to, terms, code_prefix, active)
select id, 'Pacchetto torta + vassoi', 'Torta personalizzata con vassoi di pasticcini', 'package', null, null, '2026-12-31', 'Da concordare con la pasticceria', 'FST-AL', true
  from public.partners where name = 'Pasticceria Dulcis' and owner_id is null;

insert into public.promotions (partner_id, title, description, discount_type, value, min_guests, valid_to, terms, code_prefix, active)
select id, 'Sconto infrasettimanale', 'Servizio fotografico scontato dal lunedì al giovedì', 'percent', 20, null, '2026-12-31', 'Eventi dal lun al gio', 'FST-AL', true
  from public.partners where name = 'Studio Foto Tanaro' and owner_id is null;

insert into public.promotions (partner_id, title, description, discount_type, value, min_guests, valid_to, terms, code_prefix, active)
select id, 'Centrotavola omaggio', 'Un centrotavola in omaggio per ogni allestimento', 'package', null, null, '2026-12-31', 'Un omaggio per evento', 'FST-AL', true
  from public.partners where name = 'Fiori & Co' and owner_id is null;

insert into public.promotions (partner_id, title, description, discount_type, value, min_guests, valid_to, terms, code_prefix, active)
select id, 'Sconto degustazione', 'Sconto sull''aperitivo di gruppo', 'percent', 10, 6, '2026-12-31', 'Min. 6 persone', 'FST-AL', true
  from public.partners where name = 'Enoteca Barolo' and owner_id is null;

insert into public.promotions (partner_id, title, description, discount_type, value, min_guests, valid_to, terms, code_prefix, active)
select id, 'Sconto affitto sala', 'Riduzione sul costo della sala per eventi privati', 'fixed', 50, null, '2026-12-31', 'Su prenotazione confermata', 'FST-AL', true
  from public.partners where name = 'Agriturismo Le Colline' and owner_id is null;
