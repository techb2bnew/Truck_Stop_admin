-- =====================================================================
-- Truck Stop: optional sample data. Run AFTER schema.sql.
-- Adds brokers, shippers, trucks, drivers, loads, rate insights, negotiation rules,
-- scoring profiles, documents, courses, lessons and scenarios.
-- Students, batches and attempts are NOT included: invite real students from the admin panel.
-- Safe to run again (existing rows are skipped).
-- =====================================================================

insert into public.companies (id, type, company, contact_name, email, phone, address, mc_number, credit_rating, days_to_pay) values
  ('38d2343e-2aa9-1d9d-8671-e1742bc49e55', 'broker', 'Midwest Freight Brokers', 'Dan Miller', 'dan@midwestfb.com', '(317) 555-0101', 'Indianapolis, IN', 'MC-482913', 'A', 25),
  ('61dc73fb-e1fb-2a22-8cf1-a4198b8e3ace', 'broker', 'Lone Star Logistics', 'Maria Lopez', 'maria@lonestarlog.com', '(214) 555-0144', 'Dallas, TX', 'MC-731204', 'B', 35),
  ('4ec53d70-67bf-0e3c-15e4-0a2d52494209', 'broker', 'Pacific Coast Carriers', 'Jason Lee', 'jason@pcc.com', '(213) 555-0178', 'Los Angeles, CA', 'MC-905512', 'A', 21),
  ('df765e0c-139f-d757-56b8-86678727f362', 'broker', 'Southeast Load Solutions', 'Tina Brooks', 'tina@selsolutions.com', '(404) 555-0190', 'Atlanta, GA', 'MC-612377', 'C', 45),
  ('6d3e1748-3e5c-464a-1b4c-927ec8a5755c', 'broker', 'Great Lakes Transport', 'Paul Evans', 'paul@glt.com', '(312) 555-0166', 'Chicago, IL', 'MC-228840', 'B', 30)
on conflict (id) do nothing;

insert into public.companies (id, type, company, contact_name, email, phone, city, state, industry) values
  ('1691ed83-2b1b-6947-b9e4-083138f405b9', 'shipper', 'Harvest Foods Inc.', 'Linda Park', 'linda@harvestfoods.com', '(614) 555-0123', 'Columbus', 'OH', 'Food & Beverage'),
  ('35817a26-1fb1-aeea-dc24-4c5cd38786e7', 'shipper', 'Apex Building Supply', 'Tom Reed', 'tom@apexbs.com', '(713) 555-0155', 'Houston', 'TX', 'Construction'),
  ('de310a1a-118d-e4a3-0d73-24ac58f39468', 'shipper', 'BrightTech Electronics', 'Sara Kim', 'sara@brighttech.com', '(206) 555-0188', 'Seattle', 'WA', 'Electronics'),
  ('d3f674d9-cd63-df64-e376-136031016f75', 'shipper', 'FreshLine Produce', 'Carlos Diaz', 'carlos@freshline.com', '(305) 555-0112', 'Miami', 'FL', 'Produce')
on conflict (id) do nothing;

insert into public.negotiation_rules (id, name, opening_offer, target_rate, min_rate, max_rate, max_rounds, step_percent, accept_message, counter_message, reject_message) values
  ('ae980835-6d89-3efd-024d-cd6a96be39bf', 'Easy – flexible broker', 950, 1100, 1000, 1250, 4, 5, 'Deal. Send me the rate confirmation.', 'I can meet you around this number.', 'Sorry, that is too high for this lane.'),
  ('ace9cdc6-f935-6f49-8851-374cdfd9be3f', 'Medium – firm broker', 1650, 1850, 1700, 1950, 3, 3, 'Okay, we can do that. Booking it.', 'That is the best I can do right now.', 'No, my customer will not pay that.'),
  ('c98883d8-86c3-5efc-27fb-298fd343cb11', 'Hard – tight margin', 2000, 2200, 2100, 2300, 2, 2, 'Fine. Done at that rate.', 'I cannot move much more.', 'Too high. I will call another carrier.'),
  ('c3bea714-c0ef-218e-c367-941625c6f754', 'Shipper – selling rate', 1750, 1850, 1800, 2000, 3, 4, 'Approved. Please confirm the carrier.', 'Let us settle near this price.', 'That is above our budget.')
on conflict (id) do nothing;

