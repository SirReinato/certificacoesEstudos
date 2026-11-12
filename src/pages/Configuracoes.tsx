/**
 * Configuracoes — Página de configurações do usuário
 * Usa hook real com persistência IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useTheme, useThemeControl } from '../theme';
import { useSettings, useDBInit } from '../hooks';
import { exportAllData, importAllData } from '../storage';
import type { UserSettings } from '../types';

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const SectionDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const SettingLabel = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[1]};
`;

const SettingDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin: 0;
`;

const SettingControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Toggle = styled.button<{ active: boolean }>`
  width: 52px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, active }) => (active ? theme.colors.brand.primary : theme.colors.background.tertiary)};
  border: 2px solid ${({ theme, active }) => (active ? theme.colors.brand.primary : theme.colors.border.primary)};
  position: relative;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ active }) => (active ? '24px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: white;
    box-shadow: ${({ theme }) => theme.shadows.sm};
    transition: left ${({ theme }) => theme.transitions.fast};
  }

  &:hover {
    border-color: ${({ theme, active }) => (active ? theme.colors.brand.primaryHover : theme.colors.border.secondary)};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  padding-right: ${({ theme }) => theme.spacing[8]};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing[2]} center;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const ThemeOptions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`;

const ThemeOption = styled.button<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 2px solid ${({ theme, active }) => (active ? theme.colors.brand.primary : theme.colors.border.primary)};
  background: ${({ theme, active }) => (active ? theme.colors.brand.light : theme.colors.background.primary)};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  min-width: 120px;

  &:hover {
    border-color: ${({ theme, active }) => (active ? theme.colors.brand.primary : theme.colors.border.secondary)};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const ThemePreview = styled.div<{ $themeMode: 'light' | 'dark' }>`
  width: 80px;
  height: 50px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme, $themeMode }) => ($themeMode === 'light' ? theme.gradients.surface.light : theme.gradients.surface.dark)};
  display: flex;
  gap: 4px;
  padding: 4px;
`;

const PreviewSidebar = styled.div<{ $themeMode: 'light' | 'dark' }>`
  width: 20px;
  background: ${({ theme, $themeMode }) => ($themeMode === 'light' ? theme.colors.background.secondary : theme.colors.background.primary)};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const PreviewMain = styled.div<{ $themeMode: 'light' | 'dark' }>`
  flex: 1;
  background: ${({ theme, $themeMode }) => ($themeMode === 'light' ? theme.colors.background.primary : theme.colors.background.primary)};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme, $themeMode }) => ($themeMode === 'light' ? theme.colors.border.primary : theme.colors.border.primary)};
`;

const DangerZone = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.error.light};
  padding-top: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const DangerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.error.light};
  color: ${({ theme }) => theme.colors.error.main};
  border: 1px solid ${({ theme }) => theme.colors.error.main};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.error.main};
    color: ${({ theme }) => theme.colors.text.inverse};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.error.light};
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.background.tertiary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-color: ${({ theme }) => theme.colors.border.secondary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`; 

const FileInput = styled.input`
  display: none;
`;

const DEFAULT_AI_MODELS: Record<NonNullable<UserSettings['ai']['provider']>, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  'azure-openai': 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  local: 'llama3.1',
  omniroute: 'auto',
};

const KeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;
`;

const KeyStatus = styled.span<{ $configured: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $configured }) =>
    $configured ? theme.colors.success.main : theme.colors.text.tertiary};
`;

const ShowKeyButton = styled.button`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.background.tertiary};
  color: ${({ theme }) => theme.colors.text.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;
`;

export function Configuracoes() {
  const { themeName } = useThemeControl();
  const theme = useTheme();
  const { settings, loading, updateSettings, updateTheme } = useSettings();
  const { ready: dbReady, error: dbError } = useDBInit();

  const [studyGoal, setStudyGoal] = useState(60);
  const [dailyNewCards, setDailyNewCards] = useState(20);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [showAnswerTimer, setShowAnswerTimer] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataRetention, setDataRetention] = useState<'6months' | '1year' | '2years' | 'forever'>('1year');
  const [reminderTime, setReminderTime] = useState('19:00');

  // Configuração de IA
  const [aiProvider, setAiProvider] = useState<UserSettings['ai']['provider']>('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.0-flash');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [aiKey, setAiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const studyGoalOptions = [15, 30, 45, 60, 90, 120];
  const dailyNewCardsOptions = [5, 10, 15, 20, 25, 30];
  const dataRetentionOptions = [
    { value: '6months', label: '6 meses' },
    { value: '1year', label: '1 ano' },
    { value: '2years', label: '2 anos' },
    { value: 'forever', label: 'Para sempre' },
  ] as const;

  // Sincronizar estado local com settings carregados
  useEffect(() => {
    if (settings) {
      setStudyGoal(settings.dailyGoal.studyTimeMinutes);
      setDailyNewCards(settings.dailyGoal.newCardsLimit);
      setAutoPlayAudio(settings.sessionBehavior.autoPlayAudio);
      setShowAnswerTimer(settings.sessionBehavior.showAnswerTimer);
      setNotificationsEnabled(settings.notifications.enabled);
      setDataRetention(settings.data.retention);
      setReminderTime(settings.notifications.reminderTime);
      setAiProvider(settings.ai.provider ?? 'gemini');
      setAiModel(settings.ai.model ?? 'gemini-2.0-flash');
      setAiEndpoint(settings.ai.endpoint ?? '');
      setAiKey(settings.ai.apiKey ?? '');
    }
  }, [settings]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 24px;
      background: ${type === 'success' ? theme.colors.success.main : type === 'error' ? theme.colors.error.main : theme.colors.brand.primary};
      color: ${theme.colors.text.inverse};
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 800;
      animation: slideIn 0.3s ease-out;
    `;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }, [theme]);

  const handleStudyGoalChange = useCallback(async (value: number) => {
    setStudyGoal(value);
    await updateSettings({
      dailyGoal: { ...settings!.dailyGoal, studyTimeMinutes: value },
    });
    showToast('Meta diária atualizada', 'success');
  }, [settings, updateSettings, showToast]);

  const handleDailyNewCardsChange = useCallback(async (value: number) => {
    setDailyNewCards(value);
    await updateSettings({
      dailyGoal: { ...settings!.dailyGoal, newCardsLimit: value },
    });
    showToast('Limite de novos cards atualizado', 'success');
  }, [settings, updateSettings, showToast]);

  const handleAutoPlayAudioChange = useCallback(async (value: boolean) => {
    setAutoPlayAudio(value);
    await updateSettings({
      sessionBehavior: { ...settings!.sessionBehavior, autoPlayAudio: value },
    });
    showToast(value ? 'Áudio automático ativado' : 'Áudio automático desativado', 'success');
  }, [settings, updateSettings, showToast]);

  const handleShowAnswerTimerChange = useCallback(async (value: boolean) => {
    setShowAnswerTimer(value);
    await updateSettings({
      sessionBehavior: { ...settings!.sessionBehavior, showAnswerTimer: value },
    });
    showToast(value ? 'Temporizador ativado' : 'Temporizador desativado', 'success');
  }, [settings, updateSettings, showToast]);

  const handleNotificationsChange = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    await updateSettings({
      notifications: { ...settings!.notifications, enabled: value },
    });
    showToast(value ? 'Notificações ativadas' : 'Notificações desativadas', 'success');
  }, [settings, updateSettings, showToast]);

  const handleReminderTimeChange = useCallback(async (value: string) => {
    setReminderTime(value);
    await updateSettings({
      notifications: { ...settings!.notifications, reminderTime: value },
    });
  }, [settings, updateSettings]);

  const handleDataRetentionChange = useCallback(async (value: '6months' | '1year' | '2years' | 'forever') => {
    setDataRetention(value);
    await updateSettings({
      data: { ...settings!.data, retention: value },
    });
    showToast('Retenção de dados atualizada', 'success');
  }, [settings, updateSettings, showToast]);

  const saveAISettings = useCallback(async (changes: Partial<UserSettings['ai']>) => {
    if (!settings) return;
    await updateSettings({ ai: { ...settings.ai, ...changes } });
  }, [settings, updateSettings]);

  const handleAIProviderChange = useCallback(async (provider: NonNullable<UserSettings['ai']['provider']>) => {
    const model = DEFAULT_AI_MODELS[provider];
    setAiProvider(provider);
    setAiModel(model);
    await saveAISettings({ provider, model });
    showToast('Provedor de IA atualizado', 'success');
  }, [saveAISettings, showToast]);

  const handleAIModelSave = useCallback(async () => {
    await saveAISettings({ model: aiModel.trim() });
    showToast('Modelo de IA atualizado', 'success');
  }, [aiModel, saveAISettings, showToast]);

  const handleAIApiKeySave = useCallback(async () => {
    await saveAISettings({ apiKey: aiKey.trim() });
    showToast(aiKey.trim() ? 'Chave de IA salva no navegador' : 'Chave de IA removida', 'success');
  }, [aiKey, saveAISettings, showToast]);

  const handleAIEndpointSave = useCallback(async () => {
    await saveAISettings({ endpoint: aiEndpoint.trim() });
    showToast('Endpoint de IA atualizado', 'success');
  }, [aiEndpoint, saveAISettings, showToast]);

  const handleThemeChange = useCallback(async (t: 'light' | 'dark' | 'system') => {
    await updateTheme(t);
    showToast(`Tema alterado para ${t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Sistema'}`, 'success');
  }, [updateTheme, showToast]);

  const handleExport = useCallback(async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safezone-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exportado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao exportar backup', 'error');
    }
  }, [showToast]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importAllData(text);
      showToast('Backup importado! Recarregue a página.', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast('Erro ao importar backup (formato inválido?)', 'error');
    }
    e.target.value = '';
  }, [showToast]);

  const handleDangerDelete = useCallback(async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Isso apagará TODOS os seus dados (conteúdos, flashcards, progresso, configurações). Esta ação é IRREVERSÍVEL.\n\nDigite "APAGAR TUDO" para confirmar:')) {
      return;
    }
    
    const confirmText = prompt('Digite "APAGAR TUDO" para confirmar:');
    if (confirmText !== 'APAGAR TUDO') {
      showToast('Operação cancelada', 'info');
      return;
    }

    try {
      await fetch('/api/reset', { method: 'POST' });
      await import('../storage').then(m => m.initDB());
      showToast('Todos os dados foram apagados', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showToast('Erro ao apagar dados', 'error');
    }
  }, [showToast]);

  // Mostrar loading do DB init
  if (!dbReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ 
          width: '48px', height: '48px', border: '4px solid', 
          borderColor: `${theme.colors.border.primary} ${theme.colors.brand.primary} ${theme.colors.border.primary} ${theme.colors.border.primary}`, 
          borderRadius: theme.radii.full, animation: 'spin 1s linear infinite' 
        }} />
        <p style={{ marginTop: theme.spacing[4], color: theme.colors.text.tertiary }}>Inicializando banco de dados...</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing[8] }}>
        <h2 style={{ color: theme.colors.error.main }}>Erro ao inicializar banco de dados</h2>
        <p style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>{dbError}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: theme.spacing[4], padding: `${theme.spacing[2]} ${theme.spacing[4]}`, background: theme.gradients.brand.primary, color: theme.colors.text.inverse, border: 'none', borderRadius: theme.radii.md, cursor: 'pointer' }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ 
          width: '48px', height: '48px', border: '4px solid', 
          borderColor: `${theme.colors.border.primary} ${theme.colors.brand.primary} ${theme.colors.border.primary} ${theme.colors.border.primary}`, 
          borderRadius: theme.radii.full, animation: 'spin 1s linear infinite' 
        }} />
        <p style={{ marginTop: theme.spacing[4], color: theme.colors.text.tertiary }}>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader>
        <Title>Configurações</Title>
        <Subtitle>Personalize sua experiência de estudo</Subtitle>
      </PageHeader>

      {/* Aparência */}
      <Section>
        <SectionTitle>🎨 Aparência</SectionTitle>
        <SectionDesc>Escolha o tema visual da aplicação</SectionDesc>
        
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Tema</SettingLabel>
            <SettingDescription>Modo claro, escuro ou seguir o sistema</SettingDescription>
          </SettingInfo>
          <ThemeOptions>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <ThemeOption
                key={t}
                active={themeName === t}
                onClick={() => handleThemeChange(t)}
              >
                <ThemePreview $themeMode={t === 'system' ? 'light' : t}>
                  <PreviewSidebar $themeMode={t === 'system' ? 'light' : t} />
                  <PreviewMain $themeMode={t === 'system' ? 'light' : t} />
                </ThemePreview>
                <span>{t === 'light' ? '☀️ Claro' : t === 'dark' ? '🌙 Escuro' : '💻 Sistema'}</span>
              </ThemeOption>
            ))}
          </ThemeOptions>
        </SettingRow>
      </Section>

      {/* Metas de Estudo */}
      <Section>
        <SectionTitle>🎯 Metas de Estudo</SectionTitle>
        <SectionDesc>Configure seus objetivos diários de revisão</SectionDesc>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Meta diária de estudo</SettingLabel>
            <SettingDescription>Tempo alvo para sessões de revisão</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select
              value={studyGoal}
              onChange={(e) => handleStudyGoalChange(Number(e.target.value))}
            >
              {studyGoalOptions.map((min) => (
                <option key={min} value={min}>{min} minutos</option>
              ))}
            </Select>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Novos cards por dia</SettingLabel>
            <SettingDescription>Limite de flashcards novos introduzidos diariamente</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select
              value={dailyNewCards}
              onChange={(e) => handleDailyNewCardsChange(Number(e.target.value))}
            >
              {dailyNewCardsOptions.map((n) => (
                <option key={n} value={n}>{n} cards</option>
              ))}
            </Select>
          </SettingControl>
        </SettingRow>
      </Section>

      {/* Comportamento da Sessão */}
      <Section>
        <SectionTitle>⚙️ Comportamento da Sessão</SectionTitle>
        <SectionDesc>Ajuste como as sessões de estudo funcionam</SectionDesc>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Reproduzir áudio automaticamente</SettingLabel>
            <SettingDescription>Tocar pronúncia ao virar o card (quando disponível)</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle active={autoPlayAudio} onClick={() => handleAutoPlayAudioChange(!autoPlayAudio)} aria-label="Reproduzir áudio automaticamente" />
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Mostrar temporizador de resposta</SettingLabel>
            <SettingDescription>Exibir tempo sugerido para cada nível de dificuldade</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle active={showAnswerTimer} onClick={() => handleShowAnswerTimerChange(!showAnswerTimer)} aria-label="Mostrar temporizador" />
          </SettingControl>
        </SettingRow>
      </Section>

      {/* Notificações */}
      <Section>
        <SectionTitle>🔔 Notificações</SectionTitle>
        <SectionDesc>Configure lembretes e alertas</SectionDesc>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Notificações de estudo</SettingLabel>
            <SettingDescription>Receber lembrete para sessão diária</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle active={notificationsEnabled} onClick={() => handleNotificationsChange(!notificationsEnabled)} aria-label="Notificações de estudo" />
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Horário do lembrete</SettingLabel>
            <SettingDescription>Quando enviar notificação diária</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Input type="time" value={reminderTime} onChange={(e) => handleReminderTimeChange(e.target.value)} disabled={!notificationsEnabled} />
          </SettingControl>
        </SettingRow>
      </Section>

      {/* IA e Geração de Flashcards */}
      <Section>
        <SectionTitle>🤖 IA e Flashcards</SectionTitle>
        <SectionDesc>Configure como a IA gera seus materiais de estudo</SectionDesc>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Provedor de IA</SettingLabel>
            <SettingDescription>Serviço usado para gerar a apostila e as questões do conteúdo</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select
              value={aiProvider}
              onChange={(e) => handleAIProviderChange(e.target.value as NonNullable<UserSettings['ai']['provider']>)}
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="azure-openai">Azure OpenAI</option>
              <option value="local">Local (Ollama)</option>
              <option value="omniroute">OmniRoute (Gateway)</option>
            </Select>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Modelo</SettingLabel>
            <SettingDescription>Modelo usado na geração (ex: gemini-2.0-flash, gpt-4o-mini)</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Input
              type="text"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              onBlur={handleAIModelSave}
              spellCheck={false}
            />
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Chave de API</SettingLabel>
            <SettingDescription>
              Salva apenas no IndexedDB deste navegador. Uma chave válida é necessária para gerar flashcards.
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <KeyRow>
              <Input
                type={showKey ? 'text' : 'password'}
                value={aiKey}
                placeholder="Cole sua API key"
                onChange={(e) => setAiKey(e.target.value)}
                onBlur={handleAIApiKeySave}
                spellCheck={false}
                autoComplete="off"
              />
              <ShowKeyButton type="button" onClick={() => setShowKey((v) => !v)}>
                {showKey ? 'Ocultar' : 'Mostrar'}
              </ShowKeyButton>
            </KeyRow>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Situação da IA</SettingLabel>
            <SettingDescription>
              {aiProvider === 'local'
                ? 'Modelos locais não exigem chave — informe o endpoint do Ollama.'
                : 'A chave permite gerar flashcards com base nos objetivos do exame.'}
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <KeyStatus $configured={Boolean(aiKey.trim()) || aiProvider === 'local'}>
              {Boolean(aiKey.trim()) || aiProvider === 'local'
                ? '● Configuração pronta'
                : '○ Chave de API necessária'}
            </KeyStatus>
          </SettingControl>
        </SettingRow>

        {(aiProvider === 'local' || aiProvider === 'azure-openai' || aiProvider === 'omniroute') && (
          <SettingRow>
            <SettingInfo>
              <SettingLabel>Endpoint</SettingLabel>
              <SettingDescription>
                {aiProvider === 'local'
                  ? 'Ex: http://localhost:11434/api/generate'
                  : aiProvider === 'omniroute'
                    ? 'Ex: http://localhost:20128/v1 (base do OmniRoute)'
                    : 'Ex: https://SEU-RECURSO.openai.azure.com'}
              </SettingDescription>
            </SettingInfo>
            <SettingControl>
              <Input
                type="url"
                value={aiEndpoint}
                placeholder={aiProvider === 'local' ? 'http://localhost:11434/api/generate' : aiProvider === 'omniroute' ? 'http://localhost:20128/v1' : 'https://seu-recurso.openai.azure.com'}
                onChange={(e) => setAiEndpoint(e.target.value)}
                onBlur={handleAIEndpointSave}
                spellCheck={false}
              />
            </SettingControl>
          </SettingRow>
        )}

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Proporção conteúdo/questões</SettingLabel>
            <SettingDescription>A apostila é a etapa de conteúdo; os flashcards são reservados para questões</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <span style={{ color: theme.colors.text.tertiary, fontSize: theme.fontSizes.sm }}>30% leitura / 70% questões</span>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Foco da IA</SettingLabel>
            <SettingDescription>Priorizar conceitos com maior chance de cair na prova</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle active={settings?.ai.focusOnExam ?? true} onClick={() => {}} aria-label="Foco em prova" disabled />
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Verificar atualizações do Microsoft Learn</SettingLabel>
            <SettingDescription>Checar mudanças nos objetivos do exame a cada 10 dias</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle active={settings?.ai.checkUpdates ?? true} onClick={() => {}} aria-label="Verificar atualizações" disabled />
          </SettingControl>
        </SettingRow>
      </Section>

      {/* Dados e Privacidade */}
      <Section>
        <SectionTitle>💾 Dados e Privacidade</SectionTitle>
        <SectionDesc>Gerencie seus dados locais (IndexedDB)</SectionDesc>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Retenção de dados</SettingLabel>
            <SettingDescription>Por quanto tempo manter histórico de revisões</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select
              value={dataRetention}
              onChange={(e) => handleDataRetentionChange(e.target.value as '6months' | '1year' | '2years' | 'forever')}
            >
              {dataRetentionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Exportar dados</SettingLabel>
            <SettingDescription>Baixar backup JSON com flashcards, apostilas, progresso e configurações; PDFs originais não são incluídos</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <ActionButton onClick={handleExport}>📥 Exportar JSON</ActionButton>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Importar dados</SettingLabel>
            <SettingDescription>Restaurar backup anterior</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <FileInput id="import-file" type="file" accept=".json" onChange={handleImport} />
            <label htmlFor="import-file" style={{
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              background: theme.colors.background.tertiary,
              color: theme.colors.text.primary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.radii.md,
              fontSize: theme.fontSizes.sm,
              cursor: 'pointer',
            }}>
              📤 Importar JSON
            </label>
          </SettingControl>
        </SettingRow>
      </Section>

      {/* Zona de Perigo */}
      <Section>
        <DangerZone>
          <SettingRow>
            <SettingInfo>
              <SettingLabel>Zona de Perigo</SettingLabel>
              <SettingDescription>Ações irreversíveis - use com cautela</SettingDescription>
            </SettingInfo>
            <SettingControl>
              <DangerButton onClick={handleDangerDelete}>🗑️ Apagar todos os dados</DangerButton>
            </SettingControl>
          </SettingRow>
        </DangerZone>
      </Section>
    </div>
  );
}