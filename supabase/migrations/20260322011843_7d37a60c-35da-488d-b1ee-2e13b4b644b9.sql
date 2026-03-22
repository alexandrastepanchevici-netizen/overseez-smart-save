
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, nickname, birth_date, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'nickname', ''),
    COALESCE((NEW.raw_user_meta_data->>'birth_date')::date, '2000-01-01'::date),
    COALESCE(NEW.raw_user_meta_data->>'currency', '£')
  );
  RETURN NEW;
END;
$function$;
