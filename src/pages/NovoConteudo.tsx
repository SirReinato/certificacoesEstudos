/**
 * NovoConteudo — Página para adicionar novo conteúdo (PDF, Link, Texto)
 * Usa hooks reais de processamento e IA
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../theme';
import { useContentProcessor } from '../hooks';
import { fetchAndExtractLink } from '../services/contentIngestion';

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  background: ${({ theme }) => theme.gradients.brand.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BackButton = styled.button`
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

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const TabNav = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, active }) => (active ? theme.colors.background.primary : 'transparent')};
  color: ${({ theme, active }) => (active ? theme.colors.brand.primary : theme.colors.text.secondary)};
  border: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme, active }) => (active ? theme.shadows.sm : 'none')};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme, active }) => (active ? theme.colors.background.primary : theme.colors.background.tertiary)};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const FormSection = styled.div<{ visible: boolean }>`
  display: ${({ visible }) => (visible ? 'block' : 'none')};
  animation: fadeIn 0.2s ease-out;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const SectionDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const DropZone = styled.div<{ active: boolean; $hasFile: boolean }>`
  border: 2px dashed ${({ theme, active, $hasFile }) => 
    active ? theme.colors.brand.primary : $hasFile ? theme.colors.success.main : theme.colors.border.primary
  };
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  text-align: center;
  background: ${({ theme, active, $hasFile }) => 
    active ? theme.colors.brand.light : $hasFile ? theme.colors.success.light : theme.colors.background.secondary
  };
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: ${({ theme, $hasFile }) => ($hasFile ? theme.colors.success.main : theme.colors.brand.primary)};
    background: ${({ theme, $hasFile }) => ($hasFile ? theme.colors.success.light : theme.colors.brand.light)};
  }
`;

const DropZoneIcon = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const DropZoneTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
`;

const DropZoneText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const FileName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
`;

const RemoveFileButton = styled.button`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.error.light};
  color: ${({ theme }) => theme.colors.error.main};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.error.main};
    color: ${({ theme }) => theme.colors.text.inverse};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  resize: vertical;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const HelperText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme, disabled }) => (disabled ? theme.colors.background.tertiary : theme.gradients.brand.primary)};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.base};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

  &:hover:not(:disabled) {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const ProcessingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${({ theme }) => theme.zIndices.modal};
`;

const ProcessingCard = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${({ theme }) => theme.colors.border.primary};
  border-top-color: ${({ theme }) => theme.colors.brand.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  animation: spin 1s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing[4]};

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ProcessingTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const ProcessingText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const ProcessingStep = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing[4]} 0;
`;

const ProgressFill = styled.div<{ percent: number }>`
  height: 100%;
  width: ${({ percent }) => percent}%;
  background: ${({ theme }) => theme.gradients.brand.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const Toast = styled.div<{ type: 'success' | 'error' | 'info' }>`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing[6]};
  right: ${({ theme }) => theme.spacing[6]};
  max-width: min(480px, calc(100vw - 2rem));
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ theme, type }) => 
    type === 'success' ? theme.colors.success.main :
    type === 'error' ? theme.colors.error.main :
    theme.colors.brand.primary
  };
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  animation: slideIn 0.3s ease-out;
  z-index: ${({ theme }) => theme.zIndices.toast};

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

const ToastMessage = styled.span`
  flex: 1;
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  overflow-wrap: anywhere;
`;

const ToastIcon = styled.span`
  flex-shrink: 0;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const ToastAction = styled.button`
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: inherit;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;
`;

export function NovoConteudo() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'markdown' | 'pdf' | 'link' | 'text'>('markdown');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Markdown (NotebookLM) state
  const [mdFile, setMdFile] = useState<File | null>(null);
  const [mdContent, setMdContent] = useState('');
  const [mdTitle, setMdTitle] = useState('');
  const [mdTags, setMdTags] = useState('notebooklm, azure');
  const mdFileInputRef = useRef<HTMLInputElement>(null);
  
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfTags, setPdfTags] = useState('');
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkTags, setLinkTags] = useState('');
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  
  // Text state
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTags, setTextTags] = useState('');

  // Hook de processamento
  const {
    processing,
    progress,
    error,
    processMarkdown,
    processPDF,
    processLink,
    processText,
    validate,
  } = useContentProcessor();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Sincronizar erro do hook com toast
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  // Markdown handlers
  const handleMdDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown' || file.type === 'text/plain')) {
      setMdFile(file);
      if (!mdTitle) setMdTitle(file.name.replace(/\.md$/i, ''));
    } else {
      showToast('Por favor, selecione um arquivo Markdown (.md) válido', 'error');
    }
  }, [mdTitle, showToast]);

  const handleMdFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown' || file.type === 'text/plain')) {
      setMdFile(file);
      if (!mdTitle) setMdTitle(file.name.replace(/\.md$/i, ''));
    } else if (file) {
      showToast('Por favor, selecione um arquivo Markdown (.md) válido', 'error');
    }
  }, [mdTitle, showToast]);

  const removeMdFile = useCallback(() => {
    setMdFile(null);
    setMdTitle('');
  }, []);

  const handleMarkdownSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate('markdown', {
      title: mdTitle,
      file: mdFile || undefined,
      text: mdContent || undefined,
    });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    try {
      const payload = mdFile || mdContent;
      const tags = mdTags.split(',').map((t) => t.trim()).filter(Boolean);
      const result = await processMarkdown(payload, mdTitle, tags);
      showToast(`Notas do NotebookLM processadas! ${result.content.flashcardsCount} questões geradas.`, 'success');
      navigate('/biblioteca');
    } catch {
      // Erro tratado pelo useEffect via hook error state
    }
  }, [mdFile, mdContent, mdTitle, mdTags, validate, processMarkdown, showToast, navigate]);

  // PDF handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      if (!pdfTitle) setPdfTitle(file.name.replace('.pdf', ''));
    } else {
      showToast('Por favor, selecione um arquivo PDF válido', 'error');
    }
  }, [pdfTitle, showToast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      if (!pdfTitle) setPdfTitle(file.name.replace('.pdf', ''));
    } else if (file) {
      showToast('Por favor, selecione um arquivo PDF válido', 'error');
    }
  }, [pdfTitle, showToast]);

  const removePdfFile = useCallback(() => {
    setPdfFile(null);
    setPdfTitle('');
  }, []);

  // Link handlers
  const fetchLinkMetadata = useCallback(async () => {
    if (!linkUrl) return;
    setFetchingMetadata(true);
    try {
      const fetched = await fetchAndExtractLink(linkUrl);
      setLinkTitle(fetched.title);
      showToast('Título obtido com sucesso', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível obter o título do link',
        'error'
      );
    } finally {
      setFetchingMetadata(false);
    }
  }, [linkUrl, showToast]);

  // Submit handlers
  const handlePdfSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate('pdf', { title: pdfTitle, file: pdfFile || undefined });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    try {
      const result = await processPDF(pdfFile!, pdfTitle, pdfTags.split(',').map(t => t.trim()).filter(Boolean));
      showToast(`PDF processado! ${result.content.flashcardsCount} flashcards gerados.`, 'success');
      navigate('/biblioteca');
    } catch {
      // Erro tratado pelo useEffect via hook error state
    }
  }, [pdfFile, pdfTitle, pdfTags, validate, processPDF, showToast, navigate]);

  const handleLinkSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackTitle = (() => {
      try {
        return new URL(linkUrl).hostname.replace(/^www\./, '');
      } catch {
        return linkUrl;
      }
    })();
    const validation = validate('link', { title: linkTitle.trim() || fallbackTitle, url: linkUrl });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    try {
      const result = await processLink(linkUrl, linkTitle.trim(), linkTags.split(',').map(t => t.trim()).filter(Boolean));
      showToast(`Link processado! ${result.content.flashcardsCount} flashcards gerados.`, 'success');
      navigate('/biblioteca');
    } catch {
      // Erro tratado pelo useEffect via hook error state
    }
  }, [linkUrl, linkTitle, linkTags, validate, processLink, showToast, navigate]);

  const handleTextSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate('text', { title: textTitle, text: textContent });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    try {
      const result = await processText(textContent, textTitle, textTags.split(',').map(t => t.trim()).filter(Boolean));
      showToast(`Texto processado! ${result.content.flashcardsCount} flashcards gerados.`, 'success');
      navigate('/biblioteca');
    } catch {
      // Erro tratado pelo useEffect via hook error state
    }
  }, [textTitle, textContent, textTags, validate, processText, showToast, navigate]);

  return (
    <>
      <div>
        <PageHeader>
          <Title>Adicionar Conteúdo</Title>
          <BackButton onClick={() => navigate(-1)}>← Voltar</BackButton>
        </PageHeader>

        <FormContainer>
          <TabNav role="tablist" aria-label="Tipo de conteúdo">
            <TabButton
              role="tab"
              aria-selected={activeTab === 'markdown'}
              active={activeTab === 'markdown'}
              onClick={() => setActiveTab('markdown')}
              disabled={processing}
            >
              📝 Markdown (NotebookLM)
            </TabButton>
            <TabButton
              role="tab"
              aria-selected={activeTab === 'pdf'}
              active={activeTab === 'pdf'}
              onClick={() => setActiveTab('pdf')}
              disabled={processing}
            >
              📄 PDF
            </TabButton>
            <TabButton
              role="tab"
              aria-selected={activeTab === 'link'}
              active={activeTab === 'link'}
              onClick={() => setActiveTab('link')}
              disabled={processing}
            >
              🔗 Link
            </TabButton>
            <TabButton
              role="tab"
              aria-selected={activeTab === 'text'}
              active={activeTab === 'text'}
              onClick={() => setActiveTab('text')}
              disabled={processing}
            >
              ✏️ Texto
            </TabButton>
          </TabNav>

          {/* Markdown (NotebookLM) Tab */}
          <FormSection visible={activeTab === 'markdown'}>
            <form onSubmit={handleMarkdownSubmit}>
              <SectionTitle>Notas Markdown (.md) do NotebookLM</SectionTitle>
              <SectionDesc>
                Faça upload do arquivo .md gerado pelo Google NotebookLM ou cole o texto. O material será fatiado semanticamente por tópicos para gerar apostila teórica e questões práticas 30/70.
              </SectionDesc>

              <FormGroup>
                <Label htmlFor="md-file">Arquivo Markdown (.md)</Label>
                <DropZone
                  active={false}
                  $hasFile={!!mdFile}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={handleMdDrop}
                  onClick={() => mdFileInputRef.current?.click()}
                >
                  <input
                    ref={mdFileInputRef}
                    id="md-file"
                    type="file"
                    accept=".md,text/markdown,text/plain"
                    style={{ display: 'none' }}
                    onChange={handleMdFileSelect}
                    disabled={processing}
                  />
                  {!mdFile ? (
                    <>
                      <DropZoneIcon>📥</DropZoneIcon>
                      <DropZoneText>
                        <strong>Arraste seu arquivo .md do NotebookLM aqui</strong> ou clique para navegar
                      </DropZoneText>
                      <HelperText>Aceita arquivos Markdown (.md) até 20MB</HelperText>
                    </>
                  ) : (
                    <FileInfo>
                      <FileName>📄 {mdFile.name} ({(mdFile.size / 1024).toFixed(1)} KB)</FileName>
                      <RemoveFileButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMdFile();
                        }}
                      >
                        Remover
                      </RemoveFileButton>
                    </FileInfo>
                  )}
                </DropZone>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="md-content">Ou cole o texto Markdown diretamente (opcional se enviou arquivo)</Label>
                <Textarea
                  id="md-content"
                  placeholder="# Domínio 1: Planejar Soluções de IA...&#10;&#10;Cole aqui as anotações do NotebookLM..."
                  value={mdContent}
                  onChange={(e) => setMdContent(e.target.value)}
                  disabled={processing || !!mdFile}
                  style={{ minHeight: '140px' }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="md-title">Título do Conteúdo *</Label>
                <Input
                  id="md-title"
                  type="text"
                  placeholder="Ex: NotebookLM - AI-200 Domínio 1 e 2"
                  value={mdTitle}
                  onChange={(e) => setMdTitle(e.target.value)}
                  required
                  disabled={processing}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="md-tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="md-tags"
                  type="text"
                  placeholder="Ex: ai-200, notebooklm, azure, visão"
                  value={mdTags}
                  onChange={(e) => setMdTags(e.target.value)}
                  disabled={processing}
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={processing || (!mdFile && !mdContent.trim())}>
                {processing ? 'Processando Markdown...' : '🤖 Gerar Apostila 30/70 e Questões'}
              </SubmitButton>
            </form>
          </FormSection>

          {/* PDF Tab */}
          <FormSection visible={activeTab === 'pdf'}>
            <form onSubmit={handlePdfSubmit}>
              <SectionTitle>Upload de PDF</SectionTitle>
              <SectionDesc>Faça upload de guias de estudo, transcrições de aula ou documentos em PDF</SectionDesc>

              <FormGroup>
                <Label htmlFor="pdf-file">Arquivo PDF</Label>
                <DropZone
                  ref={dropZoneRef}
                  active={false}
                  $hasFile={!!pdfFile}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    id="pdf-file"
                    type="file"
                    accept="application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    disabled={processing}
                  />
                  {!pdfFile ? (
                    <>
                      <DropZoneIcon>📄</DropZoneIcon>
                      <DropZoneTitle>Arraste seu PDF aqui ou clique para selecionar</DropZoneTitle>
                      <DropZoneText>Suporta PDFs de texto, transcrições, guias de estudo com imagens</DropZoneText>
                    </>
                  ) : (
                    <>
                      <FileInfo>
                        <FileName>{pdfFile.name}</FileName>
                        <RemoveFileButton
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removePdfFile();
                          }}
                          disabled={processing}
                        >
                          Remover
                        </RemoveFileButton>
                      </FileInfo>
                    </>
                  )}
                </DropZone>
                <HelperText>Máximo 50MB. O PDF original fica salvo no servidor; PDFs com texto extraível funcionam melhor para gerar a apostila e as questões.</HelperText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="pdf-title">Título do conteúdo *</Label>
                <Input
                  id="pdf-title"
                  type="text"
                  placeholder="Ex: Guia AI-200 - Azure AI Engineer"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  required
                  disabled={processing}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="pdf-tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="pdf-tags"
                  type="text"
                  placeholder="Ex: azure, app-service, paas, certificação"
                  value={pdfTags}
                  onChange={(e) => setPdfTags(e.target.value)}
                  disabled={processing}
                />
                <HelperText>Tags ajudam a organizar e filtrar sua biblioteca</HelperText>
              </FormGroup>

              <SubmitButton type="submit" disabled={processing || !pdfFile}>
                {processing ? 'Processando PDF...' : '🤖 Gerar apostila e questões'}
              </SubmitButton>
            </form>
          </FormSection>

          {/* Link Tab */}
          <FormSection visible={activeTab === 'link'}>
            <form onSubmit={handleLinkSubmit}>
              <SectionTitle>Link Externo</SectionTitle>
              <SectionDesc>Adicione links do Microsoft Learn, documentação oficial, artigos técnicos</SectionDesc>

              <FormGroup>
                <Label htmlFor="link-url">URL do conteúdo *</Label>
                <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                  <Input
                    id="link-url"
                    type="url"
                    placeholder="https://learn.microsoft.com/pt-br/training/modules/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                    disabled={processing}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={fetchLinkMetadata}
                    disabled={fetchingMetadata || !linkUrl || processing}
                    style={{
                      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                      background: fetchingMetadata ? theme.colors.background.tertiary : theme.gradients.ai.primary,
                      color: theme.colors.text.inverse,
                      border: 'none',
                      borderRadius: theme.radii.md,
                      fontWeight: theme.fontWeights.medium,
                      cursor: fetchingMetadata ? 'not-allowed' : 'pointer',
                      opacity: fetchingMetadata ? 0.7 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fetchingMetadata ? '🔄 Buscando...' : '🔍 Obter info'}
                  </button>
                </div >
                <HelperText>Cole a URL de uma página do Microsoft Learn, docs oficiais ou artigos técnicos</HelperText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="link-title">Título (opcional)</Label>
                <Input
                  id="link-title"
                  type="text"
                  placeholder="Deixe vazio para usar o título da página"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  disabled={processing}
                />
                <HelperText>Se ficar vazio, usamos o título detectado na página ou o domínio do link</HelperText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="link-tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="link-tags"
                  type="text"
                  placeholder="Ex: azure, functions, serverless, certificação"
                  value={linkTags}
                  onChange={(e) => setLinkTags(e.target.value)}
                  disabled={processing}
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={processing || !linkUrl}>
                {processing ? 'Processando link...' : '🤖 Gerar apostila e questões'}
              </SubmitButton>
            </form>
          </FormSection>

          {/* Text Tab */}
          <FormSection visible={activeTab === 'text'}>
            <form onSubmit={handleTextSubmit}>
              <SectionTitle>Texto Manual</SectionTitle>
              <SectionDesc>Cole suas anotações, resumos ou transcrições diretamente</SectionDesc>

              <FormGroup>
                <Label htmlFor="text-title">Título *</Label>
                <Input
                  id="text-title"
                  type="text"
                  placeholder="Ex: Minhas anotações - Azure Storage"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  required
                  disabled={processing}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="text-content">Conteúdo *</Label>
                <Textarea
                  id="text-content"
                  placeholder="Cole aqui seu texto, anotações, resumos...&#10;&#10;A IA vai criar uma apostila de estudo e flashcards somente com questões."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  required
                  disabled={processing}
                />
                <HelperText>Quanto mais estruturado o texto (tópicos, definições, exemplos), melhor a apostila e as questões geradas</HelperText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="text-tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="text-tags"
                  type="text"
                  placeholder="Ex: azure, storage, blob, cosmos-db"
                  value={textTags}
                  onChange={(e) => setTextTags(e.target.value)}
                  disabled={processing}
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={processing || !textContent}>
                {processing ? 'Processando texto...' : '🤖 Gerar apostila e questões'}
              </SubmitButton>
            </form>
          </FormSection>
        </FormContainer>
      </div >

      {toast && (
        <Toast type={toast.type} onClick={() => setToast(null)}>
          <ToastIcon>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</ToastIcon>
          <ToastMessage>{toast.message}</ToastMessage>
          <ToastAction onClick={(e) => { e.stopPropagation(); setToast(null); }}>Fechar</ToastAction>
        </Toast>
      )}

      {processing && (
        <ProcessingOverlay>
          <ProcessingCard>
            <Spinner />
            <ProcessingTitle>
              {activeTab === 'markdown'
                ? 'Processando Notas do NotebookLM...'
                : activeTab === 'pdf'
                ? 'Processando PDF...'
                : activeTab === 'link'
                ? 'Analisando link...'
                : 'Analisando texto...'}
            </ProcessingTitle>
            <ProcessingText>
              {activeTab === 'markdown' && 'Fatiando semanticamente e gerando apostila teórica e questões 30/70...'}
              {activeTab === 'pdf' && 'Extraindo texto e preparando apostila e questões...'}
              {activeTab === 'link' && 'Buscando conteúdo para montar apostila e questões...'}
              {activeTab === 'text' && 'Preparando apostila de estudo e questões...'}
            </ProcessingText>
            {progress && (
              <>
                <ProgressBar>
                  <ProgressFill percent={progress.percent} />
                </ProgressBar>
                <ProcessingStep>{progress.stage} ({progress.percent}%)</ProcessingStep>
              </>
            )}
          </ProcessingCard>
        </ProcessingOverlay>
      )}
    </>
  );
}