insert into public.scoring_profiles (id, name, pass_mark, criteria) values
  ('6d9670c3-c458-5049-74a4-9efab658ee5f', 'Dispatcher – standard', 70, '[{"key":"rate","label":"Rate vs target","weight":30},{"key":"equipment","label":"Correct truck and driver","weight":20},{"key":"deadhead","label":"Deadhead and profit","weight":20},{"key":"documents","label":"Document accuracy","weight":15},{"key":"time","label":"Time taken","weight":15}]'::jsonb),
  ('89cc5ad2-361d-9bc6-9d3e-59edb1222a30', 'Broker – standard', 70, '[{"key":"margin","label":"Gross margin","weight":35},{"key":"carrier","label":"Carrier selection","weight":20},{"key":"negotiation","label":"Negotiation result","weight":20},{"key":"documents","label":"Document accuracy","weight":15},{"key":"problem","label":"Problem resolution","weight":10}]'::jsonb)
on conflict (id) do nothing;

insert into public.trucks (id, unit_number, equipment, make, year, plate, capacity_lbs, length_ft, mpg, location_city, location_state, status) values
  ('05fcac02-895c-5c96-8ad6-061967396297', 'TS-101', 'Van', 'Freightliner Cascadia', 2022, 'IN-4821', 45000, 53, 7.2, 'Indianapolis', 'IN', 'available'),
  ('61428086-6c8f-d162-7e9b-2812011481be', 'TS-102', 'Reefer', 'Kenworth T680', 2021, 'TX-9034', 42000, 53, 6.6, 'Dallas', 'TX', 'available'),
  ('bc44751b-cb54-282b-ac93-cf02a86a3a74', 'TS-103', 'Flatbed', 'Peterbilt 579', 2020, 'TX-2210', 48000, 48, 6.9, 'Houston', 'TX', 'available'),
  ('7f437962-9ca7-8804-89ee-d539b6742b3e', 'TS-104', 'Van', 'Volvo VNL 860', 2023, 'CA-7712', 45000, 53, 7.5, 'Los Angeles', 'CA', 'in_use'),
  ('e9b320f2-d317-d8dd-62d5-6c0355d5c08b', 'TS-105', 'Van', 'International LT', 2019, 'GA-5543', 44000, 53, 6.8, 'Atlanta', 'GA', 'available'),
  ('04b0b2e9-7199-6ab4-08a2-32dacf02b84e', 'TS-106', 'Reefer', 'Freightliner Cascadia', 2022, 'OH-3098', 43000, 53, 6.5, 'Columbus', 'OH', 'maintenance'),
  ('4a4eb690-74f2-9bcc-9d07-293f358358fa', 'TS-107', 'Flatbed', 'Kenworth W990', 2021, 'CO-6671', 48000, 48, 6.7, 'Denver', 'CO', 'available'),
  ('52dd0012-8f78-b2a7-e57c-4d73de72f167', 'TS-108', 'Van', 'Mack Anthem', 2020, 'WA-1189', 44000, 53, 7, 'Seattle', 'WA', 'available')
on conflict (id) do nothing;

insert into public.drivers (id, name, phone, license_no, experience_years, home_city, pay_per_mile, truck_id, availability) values
  ('e8648d82-fdea-5f8a-26ab-03cf270ccc1e', 'James Wilson', '(317) 555-0201', 'IN-CDL-88421', 8, 'Indianapolis, IN', 0.62, '05fcac02-895c-5c96-8ad6-061967396297', 'available'),
  ('69c4da7d-3166-515a-6ebe-353e4a887eac', 'Robert Garcia', '(214) 555-0202', 'TX-CDL-55120', 12, 'Dallas, TX', 0.68, '61428086-6c8f-d162-7e9b-2812011481be', 'available'),
  ('aac969e2-42ba-5beb-d824-6090460feaee', 'Michael Brown', '(713) 555-0203', 'TX-CDL-77018', 5, 'Houston, TX', 0.58, 'bc44751b-cb54-282b-ac93-cf02a86a3a74', 'available'),
  ('c2591b25-c1f6-7148-c85f-6965874ff830', 'David Martinez', '(213) 555-0204', 'CA-CDL-33902', 15, 'Los Angeles, CA', 0.72, '7f437962-9ca7-8804-89ee-d539b6742b3e', 'on_trip'),
  ('88106670-da70-705e-903e-0911d3ae774a', 'Chris Johnson', '(404) 555-0205', 'GA-CDL-66431', 3, 'Atlanta, GA', 0.55, 'e9b320f2-d317-d8dd-62d5-6c0355d5c08b', 'available'),
  ('ccf9f8e1-9186-b3af-5b59-c7a2632b16d3', 'Anthony Davis', '(614) 555-0206', 'OH-CDL-90217', 9, 'Columbus, OH', 0.64, '04b0b2e9-7199-6ab4-08a2-32dacf02b84e', 'off_duty'),
  ('8b60cc33-74c2-7cd3-e1a9-ba3412bfb3c6', 'Kevin Taylor', '(303) 555-0207', 'CO-CDL-24780', 6, 'Denver, CO', 0.6, '4a4eb690-74f2-9bcc-9d07-293f358358fa', 'available'),
  ('9811e999-0bb7-afed-626c-94a6cb78d14b', 'Brian Anderson', '(206) 555-0208', 'WA-CDL-11893', 10, 'Seattle, WA', 0.66, '52dd0012-8f78-b2a7-e57c-4d73de72f167', 'available')
