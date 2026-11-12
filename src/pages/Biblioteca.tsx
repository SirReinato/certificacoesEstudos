/**
 * Biblioteca — Gerenciamento de conteúdos (PDFs, links, textos)
 * Usa hook real para dados do IndexedDB
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../theme';
import { useLibrary } from '../hooks';

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

const AddButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.gradients.brand.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-1px);
    color: ${({ theme }) => theme.colors.text.inverse};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  padding-left: ${({ theme }) => theme.spacing[10]};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
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

const SearchIcon = styled.span`
  position: absolute;
  left: ${({ theme }) => theme.spacing[3]};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.text.tertiary};
  pointer-events: none;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
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

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
`;

const ContentCard = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.border.secondary};
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  height: 80px;
  background: ${({ theme }) => theme.gradients.surface.card};
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
`;

const ContentTypeBadge = styled.span<{ bg?: string; color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ theme, bg }) => bg || theme.colors.brand.light};
  color: ${({ theme, color }) => color || theme.colors.brand.primary};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

const ContentTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ContentMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const ProgressContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const ProgressBar = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${({ progress }) => progress}%;
  background: ${({ theme }) => theme.gradients.brand.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const CardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'ghost' | 'danger' }>`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ theme, variant }) => {
    switch (variant) {
      case 'primary':
        return `
          background: ${theme.gradients.brand.primary};
          color: ${theme.colors.text.inverse};
          &:hover { box-shadow: ${theme.shadows.md}; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.error.light};
          color: ${theme.colors.error.main};
          &:hover { background: ${theme.colors.error.main}; color: ${theme.colors.text.inverse}; }
        `;
      default:
        return `
          background: transparent;
          color: ${theme.colors.text.secondary};
          &:hover { background: ${theme.colors.background.tertiary}; color: ${theme.colors.text.primary}; }
        `;
    }
  }}

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[4]};
`;

const EmptyIcon = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const EmptyDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.tertiary};
  max-width: 400px;
  margin: 0 auto ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const LoadingState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const StatsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  flex-wrap: wrap;
`;

const StatCard = styled.div`
  flex: 1;
  min-width: 150px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, color }) => color || theme.colors.text.primary};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export function Biblioteca() {
  const theme = useTheme();
  const { contents, loading, stats, deleteContent } = useLibrary();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredContents = contents
    .filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return b.mastery - a.mastery;
        default:
          return 0;
      }
    });

  const typeOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'link', label: 'Links' },
    { value: 'text', label: 'Textos' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Mais recentes' },
    { value: 'title', label: 'A-Z' },
    { value: 'progress', label: 'Progresso' },
  ];

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este conteúdo? Todos os flashcards associados serão removidos.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteContent(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getBadgeColors = (type: string) => {
    switch (type) {
      case 'pdf': return { bg: theme.colors.info.light, color: theme.colors.info.text };
      case 'link': return { bg: theme.colors.success.light, color: theme.colors.success.text };
      default: return { bg: theme.colors.warning.light, color: theme.colors.warning.text };
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader>
          <Title>Biblioteca</Title>
          <AddButton to="/biblioteca/novo">➕ Adicionar Conteúdo</AddButton>
        </PageHeader>
        <LoadingState>Carregando biblioteca...</LoadingState>
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div>
        <PageHeader>
          <Title>Biblioteca</Title>
          <AddButton to="/biblioteca/novo">➕ Adicionar Conteúdo</AddButton>
        </PageHeader>
        <EmptyState>
          <EmptyIcon>📚</EmptyIcon>
          <EmptyTitle>Biblioteca vazia</EmptyTitle>
          <EmptyDesc>
            Comece adicionando seu primeiro conteúdo: PDFs de guias de estudo, links do Microsoft Learn ou suas próprias anotações.
          </EmptyDesc>
          <AddButton to="/biblioteca/novo">➕ Adicionar Primeiro Conteúdo</AddButton>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader>
        <Title>Biblioteca</Title>
        <AddButton to="/biblioteca/novo">➕ Adicionar Conteúdo</AddButton>
      </PageHeader>

      {stats && (
        <StatsRow>
          <StatCard>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Conteúdos</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color={theme.colors.success.main}>{stats.totalFlashcards}</StatValue>
            <StatLabel>Flashcards</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color={theme.colors.brand.primary}>{stats.byType.pdf || 0}</StatValue>
            <StatLabel>PDFs</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color={theme.colors.ai.main}>{stats.byType.link || 0}</StatValue>
            <StatLabel>Links</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color={theme.colors.warning.main}>{stats.byType.text || 0}</StatValue>
            <StatLabel>Textos</StatLabel>
          </StatCard>
        </StatsRow>
      )}

      <Toolbar>
        <SearchBox>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput
            type="search"
            placeholder="Buscar por título, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar conteúdos"
          />
        </SearchBox>

        <FilterGroup>
          <FilterSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filtrar por tipo"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar por"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </FilterSelect>
        </FilterGroup>
      </Toolbar>

      <ContentGrid>
        {filteredContents.map((content) => {
          const badgeColors = getBadgeColors(content.type);
          return (
            <ContentCard key={content.id}>
              <CardHeader>
                <ContentTypeBadge bg={badgeColors.bg} color={badgeColors.color}>
                  {content.type === 'pdf' ? 'PDF' : content.type === 'link' ? 'Link' : 'Texto'}
                </ContentTypeBadge>
              </CardHeader>
              <CardBody>
                <ContentTitle>{content.title}</ContentTitle>
                <ContentMeta>
                  <MetaItem>🎴 {content.flashcardsCount} cards</MetaItem>
                  <MetaItem>✅ {content.reviewedCount} revisados</MetaItem>
                  <MetaItem>🕐 {content.lastStudied ? new Date(content.lastStudied).toLocaleDateString('pt-BR') : 'Nunca'}</MetaItem>
                </ContentMeta>
                <ProgressContainer>
                  <ProgressBar>
                    <ProgressFill progress={content.mastery} />
                  </ProgressBar>
                  <ProgressText>
                    <span>Domínio: {content.mastery}%</span>
                    <span>{content.flashcardsCount - content.reviewedCount} pendentes</span>
                  </ProgressText>
                </ProgressContainer>
              </CardBody>
              <CardActions>
                <ActionButton variant="primary">
                  <Link to={`/estudo?content=${content.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                    Estudar
                  </Link>
                </ActionButton>
                <ActionButton variant="ghost">Editar</ActionButton>
                <ActionButton 
                  variant="danger" 
                  onClick={() => handleDelete(content.id)}
                  disabled={deletingId === content.id}
                >
                  {deletingId === content.id ? '⏳' : '🗑️'} Excluir
                </ActionButton>
              </CardActions>
            </ContentCard>
          );
        })}
      </ContentGrid>

      {filteredContents.length === 0 && (
        <EmptyState>
          <EmptyIcon>🔍</EmptyIcon>
          <EmptyTitle>Nenhum conteúdo encontrado</EmptyTitle>
          <EmptyDesc>Tente ajustar sua busca ou filtros para encontrar o que procura.</EmptyDesc>
        </EmptyState>
      )}
    </div>
  );
}
