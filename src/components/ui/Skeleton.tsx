/**
 * Skeleton — Componente de placeholder para carregamento
 */

import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const SkeletonBase = styled.div`
  background: ${({ theme }) => theme.colors.background.tertiary};
  background-image: linear-gradient(
    to right, 
    transparent 0%, 
    ${({ theme }) => theme.colors.border.primary} 20%, 
    transparent 40%, 
    transparent 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  display: inline-block;
  position: relative;
  animation: ${shimmer} 1.5s linear infinite forwards;
  border-radius: 4px;
`;

export const Skeleton = ({ width = '100%', height = '20px' }: { width?: string; height?: string }) => (
  <SkeletonBase style={{ width, height }} />
);

export const SkeletonCircle = ({ size = '40px' }: { size?: string }) => (
  <SkeletonBase style={{ width: size, height: size, borderRadius: '50%' }} />
);