on conflict (id) do nothing;

insert into public.loads (id, origin_city, origin_state, dest_city, dest_state, pickup_date, delivery_date, equipment, size, weight_lbs, length_ft, commodity, loaded_miles, deadhead_miles, posted_rate, broker_id, posted_at, notes) values
  ('d62430ce-4b26-c5f3-6f67-7921827eedea', 'Indianapolis', 'IN', 'Twinsburg', 'OH', '2026-10-14', '2026-10-15', 'Van', 'Full', 41000, 53, 'Auto parts', 330, 25, NULL, '38d2343e-2aa9-1d9d-8671-e1742bc49e55', '2026-10-09T08:15:00', 'Driver assist not required. Appointment needed.'),
  ('94176ee3-4257-737e-b04e-6cf10f828dde', 'Dallas', 'TX', 'Atlanta', 'GA', '2026-10-14', '2026-10-17', 'Van', 'Full', 38000, 53, 'Packaged goods', 780, 60, 2250, '61dc73fb-e1fb-2a22-8cf1-a4198b8e3ace', '2026-10-10T09:15:00', ''),
  ('2dea0500-60ad-df11-c602-78952b54df7e', 'Chicago', 'IL', 'Memphis', 'TN', '2026-10-15', '2026-10-16', 'Reefer', 'Full', 36000, 53, 'Dairy products', 530, 40, 1650, '6d3e1748-3e5c-464a-1b4c-927ec8a5755c', '2026-10-11T10:15:00', ''),
  ('1a9374d2-d4ec-fcff-2bd6-c3b42af88b5d', 'Los Angeles', 'CA', 'Phoenix', 'AZ', '2026-10-13', '2026-10-14', 'Van', 'Full', 33000, 53, 'Furniture', 370, 15, 1100, '4ec53d70-67bf-0e3c-15e4-0a2d52494209', '2026-10-09T11:15:00', ''),
  ('83ea39c7-d17f-36ea-ee3b-c1ec2ed66c6e', 'Atlanta', 'GA', 'Charlotte', 'NC', '2026-10-16', '2026-10-16', 'Van', 'Partial', 12000, 28, 'Retail goods', 245, 90, 780, 'df765e0c-139f-d757-56b8-86678727f362', '2026-10-10T12:15:00', 'Driver assist not required. Appointment needed.'),
  ('81c58df4-f19f-be3c-dc2d-21410c49837b', 'Houston', 'TX', 'Nashville', 'TN', '2026-10-16', '2026-10-18', 'Flatbed', 'Full', 44000, 48, 'Steel beams', 665, 30, 2150, '61dc73fb-e1fb-2a22-8cf1-a4198b8e3ace', '2026-10-11T13:15:00', ''),
  ('cb4ef863-152c-4c5e-c3c7-28be8cf8d8f3', 'Denver', 'CO', 'Kansas City', 'MO', '2026-10-15', '2026-10-17', 'Flatbed', 'Full', 42000, 48, 'Lumber', 600, 75, NULL, '6d3e1748-3e5c-464a-1b4c-927ec8a5755c', '2026-10-09T14:15:00', ''),
  ('26028f71-7fc4-f5da-7c48-91af4ccad742', 'Seattle', 'WA', 'Portland', 'OR', '2026-10-14', '2026-10-14', 'Van', 'Full', 18000, 53, 'Electronics', 175, 10, 780, '4ec53d70-67bf-0e3c-15e4-0a2d52494209', '2026-10-10T15:15:00', ''),
  ('643c361e-e0f6-0bfb-8eb0-6e57057d9b8e', 'Columbus', 'OH', 'Newark', 'NJ', '2026-10-15', '2026-10-16', 'Reefer', 'Full', 38000, 53, 'Frozen foods', 530, 55, 1850, '38d2343e-2aa9-1d9d-8671-e1742bc49e55', '2026-10-11T08:15:00', 'Driver assist not required. Appointment needed.'),
  ('bb4d1f77-3f52-1669-4184-d85cc0b17851', 'Miami', 'FL', 'Jacksonville', 'FL', '2026-10-17', '2026-10-17', 'Reefer', 'Full', 36000, 53, 'Fresh produce', 345, 35, 1100, 'df765e0c-139f-d757-56b8-86678727f362', '2026-10-09T09:15:00', ''),
  ('65ded0c0-bfe4-ea49-12b5-080122825311', 'Kansas City', 'MO', 'St. Louis', 'MO', '2026-10-13', '2026-10-13', 'Van', 'Partial', 15000, 40, 'Paper rolls', 250, 20, 720, '6d3e1748-3e5c-464a-1b4c-927ec8a5755c', '2026-10-10T10:15:00', ''),
  ('d7e59205-1f40-7515-b39b-7b6f2a90bb53', 'Phoenix', 'AZ', 'Dallas', 'TX', '2026-10-18', '2026-10-20', 'Van', 'Full', 40000, 53, 'Appliances', 1065, 45, NULL, '4ec53d70-67bf-0e3c-15e4-0a2d52494209', '2026-10-11T11:15:00', ''),
  ('c7dd4e30-c5c6-48d7-fa33-39f7f1ba7ca9', 'Detroit', 'MI', 'Louisville', 'KY', '2026-10-14', '2026-10-15', 'Van', 'Full', 39000, 53, 'Automotive', 380, 30, 1050, '38d2343e-2aa9-1d9d-8671-e1742bc49e55', '2026-10-09T12:15:00', 'Driver assist not required. Appointment needed.'),
  ('fa01873b-c617-99ed-4311-e131b54fb9f1', 'Minneapolis', 'MN', 'Chicago', 'IL', '2026-10-15', '2026-10-16', 'Reefer', 'Full', 37000, 53, 'Beverages', 410, 50, 1220, '6d3e1748-3e5c-464a-1b4c-927ec8a5755c', '2026-10-10T13:15:00', '')
