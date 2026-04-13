-- ============================================================================
-- Suppression du sondage : ui-redesign-survey-2025
-- Les votes associés sont supprimés automatiquement (CASCADE)
-- ============================================================================

DELETE FROM public.feature_polls
WHERE id = 'ui-redesign-survey-2025';
