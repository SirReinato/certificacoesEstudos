/**
 * ExamTrapCallout — Alerta de armadilhas e pegadinhas de exame Microsoft
 * Padrão Styled-Components com sufixo Stl e tokens de tema
 */

import styled from 'styled-components';

interface ExamTrapCalloutProps {
  traps: string[];
}

const CalloutContainerStl = styled.div`
  margin: ${({ theme }) => theme.spacing[4]} 0;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.warning.light || 'rgba(245, 158, 11, 0.1)'};
  border-left: 4px solid ${({ theme }) => theme.colors.warning.main || '#f59e0b'};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const CalloutHeaderStl = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.warning.dark || '#b45309'};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CalloutListStl = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing[5]};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
`;

const CalloutItemStl = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  &:last-child {
    margin-bottom: 0;
  }
`;

export function ExamTrapCallout({ traps }: ExamTrapCalloutProps) {
  if (!traps || traps.length === 0) return null;

  return (
    <CalloutContainerStl>
      <CalloutHeaderStl>
        <span>⚠️</span>
        <span>Armadilha de Exame Microsoft (Pegadinha Frequente)</span>
      </CalloutHeaderStl>
      <CalloutListStl>
        {traps.map((trap, idx) => (
          <CalloutItemStl key={idx}>{trap}</CalloutItemStl>
        ))}
      </CalloutListStl>
    </CalloutContainerStl>
  );
}