on conflict (id) do nothing;

insert into public.rate_insights (id, load_id, low, booked, high, confidence, trend) values
  ('df7c4d06-c129-5958-2bb4-b63e5ea4a91a', 'd62430ce-4b26-c5f3-6f67-7921827eedea', 1027, 1181, 1358, 'High', '[{"weekStart":"2026-09-21","avgRate":1110},{"weekStart":"2026-09-28","avgRate":1146},{"weekStart":"2026-10-05","avgRate":1205},{"weekStart":"2026-10-12","avgRate":1181}]'::jsonb),
  ('91170e2e-1f77-bf7f-3f99-4d01b53a1dc7', '94176ee3-4257-737e-b04e-6cf10f828dde', 1968, 2262, 2601, 'High', '[{"weekStart":"2026-09-21","avgRate":2126},{"weekStart":"2026-09-28","avgRate":2194},{"weekStart":"2026-10-05","avgRate":2307},{"weekStart":"2026-10-12","avgRate":2262}]'::jsonb),
  ('9246dc97-5919-086b-0f2c-2723d0d8a957', '2dea0500-60ad-df11-c602-78952b54df7e', 1429, 1643, 1889, 'Medium', '[{"weekStart":"2026-09-21","avgRate":1544},{"weekStart":"2026-09-28","avgRate":1594},{"weekStart":"2026-10-05","avgRate":1676},{"weekStart":"2026-10-12","avgRate":1643}]'::jsonb),
  ('ad1902ca-0d64-7146-2b9e-df57d3505c1f', '1a9374d2-d4ec-fcff-2bd6-c3b42af88b5d', 966, 1110, 1277, 'High', '[{"weekStart":"2026-09-21","avgRate":1043},{"weekStart":"2026-09-28","avgRate":1077},{"weekStart":"2026-10-05","avgRate":1132},{"weekStart":"2026-10-12","avgRate":1110}]'::jsonb),
  ('461a7757-5b01-9e19-45b9-08ad4d6a492c', '83ea39c7-d17f-36ea-ee3b-c1ec2ed66c6e', 682, 784, 902, 'Low', '[{"weekStart":"2026-09-21","avgRate":737},{"weekStart":"2026-09-28","avgRate":760},{"weekStart":"2026-10-05","avgRate":800},{"weekStart":"2026-10-12","avgRate":784}]'::jsonb),
  ('8d84ed6d-182f-19e3-8720-0c6fbbd05710', '81c58df4-f19f-be3c-dc2d-21410c49837b', 1851, 2128, 2447, 'High', '[{"weekStart":"2026-09-21","avgRate":2000},{"weekStart":"2026-09-28","avgRate":2064},{"weekStart":"2026-10-05","avgRate":2171},{"weekStart":"2026-10-12","avgRate":2128}]'::jsonb),
  ('3020387a-1069-1d7e-41e3-c4ade7b1d2df', 'cb4ef863-152c-4c5e-c3c7-28be8cf8d8f3', 1201, 1380, 1587, 'Medium', '[{"weekStart":"2026-09-21","avgRate":1297},{"weekStart":"2026-09-28","avgRate":1339},{"weekStart":"2026-10-05","avgRate":1408},{"weekStart":"2026-10-12","avgRate":1380}]'::jsonb),
  ('0b47336d-fb46-b256-02e4-7968a5f32b30', '26028f71-7fc4-f5da-7c48-91af4ccad742', 670, 770, 885, 'High', '[{"weekStart":"2026-09-21","avgRate":724},{"weekStart":"2026-09-28","avgRate":747},{"weekStart":"2026-10-05","avgRate":785},{"weekStart":"2026-10-12","avgRate":770}]'::jsonb),
  ('29d5a1ce-818f-52fc-d323-76565b15b678', '643c361e-e0f6-0bfb-8eb0-6e57057d9b8e', 1614, 1855, 2133, 'High', '[{"weekStart":"2026-09-21","avgRate":1744},{"weekStart":"2026-09-28","avgRate":1799},{"weekStart":"2026-10-05","avgRate":1892},{"weekStart":"2026-10-12","avgRate":1855}]'::jsonb),
  ('2ab0225b-d6e3-aa98-fd88-ae4e2755c858', 'bb4d1f77-3f52-1669-4184-d85cc0b17851', 960, 1104, 1270, 'Medium', '[{"weekStart":"2026-09-21","avgRate":1038},{"weekStart":"2026-09-28","avgRate":1071},{"weekStart":"2026-10-05","avgRate":1126},{"weekStart":"2026-10-12","avgRate":1104}]'::jsonb),
  ('0d95f902-d20f-0fb6-412f-84d6de13babe', '65ded0c0-bfe4-ea49-12b5-080122825311', 631, 725, 834, 'Medium', '[{"weekStart":"2026-09-21","avgRate":682},{"weekStart":"2026-09-28","avgRate":703},{"weekStart":"2026-10-05","avgRate":740},{"weekStart":"2026-10-12","avgRate":725}]'::jsonb),
  ('4990d3e4-d774-606c-c384-9ebace158db9', 'd7e59205-1f40-7515-b39b-7b6f2a90bb53', 2224, 2556, 2939, 'High', '[{"weekStart":"2026-09-21","avgRate":2403},{"weekStart":"2026-09-28","avgRate":2479},{"weekStart":"2026-10-05","avgRate":2607},{"weekStart":"2026-10-12","avgRate":2556}]'::jsonb),
  ('a265ddaf-22d1-6927-981b-ea7fa085d288', 'c7dd4e30-c5c6-48d7-fa33-39f7f1ba7ca9', 926, 1064, 1224, 'High', '[{"weekStart":"2026-09-21","avgRate":1000},{"weekStart":"2026-09-28","avgRate":1032},{"weekStart":"2026-10-05","avgRate":1085},{"weekStart":"2026-10-12","avgRate":1064}]'::jsonb),
  ('970db404-c46f-60d4-275e-d0f2e0dd0709', 'fa01873b-c617-99ed-4311-e131b54fb9f1', 1070, 1230, 1415, 'Medium', '[{"weekStart":"2026-09-21","avgRate":1156},{"weekStart":"2026-09-28","avgRate":1193},{"weekStart":"2026-10-05","avgRate":1255},{"weekStart":"2026-10-12","avgRate":1230}]'::jsonb)
