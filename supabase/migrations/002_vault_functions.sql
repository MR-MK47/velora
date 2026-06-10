-- 002_vault_functions.sql — Vault-backed secret CRUD functions

CREATE OR REPLACE FUNCTION public.create_or_update_secret(p_key TEXT, p_value TEXT, p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if a secret_id already exists for this key+user
  SELECT value::uuid INTO v_existing_id
  FROM public.settings
  WHERE key = p_key AND user_id = p_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing Vault secret
    PERFORM vault.update_secret(v_existing_id, p_value);
    RETURN v_existing_id;
  ELSE
    -- Create new Vault secret
    v_secret_id := vault.create_secret(p_value, p_key, 'User secret for ' || p_key);
    -- Store the secret_id in settings table
    INSERT INTO public.settings (user_id, key, value)
    VALUES (p_user_id, p_key, v_secret_id::text)
    ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    RETURN v_secret_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_decrypted_secret(p_secret_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plaintext TEXT;
BEGIN
  SELECT decrypted_secret INTO v_plaintext
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id;
  RETURN v_plaintext;
END;
$$;

-- get_decrypted_secrets: returns ALL decrypted secrets for the service worker
-- (no arguments needed — used by worker.py with service_role)
CREATE OR REPLACE FUNCTION public.get_decrypted_secrets()
RETURNS TABLE(key_name TEXT, plaintext_value TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT s.key::TEXT, d.decrypted_secret::TEXT
  FROM public.settings s
  JOIN vault.decrypted_secrets d ON d.id = s.value::uuid;
END;
$$;
