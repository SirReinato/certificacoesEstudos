import React, { useId } from 'react';
import styled from 'styled-components';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const BrandLogoWrapperStl = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-shrink: 0;
`;

const BrandLogoIconStl = styled.svg<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex-shrink: 0;
  display: block;
`;

const BrandLogoTextStl = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  background: ${({ theme }) => theme.gradients.brand.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
`;

/**
 * Emblema oficial SafeZone Studies (Escudo + Livro Aberto + Centelha Azure AI).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 36,
  showText = false,
  className,
}) => {
  const uid = useId().replace(/:/g, '');
  const bgId = `sz-bg-${uid}`;
  const limeId = `sz-lime-${uid}`;
  const slateId = `sz-slate-${uid}`;

  return (
    <BrandLogoWrapperStl className={className}>
      <BrandLogoIconStl
        $size={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Logo SafeZone Studies"
      >
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1b2e42" />
          </linearGradient>
          <linearGradient id={limeId} x1="140" y1="96" x2="372" y2="416" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="55%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>
          <linearGradient id={slateId} x1="160" y1="120" x2="352" y2="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#243b53" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <rect x="16" y="16" width="480" height="480" rx="112" fill={`url(#${bgId})`} />
        <rect
          x="20"
          y="20"
          width="472"
          height="472"
          rx="108"
          stroke="#334d66"
          strokeWidth="4"
          strokeOpacity="0.65"
        />

        <path
          d="M256 84L394 134V248C394 338 334 402 256 432C178 402 118 338 118 248V134L256 84Z"
          fill={`url(#${slateId})`}
          stroke={`url(#${limeId})`}
          strokeWidth="22"
          strokeLinejoin="round"
        />

        <path
          d="M170 246C198 246 226 258 256 284C286 258 314 246 342 246V304C312 304 284 316 256 344C228 316 200 304 170 304V246Z"
          fill="#f0f4f8"
          fillOpacity="0.95"
        />
        <path d="M256 284V344" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />

        <path
          d="M256 138L272 184L318 200L272 216L256 262L240 216L194 200L240 184L256 138Z"
          fill={`url(#${limeId})`}
        />
      </BrandLogoIconStl>
      {showText && <BrandLogoTextStl>SafeZone Studies</BrandLogoTextStl>}
    </BrandLogoWrapperStl>
  );
};
