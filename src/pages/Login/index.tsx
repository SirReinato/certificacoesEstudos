import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { spacing, radii, fontSizes, fontWeights, transitions } from '../../theme/tokens';
import { buttons } from '../../theme/components';

// ============================================
// STYLED COMPONENTS (Sufixo Stl)
// ============================================
const LoginContainerStl = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing[4]};
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const LoginCardStl = styled.div`
  width: 100%;
  max-width: 420px;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${radii.xl};
  padding: ${spacing[8]};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

const LogoAreaStl = styled.div`
  text-align: center;
  margin-bottom: ${spacing[6]};
`;

const AppTitleStl = styled.h1`
  font-size: ${fontSizes['2xl']};
  font-weight: ${fontWeights.bold};
  color: ${({ theme }) => theme.colors.brand.primary};
  margin-bottom: ${spacing[1]};
`;

const SubtitleStl = styled.p`
  font-size: ${fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FormStl = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
`;

const FormGroupStl = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
`;

const LabelStl = styled.label`
  font-size: ${fontSizes.xs};
  font-weight: ${fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputStl = styled.input`
  width: 100%;
  padding: ${spacing[2]} ${spacing[3]};
  font-size: ${fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${radii.md};
  transition: ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.brand.primary}25;
  }
`;

const TabsNavStl = styled.div`
  display: flex;
  gap: ${spacing[2]};
  margin-bottom: ${spacing[6]};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: ${spacing[1]};
  border-radius: ${radii.lg};
`;

const TabButtonStl = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: ${spacing[2]};
  border-radius: ${radii.md};
  border: none;
  font-size: ${fontSizes.sm};
  font-weight: ${fontWeights.semibold};
  cursor: pointer;
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.background.primary : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.brand.primary : theme.colors.text.secondary};
  box-shadow: ${({ $active }) => ($active ? '0 2px 4px rgba(0,0,0,0.06)' : 'none')};
  transition: ${transitions.fast};
`;

const SubmitButtonStl = styled.button`
  ${buttons.primary}
  width: 100%;
  padding: ${spacing[3]};
  font-size: ${fontSizes.sm};
  margin-top: ${spacing[2]};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SwitchModeButtonStl = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.brand.primary};
  font-size: ${fontSizes.xs};
  cursor: pointer;
  text-decoration: underline;
  margin-top: ${spacing[3]};
  padding: ${spacing[1]};
  text-align: center;
  width: 100%;

  &:hover {
    opacity: 0.8;
  }
`;

const ErrorAlertStl = styled.div`
  padding: ${spacing[3]};
  border-radius: ${radii.md};
  font-size: ${fontSizes.xs};
  background-color: ${({ theme }) => theme.colors.error.light};
  border: 1px solid ${({ theme }) => theme.colors.error.main};
  color: ${({ theme }) => theme.colors.error.main};
`;

export const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message);
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          navigate('/');
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao autenticar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoginContainerStl>
      <LoginCardStl>
        <LogoAreaStl>
          <AppTitleStl>SafeZone Studies</AppTitleStl>
          <SubtitleStl>
            {isSignUp
              ? 'Crie sua conta para sincronizar seus estudos'
              : 'Entre para acessar sua apostila e flashcards'}
          </SubtitleStl>
        </LogoAreaStl>

        <TabsNavStl role="tablist">
          <TabButtonStl
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            $active={!isSignUp}
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg(null);
            }}
          >
            Entrar
          </TabButtonStl>
          <TabButtonStl
            type="button"
            role="tab"
            aria-selected={isSignUp}
            $active={isSignUp}
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg(null);
            }}
          >
            Criar Conta
          </TabButtonStl>
        </TabsNavStl>

        {errorMsg && <ErrorAlertStl>{errorMsg}</ErrorAlertStl>}

        <FormStl onSubmit={handleSubmit}>
          {isSignUp && (
            <FormGroupStl>
              <LabelStl htmlFor="fullName">Nome Completo</LabelStl>
              <InputStl
                id="fullName"
                type="text"
                placeholder="Ex: Ana Souza"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </FormGroupStl>
          )}

          <FormGroupStl>
            <LabelStl htmlFor="email">E-mail</LabelStl>
            <InputStl
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroupStl>

          <FormGroupStl>
            <LabelStl htmlFor="password">Senha</LabelStl>
            <InputStl
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </FormGroupStl>

          <SubmitButtonStl type="submit" disabled={submitting}>
            {submitting ? 'Aguarde...' : isSignUp ? 'Cadastrar' : 'Entrar na Plataforma'}
          </SubmitButtonStl>
        </FormStl>

        <SwitchModeButtonStl
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg(null);
          }}
        >
          {isSignUp
            ? 'Já possui uma conta? Faça login aqui'
            : 'Não possui conta? Cadastre-se'}
        </SwitchModeButtonStl>
      </LoginCardStl>
    </LoginContainerStl>
  );
};
export default Login;
