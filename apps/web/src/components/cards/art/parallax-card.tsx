/**
 * ParallaxCard — T027 Premium Card Art System
 *
 * Wrapper que aplica o efeito de parallax em 5 camadas:
 *   L1 bg:    2px  — fundo do estádio
 *   L2 theme: 3px  — tema histórico / overlay
 *   L3 sil:   6px  — silhueta do jogador
 *   L4 fx:    10px — partículas e efeitos
 *   L5 ui:    0    — badges, OVR, etc. (fixo)
 *
 * Compatível com touch mobile e mouse desktop.
 * A silhueta tem animação CSS de "respiração" independente do parallax.
 */
'use client';

import React, { useRef, useCallback } from 'react';

export type ParallaxCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** IDs das camadas para mover (deve estar na árvore filha) */
  layerIds: {
    bg?:    string;
    theme?: string;
    sil?:   string;
    fx?:    string;
  };
};

export function ParallaxCard({ children, className, style, layerIds }: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isActive = useRef(false);
  const cx = useRef(0);
  const cy = useRef(0);

  const getLayer = (id?: string) => id ? document.getElementById(id) : null;

  const applyParallax = useCallback((nx: number, ny: number) => {
    const bgEl    = getLayer(layerIds.bg);
    const themeEl = getLayer(layerIds.theme);
    const silEl   = getLayer(layerIds.sil);
    const fxEl    = getLayer(layerIds.fx);

    if (bgEl)    bgEl.style.transform    = `translate(${nx * 2}px,${ny * 2}px) scale(1.04)`;
    if (themeEl) themeEl.style.transform = `translate(${nx * 3}px,${ny * 3}px)`;
    if (silEl)   silEl.style.transform   = `translate(${nx * 6}px,${ny * 6}px)`;
    if (fxEl)    fxEl.style.transform    = `translate(${nx * 10}px,${ny * 10}px)`;

    if (cardRef.current) {
      cardRef.current.style.transform = `rotateY(${nx * 4}deg) rotateX(${-ny * 3}deg)`;
    }
  }, [layerIds]);

  const resetParallax = useCallback(() => {
    [layerIds.bg, layerIds.theme, layerIds.sil, layerIds.fx].forEach((id) => {
      const el = getLayer(id);
      if (el) el.style.transform = '';
    });
    if (cardRef.current) cardRef.current.style.transform = '';
  }, [layerIds]);

  // Touch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isActive.current = true;
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    cx.current = r.left + r.width / 2;
    cy.current = r.top  + r.height / 2;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isActive.current) return;
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    applyParallax(
      Math.max(-1, Math.min(1, (t.clientX - cx.current) / 110)),
      Math.max(-1, Math.min(1, (t.clientY - cy.current) / 160)),
    );
  }, [applyParallax]);

  const onTouchEnd = useCallback(() => {
    isActive.current = false;
    resetParallax();
  }, [resetParallax]);

  // Mouse
  const onMouseEnter = useCallback(() => {
    isActive.current = true;
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    cx.current = r.left + r.width / 2;
    cy.current = r.top  + r.height / 2;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isActive.current) return;
    applyParallax(
      Math.max(-1, Math.min(1, (e.clientX - cx.current) / 110)),
      Math.max(-1, Math.min(1, (e.clientY - cy.current) / 160)),
    );
  }, [applyParallax]);

  const onMouseLeave = useCallback(() => {
    isActive.current = false;
    resetParallax();
  }, [resetParallax]);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ ...style, transformStyle: 'preserve-3d', cursor: 'pointer' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

/** Animações CSS de "respiração" por raridade */
export const BREATH_ANIMATIONS: Record<string, string> = {
  common:         'none',
  rare:           'breathe-slow 7s ease-in-out infinite',
  elite:          'breathe-slow 6.5s ease-in-out infinite',
  legendary:      'breathe-slow 6s ease-in-out infinite',
  ultra:          'breathe-med 4.5s ease-in-out infinite',
  world_cup_hero: 'breathe-slow 5s ease-in-out infinite',
  goat:           'breathe-goat 4s ease-in-out infinite',
};

/** keyframes como string de CSS global */
export const BREATH_KEYFRAMES = `
@keyframes breathe-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
@keyframes breathe-med  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-4px) scale(1.01)} }
@keyframes breathe-goat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-5px) scale(1.015)} }
`;
