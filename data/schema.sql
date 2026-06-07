-- =====================================================================
-- ESTUDIAPP WEB - ESQUEMA DE BASE DE DATOS PARA SINCRONIZACIÓN
-- Ejecuta este script en el SQL Editor de tu consola Supabase.
-- =====================================================================

-- 1. Crear la tabla de progreso del usuario
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    srs_data JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{"streak": 0, "lastStudyDate": null, "totalReviews": 0, "totalCorrect": 0}'::jsonb,
    progression JSONB DEFAULT '{"level": 1, "xp": 0, "achievements": []}'::jsonb,
    difficulty JSONB DEFAULT '{"mode": "linear", "level": "medium"}'::jsonb,
    high_scores JSONB DEFAULT '{}'::jsonb,
    custom_decks JSONB DEFAULT '[]'::jsonb,
    tts_pref JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar seguridad de nivel de fila (Row Level Security - RLS)
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas de seguridad para permitir a los usuarios gestionar únicamente su propio progreso

-- Política para lectura
CREATE POLICY "Permitir lectura del propio progreso" ON public.user_progress
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para inserción inicial
CREATE POLICY "Permitir inserción de propio progreso" ON public.user_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para actualización
CREATE POLICY "Permitir actualización de propio progreso" ON public.user_progress
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. Crear una función y trigger para actualizar automáticamente la fecha 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