on conflict (id) do nothing;

insert into public.document_templates (id, name, type, description, file_name, fields) values
  ('0769f7fb-cc96-ef52-0cb3-03d9d39adcc8', 'Rate Confirmation – Standard', 'rate_confirmation', 'Agreement of rate, pickup and delivery between broker and carrier.', 'rate-confirmation-standard.pdf', ARRAY['Carrier name', 'Load number', 'Agreed rate', 'Pickup date', 'Delivery date']::text[]),
  ('c1091a9e-51ad-c3b2-65ad-1aea8694ca74', 'Bill of Lading – Standard', 'bol', 'Shipment receipt signed at pickup.', 'bol-standard.pdf', ARRAY['Shipper', 'Consignee', 'Commodity', 'Weight', 'Pieces', 'Signature']::text[]),
  ('58944019-e0e5-f8d8-5644-f5a38d872893', 'Proof of Delivery', 'pod', 'Delivery receipt signed by the consignee.', 'pod-standard.pdf', ARRAY['Delivery date', 'Receiver name', 'Condition', 'Signature']::text[]),
  ('0ce36718-0176-041f-0807-4270d734ad3b', 'Carrier Packet Checklist', 'other', 'Documents a carrier must provide before booking.', 'carrier-packet.pdf', ARRAY['MC number', 'Insurance', 'W-9', 'Authority letter']::text[]),
  ('3b7509f5-daa7-f5e5-bae4-94ecfd751eaf', 'Detention Request Form', 'other', 'Form to request detention pay.', 'detention-form.pdf', ARRAY['Arrival time', 'Departure time', 'Reason']::text[])
