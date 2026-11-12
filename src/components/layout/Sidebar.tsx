/**
 * Sidebar — Menu lateral fixo de navegação
 * Sempre visível no desktop, colapsável para economizar espaço
 */

import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useThemeControl } from '../../theme';

const SidebarWrapper = styled.aside<{ $collapsed: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: ${({ theme }) => theme.zIndices.sidebar};
  background: ${({ theme }) => theme.colors.background.primary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.primary};
  display: flex;
  flex-direction: column;
  transition: width ${({ theme }) => theme.transitions.normal};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  width: ${({ $collapsed }) => ($collapsed ? '72px' : '260px')};
  
  @media (max-width: 1024px) {
    /* On mobile, we can either hide it or keep it as a drawer. 
       The user wants it "always visible", but on mobile that's impossible.
       We'll keep the drawer behavior for mobile but make it a standard fixed sidebar for desktop. */
    position: absolute; 
    transform: translateX(-100%);
    transition: transform ${({ theme }) => theme.transitions.normal};
    &.open {
      transform: translateX(0);
    }
  }
`;

const SidebarHeader = styled.div<{ $collapsed: boolean }>`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  flex-shrink: 0;
`;

const Logo = styled(NavLink)<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  text-decoration: none;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    text-decoration: none;
  }
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.gradients.brand.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  flex-shrink: 0;
`;

const LogoText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  background: ${({ theme }) => theme.gradients.brand.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ToggleButton = styled.button<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-color: ${({ theme }) => theme.colors.border.secondary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }

  svg {
    transition: transform ${({ theme }) => theme.transitions.fast};
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(180deg)' : 'rotate(0deg)')};
  }
`;

const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing[4]} 0;
`;

const NavSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const NavSectionTitle = styled.h3<{ $collapsed: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.tertiary};
  padding: 0 ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  height: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const NavItem = styled(NavLink)<{ $collapsed: boolean; $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  color: ${({ theme, $active }) => ($active ? theme.colors.brand.primary : theme.colors.text.secondary)};
  background: ${({ theme, $active }) => ($active ? theme.colors.brand.light : 'transparent')};
  border-left: 3px solid ${({ theme, $active }) => ($active ? theme.colors.brand.primary : 'transparent')};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => theme.colors.brand.light};
    text-decoration: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 3px 0 0 ${({ theme }) => theme.colors.brand.primary};
  }
`;

const NavItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const NavItemText = styled.span<{ $collapsed: boolean }>`
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const NavItemBadge = styled.span<{ $collapsed: boolean }>`
  margin-left: auto;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.brand.primary};
  background: ${({ theme }) => theme.colors.brand.light};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.full};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const SidebarFooter = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};
  flex-shrink: 0;
`;

const UserInfo = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.gradients.ai.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  flex-shrink: 0;
`;

const UserDetails = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  width: ${({ $collapsed }) => ($collapsed ? 0 : 'auto')};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Nav items configuration
const navSections = [
  {
    title: 'Principal',
    items: [
      { path: '/', icon: '📊', label: 'Dashboard', badge: null },
      { path: '/estudo', icon: '🎯', label: 'Estudo Diário', badge: null },
      { path: '/biblioteca', icon: '📚', label: 'Biblioteca', badge: null },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { path: '/biblioteca/novo', icon: '➕', label: 'Novo Conteúdo', badge: null },
      { path: '/config', icon: '⚙️', label: 'Configurações', badge: null },
    ],
  },
] as const;

export function Sidebar() {
  const { themeName, toggleTheme } = useThemeControl();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) setCollapsed(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
      // Dispatch event to sync with MainLayout
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed } }));
    }
  }, [collapsed, mounted]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (!mounted) {
    return <SidebarWrapper $collapsed={false} style={{ visibility: 'hidden' }} />;
  }

  return (
    <SidebarWrapper $collapsed={collapsed}>
      <SidebarHeader $collapsed={collapsed}>
        <Logo to="/" $collapsed={collapsed}>
          <LogoIcon>SZ</LogoIcon>
          <LogoText>SafeZone Studies</LogoText>
        </Logo>
        <ToggleButton $collapsed={collapsed} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'} title={collapsed ? 'Expandir menu' : 'Colapsar menu'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </ToggleButton>
      </SidebarHeader>

      <Nav>
        {navSections.map((section) => (
          <NavSection key={section.title}>
            <NavSectionTitle $collapsed={collapsed}>{section.title}</NavSectionTitle>
            {section.items.map((item) => (
              <NavItem
              key={item.path}
              to={item.path}
              $collapsed={collapsed}
              $active={isActive(item.path)}
              >
                <NavItemIcon aria-hidden="true">{item.icon}</NavItemIcon>
                <NavItemText $collapsed={collapsed}>{item.label}</NavItemText>
                {item.badge && !collapsed && <NavItemBadge $collapsed={collapsed}>{item.badge}</NavItemBadge>}
              </NavItem>
            ))}
          </NavSection>
        ))}
      </Nav>

      <SidebarFooter>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            onClick={toggleTheme}
            aria-label={themeName === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: '10px 12px',
              background: 'transparent',
              border: `1px solid ${themeName === 'light' ? '#e5e7eb' : '#374151'}`,
              borderRadius: 8,
              color: 'inherit',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={themeName === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            <span style={{ fontSize: '18px' }} aria-hidden="true">
              {themeName === 'light' ? '🌙' : '☀️'}
            </span>
            <span style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto', overflow: 'hidden', transition: 'all 0.15s ease' }}>
              {themeName === 'light' ? 'Modo escuro' : 'Modo claro'}
            </span>
          </button>
        </div >

        <UserInfo $collapsed={collapsed}>
          <UserAvatar>R</UserAvatar>
          <UserDetails $collapsed={collapsed}>
            <UserName>Renato</UserName>
            <UserRole>AI-200 / AI-103</UserRole>
          </UserDetails>
        </UserInfo>
      </SidebarFooter>
    </SidebarWrapper>
  );
}
