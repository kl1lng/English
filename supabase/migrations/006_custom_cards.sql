-- Phase 3 follow-up: custom phrases from the speaking-partner review can join the word deck.
-- Adds two optional columns to word_cards. Rows for lesson words leave them empty.
alter table public.word_cards add column if not exists custom_term text;
alter table public.word_cards add column if not exists custom_example text;

-- Rollback (do not run unless you want to undo this migration):
--   alter table public.word_cards drop column if exists custom_term;
--   alter table public.word_cards drop column if exists custom_example;