on conflict (id) do nothing;

insert into public.courses (id, title, description, audience, status) values
  ('7a4ffa29-56a2-5746-8133-8187a1258393', 'Dispatching Fundamentals', 'Load boards, rates, trucks, drivers and dispatch flow.', 'dispatcher', 'published'),
  ('be50c42b-1b83-c847-ec16-39369fd7f696', 'Freight Brokerage Basics', 'Shippers, carriers, margins and booking.', 'broker', 'published'),
  ('0a020992-f317-208f-0ddb-a15d60ca66bf', 'Rate Negotiation Masterclass', 'How to negotiate with brokers and shippers using rate data.', 'both', 'draft')
on conflict (id) do nothing;

insert into public.lessons (id, course_id, title, type, duration_min, sort_order, content) values
  ('d9b570bb-51d2-d59f-0e3f-5eee29863ffd', '7a4ffa29-56a2-5746-8133-8187a1258393', 'Reading the load board', 'video', 12, 1, 'Understand origin, destination, equipment and posted rate.'),
  ('d31a10e4-da7b-5951-d430-b84ea2f531f4', '7a4ffa29-56a2-5746-8133-8187a1258393', 'Deadhead and loaded miles', 'text', 8, 2, 'How empty miles affect profit.'),
  ('a7ca1476-5679-d1db-2af5-5dad2e1f71eb', '7a4ffa29-56a2-5746-8133-8187a1258393', 'Choosing truck and driver', 'pdf', 10, 3, 'Match equipment, weight and driver availability.'),
  ('bcd81a5c-960e-cc11-93a9-e5bc0e354ea1', '7a4ffa29-56a2-5746-8133-8187a1258393', 'Dispatch status updates', 'video', 9, 4, 'Assigned, picked up, in transit, delayed, delivered.'),
  ('93bb0df6-aa33-7d2a-183b-50841bfbd212', 'be50c42b-1b83-c847-ec16-39369fd7f696', 'Working with shippers', 'video', 14, 1, 'Understand shipper requirements.'),
  ('db4e2db8-ce09-b535-71af-e70bc6bb6396', 'be50c42b-1b83-c847-ec16-39369fd7f696', 'Finding carriers', 'text', 10, 2, 'Vetting carriers by MC number, insurance and rating.'),
  ('020c567b-b687-c4e3-7fe3-14dd9114892e', 'be50c42b-1b83-c847-ec16-39369fd7f696', 'Margin calculation', 'pdf', 11, 3, 'Selling rate minus carrier cost.'),
  ('7f790e07-b1a3-76a4-3de0-0c8b85532558', '0a020992-f317-208f-0ddb-a15d60ca66bf', 'Using rate insights', 'video', 15, 1, 'Estimates, trends and confidence level.'),
  ('c72e9785-52c0-77ea-b33a-c8abbe136b5a', '0a020992-f317-208f-0ddb-a15d60ca66bf', 'Counter-offer tactics', 'text', 9, 2, 'When to push and when to accept.')
on conflict (id) do nothing;

