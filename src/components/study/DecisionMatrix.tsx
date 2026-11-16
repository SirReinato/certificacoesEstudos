/**
 * DecisionMatrix — Matriz / Tabela comparativa de serviços e SKUs do Azure
 * Padrão Styled-Components com sufixo Stl e tokens de tema
 */

import styled from 'styled-components';

interface DecisionMatrixProps {
  table?: {
    headers: string[];
    rows: string[][];
  };
}

const TableWrapperStl = styled.div`
  margin: ${({ theme }) => theme.spacing[4]} 0;
  overflow-x: auto;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const TableStl = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: left;
`;

const TableHeadStl = styled.thead`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border.primary};
`;

const TableHeaderCellStl = styled.th`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
`;

const TableBodyStl = styled.tbody`
  & tr:nth-child(even) {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }
  & tr:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
  }
`;

const TableRowStl = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  &:last-child {
    border-bottom: none;
  }
`;

const TableCellStl = styled.td`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

export function DecisionMatrix({ table }: DecisionMatrixProps) {
  if (!table || !table.headers || table.headers.length === 0 || !table.rows || table.rows.length === 0) {
    return null;
  }

  return (
    <TableWrapperStl>
      <TableStl>
        <TableHeadStl>
          <tr>
            {table.headers.map((h, idx) => (
              <TableHeaderCellStl key={idx}>{h}</TableHeaderCellStl>
            ))}
          </tr>
        </TableHeadStl>
        <TableBodyStl>
          {table.rows.map((row, rIdx) => (
            <TableRowStl key={rIdx}>
              {row.map((cell, cIdx) => (
                <TableCellStl key={cIdx}>{cell}</TableCellStl>
              ))}
            </TableRowStl>
          ))}
        </TableBodyStl>
      </TableStl>
    </TableWrapperStl>
  );
}
