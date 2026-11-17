/**
 * Header — Cabeçalho principal com ações globais
 * A navegação principal agora está no Sidebar
 */

import { useState } from 'react';
import styled from 'styled-components';
import { useThemeControl } from '../../theme';
import { BrandLogo } from '../ui/BrandLogo';

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.sticky};
  background: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const HeaderInner = styled.div`
  max-width: ${({ theme }) => theme.containers.xl};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ThemeToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.background.tertiary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-color: ${({ theme }) => theme.colors.border.secondary};
    transform: scale(1.05);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
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

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.gradients.ai.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Dropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing[2]});
  right: 0;
  min-width: 200px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transform: ${({ $open }) => ($open ? 'translateY(0)' : 'translateY(-8px)')};
  transition: all ${({ theme }) => theme.transitions.fast};
  z-index: ${({ theme }) => theme.zIndices.dropdown};
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  text-align: left;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }

  &:first-child {
    border-radius: ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg} 0 0;
  }

  &:last-child {
    border-radius: 0 0 ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg};
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border.primary};
  margin: ${({ theme }) => theme.spacing[2]} 0;
`;

const SidebarToggle = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  @media (max-width: 1024px) {
    display: flex;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

export function Header() {
  const { themeName, toggleTheme } = useThemeControl();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <HeaderWrapper>
      <HeaderInner>
        <Logo>
          <BrandLogo size={32} showText />
        </Logo>

        <HeaderActions>
          <ThemeToggle
            onClick={toggleTheme}
            aria-label={themeName === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            title={themeName === 'light' ? 'Modo escuro' : 'Modo claro'}
          >
            {themeName === 'light' ? '🌙' : '☀️'}
          </ThemeToggle>

          <UserMenu>
            <UserButton
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <Avatar>R</Avatar>
              <span>Renato</span>
            </UserButton>
            <Dropdown $open={userMenuOpen} role="menu">
              <DropdownItem role="menuitem" onClick={() => setUserMenuOpen(false)}>
                Perfil
              </DropdownItem>
              <DropdownItem role="menuitem" onClick={() => setUserMenuOpen(false)}>
                Preferências
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem role="menuitem" style={{ color: 'var(--error)' }}>
                Sair
              </DropdownItem>
            </Dropdown>
          </UserMenu>

          <SidebarToggle
            aria-label="Abrir menu lateral"
            aria-expanded={false}
            aria-controls="sidebar"
          >
            ☰
          </SidebarToggle>
        </HeaderActions>
      </HeaderInner>
    </HeaderWrapper>
  );
}