insert into public.scenarios (id, title, role, difficulty, background, instructions, time_limit_min, max_attempts, load_ids, truck_ids, driver_ids, document_ids, broker_id, shipper_id, negotiation_rule_id, scoring_profile_id, events, status) values
  ('fe24d24e-af36-6e79-4693-56eafedb1a35', 'No-rate load: Indianapolis to Twinsburg', 'dispatcher', 'easy', 'The broker has not posted a rate. Use the rate insights to decide what to ask for.', 'Analyse the load, pick a truck and driver, negotiate a rate and book the load.', 30, 3, ARRAY['d62430ce-4b26-c5f3-6f67-7921827eedea']::uuid[], ARRAY['05fcac02-895c-5c96-8ad6-061967396297', 'e9b320f2-d317-d8dd-62d5-6c0355d5c08b', '52dd0012-8f78-b2a7-e57c-4d73de72f167']::uuid[], ARRAY['e8648d82-fdea-5f8a-26ab-03cf270ccc1e', '88106670-da70-705e-903e-0911d3ae774a', '9811e999-0bb7-afed-626c-94a6cb78d14b']::uuid[], ARRAY['0769f7fb-cc96-ef52-0cb3-03d9d39adcc8', 'c1091a9e-51ad-c3b2-65ad-1aea8694ca74', '58944019-e0e5-f8d8-5644-f5a38d872893']::uuid[], '38d2343e-2aa9-1d9d-8671-e1742bc49e55', NULL, 'ae980835-6d89-3efd-024d-cd6a96be39bf', '6d9670c3-c458-5049-74a4-9efab658ee5f', '[]'::jsonb, 'published'),
  ('fbe8c53b-e5be-ca6c-e246-c1610f5c38a7', 'Long haul with delay: Dallas to Atlanta', 'dispatcher', 'medium', 'A long lane with a weather delay mid-trip.', 'Book the load, dispatch the driver and handle the delay with the broker.', 45, 3, ARRAY['94176ee3-4257-737e-b04e-6cf10f828dde']::uuid[], ARRAY['05fcac02-895c-5c96-8ad6-061967396297', '61428086-6c8f-d162-7e9b-2812011481be', 'e9b320f2-d317-d8dd-62d5-6c0355d5c08b']::uuid[], ARRAY['69c4da7d-3166-515a-6ebe-353e4a887eac', 'e8648d82-fdea-5f8a-26ab-03cf270ccc1e', '88106670-da70-705e-903e-0911d3ae774a']::uuid[], ARRAY['0769f7fb-cc96-ef52-0cb3-03d9d39adcc8', 'c1091a9e-51ad-c3b2-65ad-1aea8694ca74', '58944019-e0e5-f8d8-5644-f5a38d872893']::uuid[], '61dc73fb-e1fb-2a22-8cf1-a4198b8e3ace', NULL, 'ace9cdc6-f935-6f49-8851-374cdfd9be3f', '6d9670c3-c458-5049-74a4-9efab658ee5f', '[{"id":"ev1","atMinute":20,"type":"pickup_delay","description":"Shipper says the dock is delayed by 3 hours."}]'::jsonb, 'published'),
  ('029c487f-1e99-4ac8-53e3-e84489f42cec', 'Driver breakdown: Houston to Nashville', 'dispatcher', 'hard', 'Flatbed load, tight rate and a breakdown during transit.', 'Negotiate, book, and recover from the breakdown with a replacement driver.', 60, 2, ARRAY['81c58df4-f19f-be3c-dc2d-21410c49837b']::uuid[], ARRAY['bc44751b-cb54-282b-ac93-cf02a86a3a74', '4a4eb690-74f2-9bcc-9d07-293f358358fa']::uuid[], ARRAY['aac969e2-42ba-5beb-d824-6090460feaee', '8b60cc33-74c2-7cd3-e1a9-ba3412bfb3c6']::uuid[], ARRAY['0769f7fb-cc96-ef52-0cb3-03d9d39adcc8', 'c1091a9e-51ad-c3b2-65ad-1aea8694ca74', '58944019-e0e5-f8d8-5644-f5a38d872893', '3b7509f5-daa7-f5e5-bae4-94ecfd751eaf']::uuid[], '61dc73fb-e1fb-2a22-8cf1-a4198b8e3ace', NULL, 'c98883d8-86c3-5efc-27fb-298fd343cb11', '6d9670c3-c458-5049-74a4-9efab658ee5f', '[{"id":"ev2","atMinute":25,"type":"breakdown","description":"Truck breaks down 200 miles from pickup."}]'::jsonb, 'published'),
  ('482bffe6-8411-12e7-0be9-64ab252c4716', 'Reefer shipper request: Columbus to Newark', 'broker', 'easy', 'Harvest Foods needs a reefer carrier for frozen goods.', 'Create the load, find a carrier, negotiate and protect your margin.', 40, 3, ARRAY['643c361e-e0f6-0bfb-8eb0-6e57057d9b8e']::uuid[], ARRAY['61428086-6c8f-d162-7e9b-2812011481be', '04b0b2e9-7199-6ab4-08a2-32dacf02b84e']::uuid[], ARRAY['69c4da7d-3166-515a-6ebe-353e4a887eac', 'ccf9f8e1-9186-b3af-5b59-c7a2632b16d3']::uuid[], ARRAY['0769f7fb-cc96-ef52-0cb3-03d9d39adcc8', 'c1091a9e-51ad-c3b2-65ad-1aea8694ca74', '0ce36718-0176-041f-0807-4270d734ad3b']::uuid[], NULL, '1691ed83-2b1b-6947-b9e4-083138f405b9', 'c3bea714-c0ef-218e-c367-941625c6f754', '89cc5ad2-361d-9bc6-9d3e-59edb1222a30', '[]'::jsonb, 'published'),
  ('ce702292-5641-1b0a-77dc-580258204d06', 'Carrier cancels: Seattle to Portland', 'broker', 'medium', 'High value electronics. The first carrier cancels after booking.', 'Find a replacement carrier and keep the shipper updated.', 45, 3, ARRAY['26028f71-7fc4-f5da-7c48-91af4ccad742']::uuid[], ARRAY['52dd0012-8f78-b2a7-e57c-4d73de72f167', '7f437962-9ca7-8804-89ee-d539b6742b3e']::uuid[], ARRAY['9811e999-0bb7-afed-626c-94a6cb78d14b', 'c2591b25-c1f6-7148-c85f-6965874ff830']::uuid[], ARRAY['0769f7fb-cc96-ef52-0cb3-03d9d39adcc8', 'c1091a9e-51ad-c3b2-65ad-1aea8694ca74', '58944019-e0e5-f8d8-5644-f5a38d872893']::uuid[], NULL, 'de310a1a-118d-e4a3-0d73-24ac58f39468', 'c3bea714-c0ef-218e-c367-941625c6f754', '89cc5ad2-361d-9bc6-9d3e-59edb1222a30', '[{"id":"ev3","atMinute":15,"type":"carrier_cancel","description":"Booked carrier cancels due to equipment issue."}]'::jsonb, 'published'),
  ('54d507b2-e4fc-150e-e2e8-26d3d80354ab', 'Produce run: Miami to Jacksonville', 'broker', 'hard', 'Perishable load with a 24 hour window and a thin margin.', 'Quote the shipper, buy at a good rate and manage a late pickup.', 50, 2, ARRAY['bb4d1f77-3f52-1669-4184-d85cc0b17851']::uuid[], ARRAY['61428086-6c8f-d162-7e9b-2812011481be', '04b0b2e9-7199-6ab4-08a2-32dacf02b84e']::uuid[], ARRAY['69c4da7d-3166-515a-6ebe-353e4a887eac', 'ccf9f8e1-9186-b3af-5b59-c7a2632b16d3']::uuid[], ARRAY['0769f7fb-cc96-ef52-0cb3-03d9d39adcc8', 'c1091a9e-51ad-c3b2-65ad-1aea8694ca74', '58944019-e0e5-f8d8-5644-f5a38d872893']::uuid[], NULL, 'd3f674d9-cd63-df64-e376-136031016f75', 'c98883d8-86c3-5efc-27fb-298fd343cb11', '89cc5ad2-361d-9bc6-9d3e-59edb1222a30', '[{"id":"ev4","atMinute":30,"type":"pickup_delay","description":"Carrier reports a late pickup."}]'::jsonb, 'draft')
