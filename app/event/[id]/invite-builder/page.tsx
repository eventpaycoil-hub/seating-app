// @ts-nocheck
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Gem,
  Cake,
  Sparkles,
  Baby,
  Flower2,
  PartyPopper,
  LayoutGrid,
} from 'lucide-react';
import html2canvas from 'html2canvas';

const TEMPLATES = [
  { id: 'classic-cream', name: 'קלאסי שמנת', bg: '#f7f3eb', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', frame: 'simple' },
  { id: 'double-frame', name: 'מסגרת כפולה', bg: '#faf8f4', text: '#1c1917', muted: '#57534e', line: '#a8a29e', frame: 'double' },
  { id: 'rings-gold', name: 'טבעות זהב', bg: '#fffbeb', text: '#422006', muted: '#92400e', line: '#fcd34d', frame: 'simple' },
  { id: 'floral-soft', name: 'פרחים רכים', bg: '#fdfcf9', text: '#365314', muted: '#4d7c0f', line: '#d9f99d', frame: 'simple' },
  { id: 'romantic-peach', name: 'רומנטי אפרסק', bg: '#fff7ed', text: '#9a3412', muted: '#c2410c', line: '#fdba74', frame: 'simple' },
  { id: 'dancing-couple', name: 'רקדנים אלגנטי', bg: '#fafaf9', text: '#1c1917', muted: '#57534e', line: '#d6d3d1', frame: 'simple' },
  { id: 'dark-luxury', name: 'יוקרה כהה', bg: '#0c0a09', text: '#fafaf9', muted: '#a8a29e', line: '#44403c', frame: 'double' },
  { id: 'olive-garden', name: 'ירוק זית', bg: '#f5f7f0', text: '#3f6212', muted: '#65a30d', line: '#bef264', frame: 'simple' },
  { id: 'navy-elegant', name: 'כחול אלגנטי', bg: '#0f172a', text: '#f8fafc', muted: '#94a3b8', line: '#334155', frame: 'double' },
  { id: 'minimal-bw', name: 'מינימלי שחור', bg: '#ffffff', text: '#0a0a0a', muted: '#525252', line: '#e5e5e5', frame: 'simple' },
  { id: 'vintage', name: 'וינטג׳', bg: '#faf7f2', text: '#44403c', muted: '#78716c', line: '#d6d3d1', frame: 'double' },
  { id: 'bar-party', name: 'בר/בת שמח', bg: '#eff6ff', text: '#1e3a8a', muted: '#3b82f6', line: '#93c5fd', frame: 'simple' },
  { id: 'botanical-sage', name: 'בוטני ירוק-זהב', bg: '#f5f0e6', text: '#3f2a1e', muted: '#6b5c4c', line: '#c4a574', frame: 'double' },
  { id: 'soft-emboss', name: 'יוקרה רכה לבן', bg: '#faf9f7', text: '#5c5346', muted: '#8a8070', line: '#e8e4dc', frame: 'simple' },
  { id: 'line-floral', name: 'פרחים בקו שחור', bg: '#ffffff', text: '#1a1a1a', muted: '#525252', line: '#d4d4d4', frame: 'simple' },
  { id: 'deckle-white', name: 'מינימלי קצה רך', bg: '#f7f7f5', text: '#2c2c2c', muted: '#6b6b6b', line: '#d0d0d0', frame: 'simple' },
  { id: 'bar-brown', name: 'בר מצווה חום', bg: '#faf6f1', text: '#5c4033', muted: '#8b6914', line: '#c4a484', frame: 'double' },
  { id: 'bat-eucalyptus', name: 'בת מצווה אקליפטוס', bg: '#f7faf7', text: '#2d5a3d', muted: '#5a8f6d', line: '#d4af37', frame: 'simple' },
  { id: 'formal-ivory', name: 'רשמי שנהב', bg: '#f8f5f0', text: '#3d3d3d', muted: '#6b6b6b', line: '#c9c0b0', frame: 'double' },
  { id: 'romantic-script', name: 'רומנטי כתב חופשי', bg: '#faf8f6', text: '#3f2a1e', muted: '#7c6a58', line: '#e7d5c4', frame: 'simple' },
  { id: 'brit-sky', name: 'ברית שמיים', bg: '#f0f9ff', text: '#0c4a6e', muted: '#0369a1', line: '#7dd3fc', frame: 'simple' },
  { id: 'brit-cream', name: 'ברית שמנת', bg: '#fffbeb', text: '#78350f', muted: '#a16207', line: '#fde68a', frame: 'double' },
  { id: 'birthday-fun', name: 'יום הולדת שמח', bg: '#fdf4ff', text: '#86198f', muted: '#c026d3', line: '#f0abfc', frame: 'simple' },
  { id: 'ornate-cream', name: 'מסגרת זהב אורנמנט', bg: '#fbf8f1', text: '#6b5c3e', muted: '#9a8b6e', line: '#c4a574', frame: 'ornate' },
  { id: 'wildflower-white', name: 'פרחים פזורים', bg: '#fffcf9', text: '#3d3d3d', muted: '#7a7a7a', line: '#e8e0d8', frame: 'simple' },
  { id: 'mono-clean', name: 'מונוגרם נקי', bg: '#ffffff', text: '#1a1a1a', muted: '#6b6b6b', line: '#d4d4d4', frame: 'simple' },
  { id: 'vellum-soft', name: 'קלף עדין', bg: '#f7f4ef', text: '#4a433a', muted: '#8a8070', line: '#d6cfc4', frame: 'double' },
  { id: 'brit-sand', name: 'ברית חול', bg: '#faf6f0', text: '#5c4a3a', muted: '#8b7355', line: '#e0d5c5', frame: 'simple' },
  { id: 'brit-sky-soft', name: 'ברית שמיים רך', bg: '#f3f8fc', text: '#3d5a73', muted: '#6b8fa3', line: '#c5d9e8', frame: 'simple' },
  { id: 'brit-check', name: 'ברית משבצות', bg: '#f7f5f0', text: '#5c5346', muted: '#8a8070', line: '#d4cfc4', frame: 'simple' },
  { id: 'bar-navy-formal', name: 'בר מצווה נייבי', bg: '#f8f9fb', text: '#1e3a5f', muted: '#4a6fa5', line: '#c5d0e0', frame: 'double' },
  { id: 'bar-stone', name: 'בר מצווה אבן', bg: '#f5f2ec', text: '#3f3a32', muted: '#7a7268', line: '#d0c8b8', frame: 'simple' },
  { id: 'bat-blush', name: 'בת מצווה סומק', bg: '#fdf8f6', text: '#6b4545', muted: '#a67c7c', line: '#e8d0d0', frame: 'simple' },
  { id: 'bat-gold-floral', name: 'בת מצווה זהב-פרח', bg: '#fffdf9', text: '#5c4033', muted: '#8b6914', line: '#e8d5a3', frame: 'simple' },
  { id: 'bat-mint', name: 'בת מצווה מנטה', bg: '#f5faf7', text: '#3d5c4a', muted: '#6b9a7a', line: '#c5e0d0', frame: 'simple' },
];

const BACKGROUNDS = [
  { id: 'none', label: 'ללא (צבע בלבד)', src: '' },
  { id: 'blush-gold', label: 'ורוד זהב', src: '/invite-backgrounds/bg-blush-gold.png' },
  { id: 'navy-moon', label: 'לילה וירח', src: '/invite-backgrounds/bg-navy-moon.png' },
  { id: 'sage-leaves', label: 'אקליפטוס', src: '/invite-backgrounds/bg-sage-leaves.png' },
  { id: 'cream-silk', label: 'שמנת ומשי', src: '/invite-backgrounds/bg-cream-silk.png' },
  { id: 'pink-circle', label: 'ורוד עיגול', src: '/invite-backgrounds/bg-pink-circle.png' },
  { id: 'navy-stars', label: 'נייבי כוכבים', src: '/invite-backgrounds/bg-navy-stars.png' },
  { id: 'stars', label: 'כוכבים', src: '/invite-backgrounds/stars.png' },
];

const FRAMES = [
  { id: 'none', label: 'ללא מסגרת', src: '' },
  { id: 'rose-gold', label: 'ורדים זהב', src: '/invite-frames/frame-rose-gold.png' },
  { id: 'green-wreath', label: 'זר ירוק', src: '/invite-frames/frame-green-wreath.png' },
  { id: 'purple-wash', label: 'סגול מים', src: '/invite-frames/frame-purple-wash.png' },
  { id: 'eucalyptus', label: 'אקליפטוס', src: '/invite-frames/frame-eucalyptus.png' },
  { id: 'pink-arch', label: 'קשת ורודה', src: '/invite-frames/frame-pink-arch.png' },
  { id: 'navy-stars', label: 'כחול כוכבים', src: '/invite-frames/frame-navy-stars.png' },
  { id: 'gold-classic', label: 'זהב קלאסי', src: '/invite-frames/frame-gold-classic.png' },
  { id: 'peach-floral', label: 'אפרסק פרחוני', src: '/invite-frames/frame-peach-floral.png' },
  { id: 'purple-wreath', label: 'זר סגול', src: '/invite-frames/frame-purple-wreath.png' },
  { id: 'gold', label: 'מסגרת זהב', src: '/invite-frames/frame-gold.png' },
  { id: 'blue-ornate', label: 'מסגרת כחול', src: '/invite-frames/frame-blue-ornate.png' },
  { id: 'navy-frame', label: 'מסגרת כהה', src: '/invite-frames/frame-navy.png' },
  { id: 'black-ornate', label: 'מסגרת שחורה', src: '/invite-frames/frame-black-ornate.png' },
  { id: 'gold-simple', label: 'מסגרת זהב עדינה', src: '/invite-frames/frame-gold-simple.png' },
  { id: 'gold-ornate', label: 'מסגרת זהב מעוטרת', src: '/invite-frames/frame-gold-ornate.png' },
];

const OBJECTS = [
  { id: 'rings', label: 'טבעות זהב', src: '/invite-objects/rings.png', types: ['חתונה', 'חינה'] },
  { id: 'rings-engraved', label: 'טבעות עם חריטה', src: '/invite-objects/rings-engraved.png', types: ['חתונה'] },
  { id: 'rings-thin', label: 'טבעות דקות', src: '/invite-objects/rings-thin.png', types: ['חתונה'] },
  { id: 'champagne', label: 'כוסות שמפניה', src: '/invite-objects/champagne.png', types: ['חתונה', 'חינה', 'מסיבת רווקים', 'מסיבת רווקות'] },
  { id: 'dancers', label: 'רקדנים', src: '/invite-objects/dancers.png', types: ['חתונה'] },
  { id: 'flowers', label: 'פרחים', src: '/invite-objects/flowers.png', types: ['חתונה', 'חינה', 'בת מצווה', 'בריתה'] },
  { id: 'flowers-soft', label: 'פרחים רכים', src: '/invite-objects/flowers-soft.png', types: ['חתונה', 'בת מצווה', 'חינה'] },
  { id: 'leaves', label: 'עלים ירוקים', src: '/invite-objects/leaves.png', types: ['חתונה', 'בת מצווה', 'בר מצווה'] },
  { id: 'leaves-gold', label: 'עלים זהב', src: '/invite-objects/leaves-gold.png', types: ['חתונה', 'בר מצווה'] },
  { id: 'wreath-pink', label: 'זר ורוד', src: '/invite-objects/wreath-pink.png', types: ['בת מצווה', 'חתונה'] },
  { id: 'doves', label: 'יונים', src: '/invite-objects/doves.png', types: ['חתונה'] },
  { id: 'candles', label: 'נרות', src: '/invite-objects/candles.png', types: ['חתונה', 'בר מצווה', 'בת מצווה'] },
  { id: 'mask', label: 'מסכה', src: '/invite-objects/mask.png', types: ['מסיבת רווקים', 'מסיבת רווקות'] },
  { id: 'bowtie', label: 'פפיון', src: '/invite-objects/bowtie.png', types: ['בר מצווה', 'חתונה'] },
  { id: 'soccer', label: 'כדורגל', src: '/invite-objects/soccer.png', types: ['בר מצווה', 'יום הולדת'] },
  { id: 'surfboard', label: 'גלשן', src: '/invite-objects/surfboard.png', types: ['בר מצווה', 'יום הולדת'] },
  { id: 'piano', label: 'פסנתר', src: '/invite-objects/piano.png', types: ['בר מצווה', 'בת מצווה', 'חתונה'] },
  { id: 'teddy', label: 'דובי', src: '/invite-objects/teddy.png', types: ['ברית', 'בריתה'] },
  { id: 'bunny', label: 'ארנב', src: '/invite-objects/bunny.png', types: ['ברית', 'בריתה'] },
  { id: 'cradle', label: 'עריסה', src: '/invite-objects/cradle.png', types: ['ברית', 'בריתה'] },
  { id: 'balloon', label: 'בלון', src: '/invite-objects/balloon.png', types: ['ברית', 'בריתה', 'יום הולדת'] },
  { id: 'baby-bottle', label: 'בקבוק תינוק', src: '/invite-objects/baby-bottle.png', types: ['ברית', 'בריתה'] },
  { id: 'jerusalem', label: 'ירושלים', src: '/invite-objects/jerusalem.png', types: ['בר מצווה'] },
  { id: 'tallit', label: 'טלית', src: '/invite-objects/tallit.png', types: ['בר מצווה'] },
];

const PRESETS = [
  { id: 'w01', name: 'מסגרת זהב אורנמנט', desc: 'קרם · מסגרת מעוטרת', eventType: 'חתונה', templateId: 'ornate-cream', selectedObjects: [{ id: 'rings-thin', position: 'top' }] },
  { id: 'w02', name: 'פרחים פזורים', desc: 'לבן מינימלי · פרחים', eventType: 'חתונה', templateId: 'wildflower-white', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'w03', name: 'מונוגרם נקי', desc: 'לבן · ראשי תיבות', eventType: 'חתונה', templateId: 'mono-clean', selectedObjects: [] },
  { id: 'w04', name: 'קלף עדין', desc: 'שמנת כפולה', eventType: 'חתונה', templateId: 'vellum-soft', selectedObjects: [{ id: 'rings-thin', position: 'bottom' }] },
  { id: 'w05', name: 'בוטני זהב', desc: 'ירוק-זהב', eventType: 'חתונה', templateId: 'botanical-sage', selectedObjects: [{ id: 'leaves-gold', position: 'top' }] },
  { id: 'w06', name: 'רומנטי אפרסק', desc: 'פרחים רכים', eventType: 'חתונה', templateId: 'romantic-peach', selectedObjects: [{ id: 'flowers-soft', position: 'top' }, { id: 'rings-thin', position: 'top' }] },
  { id: 'w07', name: 'יוקרה כהה', desc: 'שחור-זהב', eventType: 'חתונה', templateId: 'dark-luxury', selectedObjects: [{ id: 'rings-thin', position: 'top' }] },
  { id: 'w08', name: 'כחול אלגנטי', desc: 'נייבי עמוק', eventType: 'חתונה', templateId: 'navy-elegant', selectedObjects: [{ id: 'rings-thin', position: 'top' }] },
  { id: 'w09', name: 'מינימלי פרימיום', desc: 'נקי מאוד', eventType: 'חתונה', templateId: 'deckle-white', selectedObjects: [] },
  { id: 'w10', name: 'רשמי שנהב', desc: 'מסורתי', eventType: 'חתונה', templateId: 'formal-ivory', selectedObjects: [] },
  { id: 'w11', name: 'זר ורוד', desc: 'פרחוני עדין', eventType: 'חתונה', templateId: 'bat-blush', selectedObjects: [{ id: 'wreath-pink', position: 'top' }] },
  { id: 'w12', name: 'קלאסי שמנת', desc: 'פשוט וחם', eventType: 'חתונה', templateId: 'classic-cream', selectedObjects: [{ id: 'rings-thin', position: 'top' }] },
  { id: 'br01', name: 'נייבי פורמלי', desc: 'כחול-לבן מכובד', eventType: 'בר מצווה', templateId: 'bar-navy-formal', selectedObjects: [{ id: 'tallit', position: 'top' }] },
  { id: 'br02', name: 'ירושלים', desc: 'איור עיר', eventType: 'בר מצווה', templateId: 'bar-stone', selectedObjects: [{ id: 'jerusalem', position: 'top' }] },
  { id: 'br03', name: 'אבן חמה', desc: 'בז׳ קלאסי', eventType: 'בר מצווה', templateId: 'bar-stone', selectedObjects: [{ id: 'bowtie', position: 'top' }] },
  { id: 'br04', name: 'חום קלאסי', desc: 'מונוגרם', eventType: 'בר מצווה', templateId: 'bar-brown', selectedObjects: [{ id: 'bowtie', position: 'top' }] },
  { id: 'br05', name: 'כחול שמח', desc: 'צעיר', eventType: 'בר מצווה', templateId: 'bar-party', selectedObjects: [{ id: 'soccer', position: 'top' }] },
  { id: 'br06', name: 'נייבי כהה', desc: 'אלגנטי', eventType: 'בר מצווה', templateId: 'navy-elegant', selectedObjects: [{ id: 'bowtie', position: 'top' }] },
  { id: 'br07', name: 'מינימלי שחור', desc: 'נקי', eventType: 'בר מצווה', templateId: 'minimal-bw', selectedObjects: [] },
  { id: 'br08', name: 'עלים זהב', desc: 'טבעי-מכובד', eventType: 'בר מצווה', templateId: 'botanical-sage', selectedObjects: [{ id: 'leaves-gold', position: 'top' }] },
  { id: 'br09', name: 'שמנת רשמית', desc: 'קלאסי', eventType: 'בר מצווה', templateId: 'classic-cream', selectedObjects: [{ id: 'tallit', position: 'top' }] },
  { id: 'br10', name: 'טלית + אבן', desc: 'מסורתי', eventType: 'בר מצווה', templateId: 'vellum-soft', selectedObjects: [{ id: 'tallit', position: 'top' }] },
  { id: 'bt01', name: 'זר ורוד זהב', desc: 'עיגול פרחוני', eventType: 'בת מצווה', templateId: 'bat-gold-floral', selectedObjects: [{ id: 'wreath-pink', position: 'top' }] },
  { id: 'bt02', name: 'סומק עדין', desc: 'ורוד רך', eventType: 'בת מצווה', templateId: 'bat-blush', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'bt03', name: 'מנטה רענן', desc: 'ירוק-פסטל', eventType: 'בת מצווה', templateId: 'bat-mint', selectedObjects: [{ id: 'leaves', position: 'top' }] },
  { id: 'bt04', name: 'אקליפטוס', desc: 'זהב + ירוק', eventType: 'בת מצווה', templateId: 'bat-eucalyptus', selectedObjects: [{ id: 'leaves-gold', position: 'top' }] },
  { id: 'bt05', name: 'אפרסק רומנטי', desc: 'חם ועדין', eventType: 'בת מצווה', templateId: 'romantic-peach', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'bt06', name: 'יוקרה רכה', desc: 'לבן על לבן', eventType: 'בת מצווה', templateId: 'soft-emboss', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'bt07', name: 'פרחים פזורים', desc: 'מינימלי', eventType: 'בת מצווה', templateId: 'wildflower-white', selectedObjects: [{ id: 'flowers-soft', position: 'bottom' }] },
  { id: 'bt08', name: 'שמחה כחולה', desc: 'צעיר', eventType: 'בת מצווה', templateId: 'bar-party', selectedObjects: [] },
  { id: 'bt09', name: 'מונוגרם נקי', desc: 'אלגנטי', eventType: 'בת מצווה', templateId: 'mono-clean', selectedObjects: [] },
  { id: 'bt10', name: 'קלף עדין', desc: 'שמנת', eventType: 'בת מצווה', templateId: 'vellum-soft', selectedObjects: [{ id: 'wreath-pink', position: 'top' }] },
  { id: 'bi01', name: 'עריסה חול', desc: 'קרם · עריסה', eventType: 'ברית', templateId: 'brit-sand', selectedObjects: [{ id: 'cradle', position: 'bottom' }] },
  { id: 'bi02', name: 'דובי שמיים', desc: 'תכלת רך', eventType: 'ברית', templateId: 'brit-sky-soft', selectedObjects: [{ id: 'teddy', position: 'top' }] },
  { id: 'bi03', name: 'דובי חם', desc: 'בז׳ משפחתי', eventType: 'ברית', templateId: 'brit-sand', selectedObjects: [{ id: 'teddy', position: 'top' }] },
  { id: 'bi04', name: 'ארנב עדין', desc: 'פסטל', eventType: 'ברית', templateId: 'brit-check', selectedObjects: [{ id: 'bunny', position: 'top' }] },
  { id: 'bi05', name: 'בלון + דובי', desc: 'שמח', eventType: 'ברית', templateId: 'brit-sky-soft', selectedObjects: [{ id: 'teddy', position: 'top' }, { id: 'balloon', position: 'top' }] },
  { id: 'bi06', name: 'שמיים קלאסי', desc: 'כחול', eventType: 'ברית', templateId: 'brit-sky', selectedObjects: [{ id: 'teddy', position: 'top' }] },
  { id: 'bi07', name: 'שמנת חגיגית', desc: 'חם', eventType: 'ברית', templateId: 'brit-cream', selectedObjects: [{ id: 'teddy', position: 'top' }] },
  { id: 'bi08', name: 'כוכבים', desc: 'עדין', eventType: 'ברית', templateId: 'brit-sky-soft', selectedObjects: [] },
  { id: 'bi09', name: 'עריסה + כוכבים', desc: 'מלא', eventType: 'ברית', templateId: 'brit-sand', selectedObjects: [{ id: 'cradle', position: 'bottom' }] },
  { id: 'bi10', name: 'מינימלי תינוק', desc: 'נקי', eventType: 'ברית', templateId: 'mono-clean', selectedObjects: [{ id: 'teddy', position: 'top' }] },
  { id: 'ba01', name: 'ארנב ורוד', desc: 'פסטל עדין', eventType: 'בריתה', templateId: 'bat-blush', selectedObjects: [{ id: 'bunny', position: 'top' }] },
  { id: 'ba02', name: 'דובי סומק', desc: 'חם', eventType: 'בריתה', templateId: 'romantic-peach', selectedObjects: [{ id: 'teddy', position: 'top' }] },
  { id: 'ba03', name: 'עריסה רכה', desc: 'קרם', eventType: 'בריתה', templateId: 'brit-sand', selectedObjects: [{ id: 'cradle', position: 'bottom' }] },
  { id: 'ba04', name: 'פרחים + דובי', desc: 'עדין', eventType: 'בריתה', templateId: 'bat-blush', selectedObjects: [{ id: 'teddy', position: 'top' }, { id: 'flowers-soft', position: 'bottom' }] },
  { id: 'ba05', name: 'שמיים ורוד', desc: 'תכלת-ורוד', eventType: 'בריתה', templateId: 'brit-sky-soft', selectedObjects: [{ id: 'bunny', position: 'top' }] },
  { id: 'ba06', name: 'בלון חמוד', desc: 'שמח', eventType: 'בריתה', templateId: 'brit-cream', selectedObjects: [{ id: 'balloon', position: 'top' }, { id: 'teddy', position: 'top' }] },
  { id: 'ba07', name: 'זר קטן', desc: 'פרחוני', eventType: 'בריתה', templateId: 'wildflower-white', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'ba08', name: 'מנטה תינוקת', desc: 'רענן', eventType: 'בריתה', templateId: 'bat-mint', selectedObjects: [{ id: 'bunny', position: 'top' }] },
  { id: 'ba09', name: 'קלף עדין', desc: 'שמנת', eventType: 'בריתה', templateId: 'vellum-soft', selectedObjects: [{ id: 'teddy', position: 'top' }] },
  { id: 'ba10', name: 'מינימלי', desc: 'נקי', eventType: 'בריתה', templateId: 'mono-clean', selectedObjects: [{ id: 'bunny', position: 'top' }] },
  { id: 'h01', name: 'אפרסק חגיגי', desc: 'פרחים חמים', eventType: 'חינה', templateId: 'romantic-peach', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'h02', name: 'זהב-פרח', desc: 'עשיר', eventType: 'חינה', templateId: 'bat-gold-floral', selectedObjects: [{ id: 'wreath-pink', position: 'top' }] },
  { id: 'h03', name: 'אורנמנט', desc: 'מסגרת זהב', eventType: 'חינה', templateId: 'ornate-cream', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'h04', name: 'בוטני', desc: 'ירוק-זהב', eventType: 'חינה', templateId: 'botanical-sage', selectedObjects: [{ id: 'leaves-gold', position: 'top' }] },
  { id: 'h05', name: 'סומק', desc: 'ורוד', eventType: 'חינה', templateId: 'bat-blush', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'h06', name: 'פרחים פזורים', desc: 'מינימלי', eventType: 'חינה', templateId: 'wildflower-white', selectedObjects: [{ id: 'flowers-soft', position: 'bottom' }] },
  { id: 'h07', name: 'כהה יוקרתי', desc: 'דרמטי', eventType: 'חינה', templateId: 'dark-luxury', selectedObjects: [{ id: 'flowers-soft', position: 'top' }] },
  { id: 'h08', name: 'קלף', desc: 'שמנת', eventType: 'חינה', templateId: 'vellum-soft', selectedObjects: [{ id: 'leaves-gold', position: 'top' }] },
  { id: 'd01', name: 'סגול שמח', desc: 'חגיגי', eventType: 'יום הולדת', templateId: 'birthday-fun', selectedObjects: [{ id: 'balloon', position: 'top' }] },
  { id: 'd02', name: 'כחול שמח', desc: 'צעיר', eventType: 'יום הולדת', templateId: 'bar-party', selectedObjects: [{ id: 'balloon', position: 'top' }] },
  { id: 'd03', name: 'סומק', desc: 'עדין', eventType: 'יום הולדת', templateId: 'bat-blush', selectedObjects: [] },
  { id: 'd04', name: 'מנטה', desc: 'רענן', eventType: 'יום הולדת', templateId: 'bat-mint', selectedObjects: [{ id: 'balloon', position: 'top' }] },
  { id: 'd05', name: 'מינימלי', desc: 'נקי', eventType: 'יום הולדת', templateId: 'mono-clean', selectedObjects: [] },
  { id: 'd06', name: 'אפרסק', desc: 'חם', eventType: 'יום הולדת', templateId: 'romantic-peach', selectedObjects: [{ id: 'balloon', position: 'top' }] },
  { id: 'd07', name: 'כוכבים', desc: 'חגיגי', eventType: 'יום הולדת', templateId: 'brit-sky-soft', selectedObjects: [] },
  { id: 'd08', name: 'קלאסי', desc: 'פשוט', eventType: 'יום הולדת', templateId: 'classic-cream', selectedObjects: [{ id: 'balloon', position: 'top' }] },
];

const EVENT_TYPES = [
  { id: 'חתונה', label: 'חתונה', Icon: Gem },
  { id: 'בר מצווה', label: 'בר מצווה', Icon: Cake },
  { id: 'בת מצווה', label: 'בת מצווה', Icon: Sparkles },
  { id: 'ברית', label: 'ברית', Icon: Baby },
  { id: 'בריתה', label: 'בריתה', Icon: Baby },
  { id: 'חינה', label: 'חינה', Icon: Flower2 },
  { id: 'יום הולדת', label: 'יום הולדת', Icon: PartyPopper },
  { id: 'אחר', label: 'אחר', Icon: LayoutGrid },
];

const EMPTY = {
  templateId: 'classic-cream',
  owners: '',
  eventType: '',
  quote: '',
  date: '',
  hebrewDate: '',
  receptionTime: '19:30',
  chuppahTime: '20:30',
  hallName: '',
  city: '',
  welcomeLine: 'נשמח לראותכם',
  inviteLine: 'הנכם מוזמנים לחגוג עמנו',
  groomParents: '',
  brideParents: '',
  monogram: '',
  monogramColor: '',
    monogram: '',
  monogramColor: '',
  textColor: '',
  photoUrl: '',
  photoUrl: '',
  selectedObjects: [],
  bgId: 'none',
  frameId: 'none',
  frameScaleX: 1,
  frameScaleY: 1,
  includeMonogramCard: true,
};

function ObjectsDisplay({ selected, position }) {
  const list = (selected || []).filter((o) => o.position === position);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-5 mb-5">
      {list.map((item) => {
        const obj = OBJECTS.find((o) => o.id === item.id);
        if (!obj) return null;
        const size = ['rings', 'rings-engraved', 'rings-thin', 'champagne', 'dancers', 'teddy', 'cradle'].includes(obj.id)
          ? 110
          : 80;
        return (
          <img
            key={`${item.id}-${position}`}
            src={obj.src}
            alt={obj.label}
            className="object-contain"
            style={{ maxHeight: size, maxWidth: size + 20, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      })}
    </div>
  );
}

function InviteCard({ form, template, formatDate, compact = false, customBg = '', cardRef = null }) {
    const pad = compact ? 'px-3 pt-5 pb-6' : 'px-8 pt-12 pb-10';
  const titleSize = compact ? 'text-base' : 'text-3xl sm:text-4xl';
  const dateSize = compact ? 'text-lg' : 'text-3xl';
  const isWedding = form.eventType === 'חתונה';
  const isBarBat = form.eventType === 'בר מצווה' || form.eventType === 'בת מצווה';
  const showPhoto = !compact && form.photoUrl && isBarBat;

  const bgSrc =
    form.bgId && form.bgId !== 'none'
      ? BACKGROUNDS.find((b) => b.id === form.bgId)?.src
      : '';
  const frameSrc =
    form.frameId && form.frameId !== 'none'
      ? FRAMES.find((f) => f.id === form.frameId)?.src
      : '';

  return (
    <div
      ref={cardRef}
      className="relative mx-auto w-full shadow-xl overflow-hidden print-card"
      style={{
        backgroundColor: customBg && customBg.startsWith('#') ? customBg : template.bg,
        backgroundImage: bgSrc
          ? `url(${bgSrc})`
          : customBg && !customBg.startsWith('#')
          ? `url(${customBg})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
                color: form.textColor || template.text,
        maxWidth: compact ? '100%' : 420,
                height: compact ? '100%' : undefined,
        minHeight: compact ? '100%' : undefined,
        border:
          template.frame === 'double'
            ? `3px double ${template.line}`
            : template.frame === 'ornate'
            ? `2px solid ${template.line}`
            : `1px solid ${template.line}`,
        boxShadow:
          template.frame === 'ornate'
            ? `inset 0 0 0 6px ${template.bg}, inset 0 0 0 7px ${template.line}`
            : undefined,
      }}
    >
      {template.frame === 'ornate' && !frameSrc && (
        <>
          <div className="absolute top-3 right-3 text-lg opacity-50 z-20" style={{ color: template.line }}>❖</div>
          <div className="absolute top-3 left-3 text-lg opacity-50 z-20" style={{ color: template.line }}>❖</div>
          <div className="absolute bottom-3 right-3 text-lg opacity-50 z-20" style={{ color: template.line }}>❖</div>
          <div className="absolute bottom-3 left-3 text-lg opacity-50 z-20" style={{ color: template.line }}>❖</div>
        </>
      )}

      {frameSrc && (
        <img
          src={frameSrc}
          alt=""
          className="pointer-events-none absolute inset-0 w-full h-full"
          style={{
            zIndex: 5,
            objectFit: 'contain',
            transform: `scale(${form.frameScaleX || 1}, ${form.frameScaleY || 1})`,
            transformOrigin: 'center center',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <div className="relative" style={{ zIndex: 10 }}>
        <div className={`absolute ${compact ? 'top-1.5 left-1.5 text-[8px]' : 'top-3 left-3 text-[11px]'} opacity-50`}>
          בס״ד
        </div>
        <div className={`${pad} text-center`}>
          {form.quote && !compact && (
            <div
              className="text-[11px] mb-3 leading-snug opacity-90 px-3"
              style={{ color: form.quoteDark ? '#111827' : template.muted }}
            >
              {form.quote}
            </div>
          )}
          <ObjectsDisplay selected={form.selectedObjects} position="top" />
          {form.monogram && (
            <div
              className={`${compact ? 'text-xl mb-1' : 'text-5xl mb-4'} tracking-[0.15em] font-serif`}
              style={{
                color:
                  form.monogramColor ||
                  (template.line !== '#e5e5e5' ? template.line : template.text),
              }}
            >
              {form.monogram}
            </div>
          )}
          {showPhoto && (
            <div className="mb-5 flex justify-center">
              <img
                src={form.photoUrl}
                alt=""
                className="w-28 h-28 object-cover rounded-full border-2 shadow"
                style={{ borderColor: template.line }}
              />
            </div>
          )}
          <div className={`${compact ? 'text-[8px]' : 'text-[11px]'} tracking-[0.25em] uppercase mb-2 opacity-60`}>
            {form.eventType || 'אירוע'}
          </div>
          <div className={`${titleSize} font-serif leading-snug mb-1`}>
            {form.owners || 'שמות בעלי השמחה'}
          </div>
          <div className={`${compact ? 'w-8 my-2' : 'w-12 my-5'} h-px mx-auto`} style={{ background: template.line }} />
          <div className={`${compact ? 'text-[10px]' : 'text-sm'} mb-3 opacity-80`}>
            {form.inviteLine || 'הנכם מוזמנים לחגוג עמנו'}
          </div>
          <div className={`${dateSize} font-light tracking-wide mb-1`}>
            {formatDate(form.date) || '00.00.0000'}
          </div>
          {form.hebrewDate && !compact && (
            <div className="text-sm mb-3 opacity-70">{form.hebrewDate}</div>
          )}
          <div className={`${compact ? 'text-[10px] mb-2' : 'text-sm mb-5'}`}>
            {[form.hallName, form.city].filter(Boolean).join(' | ') || 'אולם | עיר'}
          </div>
          {isWedding ? (
            <div className={`flex justify-center ${compact ? 'gap-3 text-[9px] mb-2' : 'gap-8 text-sm mb-5'}`}>
              <div>
                <div className="opacity-60 text-[0.85em] mb-0.5">קבלת פנים</div>
                <div>{form.receptionTime || '19:30'}</div>
              </div>
              <div className="w-px self-stretch opacity-40" style={{ background: template.line }} />
              <div>
                <div className="opacity-60 text-[0.85em] mb-0.5">חופה</div>
                <div>{form.chuppahTime || '20:30'}</div>
              </div>
            </div>
          ) : (
            <div className={`${compact ? 'text-[10px] mb-2' : 'text-sm mb-5'}`}>
              <div className="opacity-60 text-[0.85em] mb-0.5">שעת התחלה</div>
              <div>{form.receptionTime || '19:30'}</div>
            </div>
          )}
          <div className={`${compact ? 'text-[10px] mb-2' : 'text-sm mb-6'} opacity-80`}>
            {form.welcomeLine || 'נשמח לראותכם'}
          </div>
          <ObjectsDisplay selected={form.selectedObjects} position="bottom" />
          {isWedding && (form.groomParents || form.brideParents) && (
            <div className={`flex justify-between gap-3 ${compact ? 'text-[8px]' : 'text-xs'}`} style={{ color: template.muted }}>
              <div className="flex-1 text-right">
                <div className="mb-0.5 opacity-70">הורי החתן</div>
                <div className="whitespace-pre-line">{form.groomParents || '—'}</div>
              </div>
              <div className="flex-1 text-left">
                <div className="mb-0.5 opacity-70">הורי הכלה</div>
                <div className="whitespace-pre-line">{form.brideParents || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InviteBuilderPage() {
  const params = useParams();
  const eventId = String(params?.id || '');
  const cardRef = useRef(null);

  const [step, setStep] = useState('type');
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);
  const [customBg, setCustomBg] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const ev = events.find((e) => String(e.id) === String(eventId));
      const inv = JSON.parse(localStorage.getItem(`invitation_${eventId}`) || 'null');

      let selectedObjects = inv?.selectedObjects || [];
      if (Array.isArray(selectedObjects) && typeof selectedObjects[0] === 'string') {
        selectedObjects = selectedObjects.map((id) => ({ id, position: 'top' }));
      }

      setForm({
        ...EMPTY,
        ...(inv || {}),
        owners: inv?.owners || ev?.owners || ev?.title || '',
        eventType: inv?.eventType || ev?.eventType || '',
        date: inv?.date || ev?.fullDate || ev?.eventDate || ev?.date || '',
        receptionTime: inv?.receptionTime || ev?.time || '19:30',
        chuppahTime: inv?.chuppahTime || '20:30',
        hallName: inv?.hallName || ev?.hallName || '',
        city: inv?.city || ev?.city || '',
        welcomeLine: inv?.welcomeLine || 'נשמח לראותכם',
        inviteLine: inv?.inviteLine || 'הנכם מוזמנים לחגוג עמנו',
        groomParents: inv?.groomParents || ev?.groomParents || '',
        brideParents: inv?.brideParents || ev?.brideParents || '',
        monogram: inv?.monogram || '',
        monogramColor: inv?.monogramColor || '',
        quote: inv?.quote || '',
        hebrewDate: inv?.hebrewDate || '',
        photoUrl: inv?.photoUrl || '',
        templateId: inv?.templateId || 'classic-cream',
        selectedObjects,
        bgId: inv?.bgId || 'none',
        frameId: inv?.frameId || 'none',
        frameScaleX: inv?.frameScaleX || inv?.frameScale || 1,
        frameScaleY: inv?.frameScaleY || inv?.frameScale || 1,
        includeMonogramCard: inv?.includeMonogramCard !== false,
      });

      if (inv?.customBg) setCustomBg(inv.customBg);
      setStep('type');
    } catch (e) {
      console.warn(e);
      setStep('type');
    }
  }, [eventId]);

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === form.templateId) || TEMPLATES[0],
    [form.templateId]
  );

  const galleryPresets = useMemo(() => {
    if (!form.eventType) return [];
    const list = PRESETS.filter((p) => p.eventType === form.eventType);
    return list.length ? list : PRESETS.filter((p) => p.eventType === 'חתונה');
  }, [form.eventType]);

  const relevantObjects = useMemo(() => {
    if (!form.eventType) return OBJECTS;
    return OBJECTS.filter(
      (o) => !o.types || o.types.includes(form.eventType) || form.eventType === 'אחר'
    );
  }, [form.eventType]);

  const formatDate = (d) => {
    if (!d) return '';
    if (String(d).includes('/')) return String(d).replace(/\//g, '.');
    if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
      const [y, m, day] = String(d).slice(0, 10).split('-');
      return `${day}.${m}.${y}`;
    }
    return d;
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    localStorage.setItem(`invitation_${eventId}`, JSON.stringify({ ...form, customBg }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const chooseType = (typeId) => {
    setForm((prev) => ({ ...prev, eventType: typeId }));
    setStep('gallery');
  };

  const choosePreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      eventType: preset.eventType,
      templateId: preset.templateId,
      selectedObjects: preset.selectedObjects || [],
      bgId: prev.bgId || 'none',
      frameId: prev.frameId || 'none',
    }));
    setCustomBg('');
    setStep('edit');
  };

  const toggleObject = (id) => {
    setForm((prev) => {
      const current = prev.selectedObjects || [];
      const exists = current.find((o) => o.id === id);
      if (exists) return { ...prev, selectedObjects: current.filter((o) => o.id !== id) };
      return { ...prev, selectedObjects: [...current, { id, position: 'top' }] };
    });
  };

  const setObjectPosition = (id, position) => {
    setForm((prev) => ({
      ...prev,
      selectedObjects: (prev.selectedObjects || []).map((o) =>
        o.id === id ? { ...o, position } : o
      ),
    }));
  };

  const exportJpeg = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    save();
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg', 0.95);
      a.download = `invite-${form.owners || eventId}.jpg`;
      a.click();
    } catch (e) {
      console.warn(e);
      alert('שגיאה בייצוא JPEG');
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    save();
    try {
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: form.includeMonogramCard ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a5',
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(img, 'JPEG', 0, 0, pageW, pageH);
      pdf.save(`invite-${form.owners || eventId}.pdf`);
    } catch (e) {
      console.warn(e);
      alert('שגיאה בייצוא PDF');
    } finally {
      setExporting(false);
    }
  };
    const isWedding = form.eventType === 'חתונה';
  const isBarBat = form.eventType === 'בר מצווה' || form.eventType === 'בת מצווה';

  if (step === 'type') {
    return (
      <div className="min-h-screen bg-zinc-100" dir="rtl">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">יצירת הזמנה</h1>
              <p className="text-slate-500 mt-2">שלב 1 מתוך 3 · בחרו סוג אירוע</p>
            </div>
            <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
              ← חזרה
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => chooseType(t.id)}
                className="bg-white rounded-3xl border-2 border-slate-200 hover:border-amber-400 hover:shadow-lg p-6 text-center transition-all active:scale-[0.98]"
              >
                <t.Icon className="w-10 h-10 mx-auto mb-3 text-amber-700" strokeWidth={1.5} />
                <div className="font-bold text-lg text-slate-800">{t.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'gallery') {
    return (
      <div className="min-h-screen bg-zinc-100" dir="rtl">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div>
              <h1 className="text-3xl font-bold">בחרו עיצוב · {form.eventType}</h1>
              <p className="text-slate-500 text-sm mt-1">שלב 2 מתוך 3 · לחצו על דוגמה</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('type')} className="text-sm text-slate-600 hover:underline">
                ← שינוי סוג אירוע
              </button>
              <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
                חזרה למוזמנים
              </Link>
            </div>
          </div>

          {galleryPresets.length === 0 ? (
            <div className="text-center text-slate-500 py-20">אין עדיין דוגמאות לסוג זה</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryPresets.map((p) => {
                const tpl = TEMPLATES.find((t) => t.id === p.templateId) || TEMPLATES[0];
                const previewForm = {
                  ...form,
                  eventType: p.eventType,
                  templateId: p.templateId,
                  selectedObjects: p.selectedObjects,
                  owners: form.owners || 'שמות בעלי השמחה',
                  date: form.date || '2026-08-15',
                  hallName: form.hallName || 'אולם הדוגמה',
                  city: form.city || 'תל אביב',
                  bgId: 'none',
                  frameId: 'none',
                };
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => choosePreset(p)}
                    className="group text-right bg-white rounded-3xl border-2 border-slate-200 hover:border-amber-400 hover:shadow-xl overflow-hidden transition-all"
                  >
                                        <div
                      className="p-4 bg-slate-50 flex justify-center items-center pointer-events-none overflow-hidden"
                      style={{ height: 340 }}
                    >
                      <div className="w-full h-full max-w-[220px]">
                        <InviteCard form={previewForm} template={tpl} formatDate={formatDate} compact />
                      </div>
                    </div>
                    <div className="px-5 py-4 border-t">
                      <div className="font-bold text-lg group-hover:text-amber-700">{p.name}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{p.desc}</div>
                      <div className="mt-3 text-amber-600 text-sm font-medium">בחרו עיצוב זה ←</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold">עריכת הזמנה</h1>
            <p className="text-slate-500 text-sm mt-1">
              שלב 3 מתוך 3 · {form.eventType} · {template.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep('gallery')} className="text-sm text-slate-600 hover:underline">
              ← החלפת עיצוב
            </button>
            <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
              חזרה למוזמנים
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border shadow-sm p-5 space-y-3">
              <div className="font-bold text-lg mb-1">פרטי ההזמנה</div>
              <input
                className="w-full border rounded-xl px-3 py-2.5"
                placeholder="שמות בעלי השמחה"
                value={form.owners}
                onChange={(e) => set('owners', e.target.value)}
              />
              <input
                className="w-full border rounded-xl px-3 py-2.5"
                placeholder="ראשי תיבות (למשל א&ש)"
                value={form.monogram}
                onChange={(e) => set('monogram', e.target.value)}
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 whitespace-nowrap">צבע ראשי תיבות:</label>
                <input
                  type="color"
                  value={form.monogramColor || template?.text || '#3f2a1e'}
                  onChange={(e) => set('monogramColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border"
                />
                {form.monogramColor && (
                  <button
                    type="button"
                    onClick={() => set('monogramColor', '')}
                    className="text-xs text-red-500 underline"
                  >
                    איפוס
                  </button>
                )}
              </div>
                            <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 whitespace-nowrap">צבע טקסט כללי:</label>
                <input
                  type="color"
                  value={form.textColor || template?.text || '#3f2a1e'}
                  onChange={(e) => set('textColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border"
                />
                {form.textColor && (
                  <button
                    type="button"
                    onClick={() => set('textColor', '')}
                    className="text-xs text-red-500 underline"
                  >
                    איפוס
                  </button>
                )}
              </div>
              <input
                className="w-full border rounded-xl px-3 py-2.5"
                placeholder="משפט הזמנה"
                value={form.inviteLine}
                onChange={(e) => set('inviteLine', e.target.value)}
              />
              <input
                className="w-full border rounded-xl px-3 py-2.5"
                placeholder="ציטוט / פסוק (אופציונלי)"
                value={form.quote}
                onChange={(e) => set('quote', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="w-full border rounded-xl px-3 py-2.5"
                  type="date"
                  value={String(form.date || '').slice(0, 10)}
                  onChange={(e) => set('date', e.target.value)}
                />
                <input
                  className="w-full border rounded-xl px-3 py-2.5"
                  placeholder="תאריך עברי"
                  value={form.hebrewDate}
                  onChange={(e) => set('hebrewDate', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="w-full border rounded-xl px-3 py-2.5"
                  placeholder={isWedding ? 'קבלת פנים' : 'שעת התחלה'}
                  value={form.receptionTime}
                  onChange={(e) => set('receptionTime', e.target.value)}
                />
                {isWedding && (
                  <input
                    className="w-full border rounded-xl px-3 py-2.5"
                    placeholder="חופה"
                    value={form.chuppahTime}
                    onChange={(e) => set('chuppahTime', e.target.value)}
                  />
                )}
              </div>
              <input
                className="w-full border rounded-xl px-3 py-2.5"
                placeholder="אולם"
                value={form.hallName}
                onChange={(e) => set('hallName', e.target.value)}
              />
              <input
                className="w-full border rounded-xl px-3 py-2.5"
                placeholder="עיר"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
              <input
                className="w-full border rounded-xl px-3 py-2.5"
                placeholder="משפט סיום"
                value={form.welcomeLine}
                onChange={(e) => set('welcomeLine', e.target.value)}
              />
              {isBarBat && (
                <input
                  className="w-full border rounded-xl px-3 py-2.5"
                  placeholder="קישור לתמונה (בר/בת)"
                  value={form.photoUrl || ''}
                  onChange={(e) => set('photoUrl', e.target.value)}
                />
              )}
              {isWedding && (
                <>
                  <input
                    className="w-full border rounded-xl px-3 py-2.5"
                    placeholder="הורי החתן"
                    value={form.groomParents}
                    onChange={(e) => set('groomParents', e.target.value)}
                  />
                  <input
                    className="w-full border rounded-xl px-3 py-2.5"
                    placeholder="הורי הכלה"
                    value={form.brideParents}
                    onChange={(e) => set('brideParents', e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">רקע להזמנה</div>
              <div className="grid grid-cols-3 gap-3">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      set('bgId', b.id);
                      if (b.id !== 'none') setCustomBg('');
                    }}
                    className={`rounded-xl border-2 overflow-hidden aspect-square ${
                      form.bgId === b.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
                    }`}
                  >
                    {b.src ? (
                      <img src={b.src} alt={b.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 bg-slate-50">
                        צבע בלבד
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">מסגרת להזמנה</div>
              <div className="grid grid-cols-3 gap-3">
                {FRAMES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set('frameId', f.id)}
                    className={`rounded-xl border-2 overflow-hidden aspect-square bg-white ${
                      form.frameId === f.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
                    }`}
                  >
                    {f.src ? (
                      <img src={f.src} alt={f.label} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">ללא</div>
                    )}
                  </button>
                ))}
              </div>
              {form.frameId && form.frameId !== 'none' && (
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-600">רוחב מסגרת</span>
                      <span className="text-slate-500">{Math.round((form.frameScaleX || 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={1.6}
                      step={0.05}
                      value={form.frameScaleX || 1}
                      onChange={(e) => set('frameScaleX', Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-600">גובה מסגרת</span>
                      <span className="text-slate-500">{Math.round((form.frameScaleY || 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={1.6}
                      step={0.05}
                      value={form.frameScaleY || 1}
                      onChange={(e) => set('frameScaleY', Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">אובייקטים ל־{form.eventType}</div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {relevantObjects.map((obj) => {
                  const selected = (form.selectedObjects || []).find((o) => o.id === obj.id);
                  return (
                    <div
                      key={obj.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        selected ? 'bg-amber-50 border-amber-400' : 'border-slate-200'
                      }`}
                    >
                      <input type="checkbox" checked={!!selected} onChange={() => toggleObject(obj.id)} className="w-4 h-4" />
                      <img
                        src={obj.src}
                        alt={obj.label}
                        className="object-contain rounded"
                        style={{ width: 40, height: 40 }}
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.3';
                        }}
                      />
                      <span className="text-sm flex-1">{obj.label}</span>
                      {selected && (
                        <select
                          value={selected.position}
                          onChange={(e) => setObjectPosition(obj.id, e.target.value)}
                          className="border rounded-lg px-2 py-1 text-sm bg-white"
                        >
                          <option value="top">למעלה</option>
                          <option value="bottom">למטה</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <div className="font-bold mb-3">צבע רקע (אם אין תמונת רקע)</div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customBg && customBg.startsWith('#') ? customBg : '#faf7f2'}
                  onChange={(e) => {
                    setCustomBg(e.target.value);
                    set('bgId', 'none');
                  }}
                  className="w-12 h-12 rounded-xl cursor-pointer border"
                />
                {customBg && (
                  <button type="button" onClick={() => setCustomBg('')} className="text-xs text-red-500 underline">
                    איפוס לצבע התבנית
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!form.includeMonogramCard}
                  onChange={(e) => set('includeMonogramCard', e.target.checked)}
                />
                כרטיס ראשי תיבות (מקופל)
              </label>
              <button type="button" onClick={save} className="bg-slate-800 text-white px-5 py-3 rounded-xl font-bold">
                {saved ? '✅ נשמר' : 'שמירה'}
              </button>
              <button
                type="button"
                onClick={exportJpeg}
                disabled={exporting}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-bold"
              >
                {exporting ? '⏳...' : '📷 JPEG'}
              </button>
              <button
                type="button"
                onClick={exportPdf}
                disabled={exporting}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl font-bold"
              >
                📄 PDF
              </button>
              <Link
                href={`/invite/${eventId}`}
                target="_blank"
                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold"
              >
                תצוגה מלאה ↗
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5 lg:sticky lg:top-4 h-fit">
            <div className="font-bold mb-4">תצוגה מקדימה</div>

            {form.includeMonogramCard ? (
              <div
                ref={cardRef}
                className="mx-auto shadow-xl overflow-hidden flex print-card"
                style={{
                  width: '100%',
                  maxWidth: 640,
                  aspectRatio: '2 / 1.55',
                  backgroundColor:
                    customBg && customBg.startsWith('#') ? customBg : template?.bg || '#faf8f5',
                  backgroundImage:
                    form.bgId && form.bgId !== 'none'
                      ? `url(${BACKGROUNDS.find((b) => b.id === form.bgId)?.src || ''})`
                      : customBg && !customBg.startsWith('#')
                      ? `url(${customBg})`
                      : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: template?.text || '#3f2a1e',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                <div
                  className="w-1/2 flex flex-col items-center justify-center text-center relative"
                  style={{ borderLeft: `1px solid ${template?.line || '#e8dfd0'}` }}
                >
                  <div
                    className="text-4xl sm:text-5xl tracking-[0.15em] font-serif mb-2"
                    style={{
                      color:
                        form.monogramColor ||
                        (template?.line && template.line !== '#e5e5e5'
                          ? template.line
                          : template?.text || '#3f2a1e'),
                    }}
                  >
                    {form.monogram || 'A&K'}
                  </div>
                  <div
                    className="text-xs italic mb-4 tracking-wide"
                    style={{
                      color: form.monogramColor || template?.muted || '#6b6b6b',
                      opacity: 0.85,
                    }}
                  >
                    {form.eventType === 'חתונה' || !form.eventType ? 'The Wedding' : form.eventType}
                  </div>
                  <div
                    className="w-8 h-px mb-3"
                    style={{
                      background: form.monogramColor || template?.line || '#c4a574',
                      opacity: 0.5,
                    }}
                  />
                  <div
                    className="text-sm tracking-widest font-light"
                    style={{ color: form.monogramColor || template?.text || '#3f2a1e' }}
                  >
                    {formatDate(form.date) || '00.00.0000'}
                  </div>
                </div>

                <div className="w-1/2 overflow-hidden flex items-stretch">
                  <div className="w-full h-full">
                    <InviteCard
                      form={form}
                      template={template}
                      formatDate={formatDate}
                      customBg={customBg}
                      compact
                    />
                  </div>
                </div>
              </div>
            ) : (
              <InviteCard
                form={form}
                template={template}
                formatDate={formatDate}
                customBg={customBg}
                cardRef={cardRef}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0 !important;
            size: A5 landscape;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-card,
          .print-card * {
            visibility: visible !important;
          }
          .print-card {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            height: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}