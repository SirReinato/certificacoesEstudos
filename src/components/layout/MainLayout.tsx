/**
 * MainLayout — Layout principal da aplicação com Sidebar fixa
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const LayoutWrapper = styled.div`
  display: flex;
  min-height: 100vh;
`;

const ContentWrapper = styled.div<{ $sidebarCollapsed: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  /* Adjust content margin based on sidebar state */
  margin-left: ${({ $sidebarCollapsed }) => ($sidebarCollapsed ? '72px' : '260px')};
  transition: margin-left ${({ theme }) => theme.transitions.normal};

  @media (max-width: 1024px) {
    margin-left: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PageContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.containers.xl};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[4]};
`;

const Footer = styled.footer`
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: auto;
`;

export function MainLayout() {
  // We need to sync the sidebar's collapsed state with the layout's margin
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setSidebarCollapsed(JSON.parse(saved));
    
    // Listen for storage changes to sync across components if needed
    const handleStorageChange = () => {
      const current = localStorage.getItem('sidebar-collapsed');
      if (current !== null) setSidebarCollapsed(JSON.parse(current));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Since Sidebar manages its own state in localStorage, we can use a custom event 
  // or just a simple interval/polling for this demo, but a better way is a Context.
  // For now, let's use a simple state sync via a custom event.
  useEffect(() => {
    const syncSidebar = (e: any) => {
      if (e.detail.collapsed !== undefined) {
        setSidebarCollapsed(e.detail.collapsed);
      }
    };
    window.addEventListener('sidebar-toggle', syncSidebar);
    return () => window.removeEventListener('sidebar-toggle', syncSidebar);
  }, []);

  return (
    <LayoutWrapper>
      <Sidebar />
      <ContentWrapper $sidebarCollapsed={sidebarCollapsed}>
        <Header />
        <MainContent>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </MainContent>
        <Footer>
          SafeZone Studies — AI-200 / AI-103 Certification Portal
        </Footer>
      </ContentWrapper>
    </LayoutWrapper>
  );
}