on conflict (id) do nothing;

insert into public.shipper_requests (id, shipper_id, origin_city, origin_state, dest_city, dest_state, pickup_date, equipment, weight_lbs, commodity, offered_rate, notes) values
  ('814403af-f53a-a50e-e283-2efdb55b3310', '1691ed83-2b1b-6947-b9e4-083138f405b9', 'Columbus', 'OH', 'Newark', 'NJ', '2026-10-15', 'Reefer', 38000, 'Frozen foods', 1850, 'Temperature must stay at -10F.'),
  ('16e6c670-7a7c-5e5a-d5f1-e7535aa10f42', '35817a26-1fb1-aeea-dc24-4c5cd38786e7', 'Houston', 'TX', 'Nashville', 'TN', '2026-10-16', 'Flatbed', 44000, 'Steel beams', 2150, 'Tarps required.'),
  ('f85db45a-ad5f-ff62-6206-bea2e118644d', 'de310a1a-118d-e4a3-0d73-24ac58f39468', 'Seattle', 'WA', 'Portland', 'OR', '2026-10-14', 'Van', 18000, 'Consumer electronics', 780, 'High value, no stops.'),
  ('ad5ecfb7-7e55-adbe-e581-79edd692c12d', 'd3f674d9-cd63-df64-e376-136031016f75', 'Miami', 'FL', 'Jacksonville', 'FL', '2026-10-17', 'Reefer', 36000, 'Fresh produce', 1100, 'Deliver within 24 hours.')
on conflict (id) do nothing;

update public.app_settings set fuel_cost_per_mile = 0.55, driver_pay_per_mile = 0.62, deadhead_rate_per_mile = 0.4, default_max_attempts = 3, default_pass_mark = 70, organisation = 'Truck Stop Academy' where id = 1;
