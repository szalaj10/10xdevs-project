-- =====================================================================================
-- Seed Data for Development
-- =====================================================================================
-- Purpose: Create test data for local development
-- Note: Test user must be created via Supabase Auth first
-- 
-- To create the test user, run: node setup-test-user.js
-- Or manually sign up at: http://127.0.0.1:3000/login
--   Email: mszalajko@manufacturo.com
--   Password: Pracownik123
-- =====================================================================================

-- Note: Sample data insertion disabled by default since user needs to be created via Auth first
-- Uncomment the following lines after creating the test user (run: node setup-test-user.js)

/*
-- Sample generation record for the test user (0b4e8bb7-ceda-46a0-9760-672b856f2f4a)
INSERT INTO generations (
  user_id,
  model,
  generated_count,
  accepted_unedited_count,
  accepted_edited_count,
  source_text_hash,
  source_text_length
)
VALUES (
  '0b4e8bb7-ceda-46a0-9760-672b856f2f4a',
  'mock/test-data',
  5,
  3,
  1,
  'sample_hash_123',
  25
)
ON CONFLICT DO NOTHING;

-- Sample flashcards for the test user
INSERT INTO flashcards (user_id, front, back, source)
VALUES
  ('0b4e8bb7-ceda-46a0-9760-672b856f2f4a', 'What is TypeScript?', 'A typed superset of JavaScript', 'Sample Data'),
  ('0b4e8bb7-ceda-46a0-9760-672b856f2f4a', 'What is React?', 'A JavaScript library for building user interfaces', 'Sample Data'),
  ('0b4e8bb7-ceda-46a0-9760-672b856f2f4a', 'What is Astro?', 'A modern web framework for building fast websites', 'Sample Data')
ON CONFLICT DO NOTHING;
*/

