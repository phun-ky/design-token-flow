/* eslint no-console:0 */
'use strict';

import panzoom from 'panzoom';
import { uniqueID } from './lib/helpers';
import * as cardinal from './lib/cardinal';
import * as node from './lib/node';

import DesignToken from './design-token';

const tokens = {
  'color-background-button-primary': {
    id: 'color-background-button-primary',
    category: 'color',
    ancestorId: 'color-cta',
    value: 'rgb(0,84,240)',
    type: 'background',
    item: 'button',
    subItem: 'primary'
  },
  'color-background-lightestBeige': {
    id: 'color-background-lightestBeige',
    category: 'color',
    ancestorId: 'color-base-doctor',
    value: 'rgb(250,249,247)',
    type: 'background',
    item: 'lightestBeige'
  },
  'color-background-lighterBeige': {
    id: 'color-background-lighterBeige',
    category: 'color',
    ancestorId: 'color-base-theSpeedOfLight',
    value: 'rgb(246,243,240)',
    type: 'background',
    item: 'lighterBeige'
  },
  'color-background-lightBeige': {
    id: 'color-background-lightBeige',
    category: 'color',
    ancestorId: 'color-base-valhallanBlizzard',
    value: 'rgb(241,236,232)',
    type: 'background',
    item: 'lightBeige'
  },
  'color-background-beige': {
    id: 'color-background-beige',
    category: 'color',
    ancestorId: 'color-base-desertStorm',
    value: 'rgb(237,230,225)',
    type: 'background',
    item: 'beige'
  },
  'color-background-darkBeige': {
    id: 'color-background-darkBeige',
    category: 'color',
    ancestorId: 'color-base-stoneHarbour',
    value: 'rgb(232,224,217)',
    type: 'background',
    item: 'darkBeige'
  },
  'color-accent-blue': {
    id: 'color-accent-blue',
    category: 'color',
    ancestorId: 'color-base-megamanHelmet',
    value: 'rgb(0,84,240)',
    type: 'accent',
    item: 'blue'
  },
  'color-base-megamanHelmet': {
    id: 'color-base-megamanHelmet',
    category: 'color',
    value: 'rgb(0,84,240)',
    type: 'base',
    item: 'megamanHelmet'
  },
  'color-base-bracingBlue': {
    id: 'color-base-bracingBlue',
    category: 'color',
    value: 'rgb(0, 64, 128)',
    type: 'base',
    item: 'bracingBlue'
  },
  'color-base-fozzieBear': {
    id: 'color-base-fozzieBear',
    category: 'color',
    value: 'rgb(110,98,94)',
    type: 'base',
    item: 'fozzieBear'
  },
  'color-base-blackSlug': {
    id: 'color-base-blackSlug',
    category: 'color',
    value: 'rgb(51,30,17)',
    type: 'base',
    item: 'blackSlug'
  },
  'color-base-camarone': {
    id: 'color-base-camarone',
    category: 'color',
    value: 'rgb(33, 115, 49)',
    type: 'base',
    item: 'camarone'
  },
  'color-base-virtualBoy': {
    id: 'color-base-virtualBoy',
    category: 'color',
    value: 'rgb(187, 50, 12)',
    type: 'base',
    item: 'virtualBoy'
  },
  'color-base-muskDeer': {
    id: 'color-base-muskDeer',
    category: 'color',
    value: 'rgb(128, 92, 92)',
    type: 'base',
    item: 'muskDeer'
  },
  'color-base-freshSalmon': {
    id: 'color-base-freshSalmon',
    category: 'color',
    value: 'rgb(255, 133, 105)',
    type: 'base',
    item: 'freshSalmon'
  },
  'color-base-peachCrayon': {
    id: 'color-base-peachCrayon',
    category: 'color',
    value: 'rgb(255, 201, 166)',
    type: 'base',
    item: 'peachCrayon'
  },
  'color-base-appleCinnamon': {
    id: 'color-base-appleCinnamon',
    category: 'color',
    value: 'rgb(176, 135, 89)',
    type: 'base',
    item: 'appleCinnamon'
  },
  'color-base-goBananas': {
    id: 'color-base-goBananas',
    category: 'color',
    value: 'rgb(252, 199, 79)',
    type: 'base',
    item: 'goBananas'
  },
  'color-base-swedishYellow': {
    id: 'color-base-swedishYellow',
    category: 'color',
    value: 'rgb(255, 224, 130)',
    type: 'base',
    item: 'swedishYellow'
  },
  'color-base-littleLeague': {
    id: 'color-base-littleLeague',
    category: 'color',
    value: 'rgb(107, 153, 148)',
    type: 'base',
    item: 'littleLeague'
  },
  'color-base-tranquilTeal': {
    id: 'color-base-tranquilTeal',
    category: 'color',
    value: 'rgb(135, 199, 186)',
    type: 'base',
    item: 'tranquilTeal'
  },
  'color-base-spearmintWater': {
    id: 'color-base-spearmintWater',
    category: 'color',
    value: 'rgb(181, 237, 232)',
    type: 'base',
    item: 'spearmintWater'
  },
  'color-base-vanity': {
    id: 'color-base-vanity',
    category: 'color',
    value: 'rgb(83, 146, 178)',
    type: 'base',
    item: 'vanity'
  },
  'color-base-blueMartini': {
    id: 'color-base-blueMartini',
    category: 'color',
    value: 'rgb(76, 176, 211)',
    type: 'base',
    item: 'blueMartini'
  },
  'color-base-gasGiant': {
    id: 'color-base-gasGiant',
    category: 'color',
    value: 'rgb(151, 226, 247)',
    type: 'base',
    item: 'gasGiant'
  },
  'color-base-stoneHarbour': {
    id: 'color-base-stoneHarbour',
    category: 'color',
    value: 'rgb(232,224,217)',
    type: 'base',
    item: 'stoneHarbour'
  },
  'color-base-desertStorm': {
    id: 'color-base-desertStorm',
    category: 'color',
    value: 'rgb(237,230,225)',
    type: 'base',
    item: 'desertStorm'
  },
  'color-base-valhallanBlizzard': {
    id: 'color-base-valhallanBlizzard',
    category: 'color',
    value: 'rgb(241,236,232)',
    type: 'base',
    item: 'valhallanBlizzard'
  },
  'color-base-theSpeedOfLight': {
    id: 'color-base-theSpeedOfLight',
    category: 'color',
    value: 'rgb(246,243,240)',
    type: 'base',
    item: 'theSpeedOfLight'
  },
  'color-base-doctor': {
    id: 'color-base-doctor',
    category: 'color',
    value: 'rgb(250,249,247)',
    type: 'base',
    item: 'doctor'
  },
  'color-cta': {
    id: 'color-cta',
    category: 'color',
    ancestorId: 'color-accent-blue',
    value: 'rgb(0,84,240)',
    type: 'cta'
  },
  'color-infographic-darkRed': {
    id: 'color-infographic-darkRed',
    category: 'color',
    ancestorId: 'color-base-muskDeer',
    value: 'rgb(128, 92, 92)',
    type: 'infographic',
    item: 'darkRed'
  },
  'color-infographic-red': {
    id: 'color-infographic-red',
    category: 'color',
    ancestorId: 'color-base-freshSalmon',
    value: 'rgb(255, 133, 105)',
    type: 'infographic',
    item: 'red'
  },
  'color-infographic-lightRed': {
    id: 'color-infographic-lightRed',
    category: 'color',
    ancestorId: 'color-base-peachCrayon',
    value: 'rgb(255, 201, 166)',
    type: 'infographic',
    item: 'lightRed'
  },
  'color-infographic-darkYellow': {
    id: 'color-infographic-darkYellow',
    category: 'color',
    ancestorId: 'color-base-appleCinnamon',
    value: 'rgb(176, 135, 89)',
    type: 'infographic',
    item: 'darkYellow'
  },
  'color-infographic-yellow': {
    id: 'color-infographic-yellow',
    category: 'color',
    ancestorId: 'color-base-goBananas',
    value: 'rgb(252, 199, 79)',
    type: 'infographic',
    item: 'yellow'
  },
  'color-infographic-lightYellow': {
    id: 'color-infographic-lightYellow',
    category: 'color',
    ancestorId: 'color-base-swedishYellow',
    value: 'rgb(255, 224, 130)',
    type: 'infographic',
    item: 'lightYellow'
  },
  'color-infographic-darkGreen': {
    id: 'color-infographic-darkGreen',
    category: 'color',
    ancestorId: 'color-base-littleLeague',
    value: 'rgb(107, 153, 148)',
    type: 'infographic',
    item: 'darkGreen'
  },
  'color-infographic-green': {
    id: 'color-infographic-green',
    category: 'color',
    ancestorId: 'color-base-tranquilTeal',
    value: 'rgb(135, 199, 186)',
    type: 'infographic',
    item: 'green'
  },
  'color-infographic-lightGreen': {
    id: 'color-infographic-lightGreen',
    category: 'color',
    ancestorId: 'color-base-spearmintWater',
    value: 'rgb(181, 237, 232)',
    type: 'infographic',
    item: 'lightGreen'
  },
  'color-infographic-darkBlue': {
    id: 'color-infographic-darkBlue',
    category: 'color',
    ancestorId: 'color-base-vanity',
    value: 'rgb(83, 146, 178)',
    type: 'infographic',
    item: 'darkBlue'
  },
  'color-infographic-blue': {
    id: 'color-infographic-blue',
    category: 'color',
    ancestorId: 'color-base-blueMartini',
    value: 'rgb(76, 176, 211)',
    type: 'infographic',
    item: 'blue'
  },
  'color-infographic-lightBlue': {
    id: 'color-infographic-lightBlue',
    category: 'color',
    ancestorId: 'color-base-gasGiant',
    value: 'rgb(151, 226, 247)',
    type: 'infographic',
    item: 'lightBlue'
  },
  'color-interactive-darkBlue': {
    id: 'color-interactive-darkBlue',
    category: 'color',
    ancestorId: 'color-base-bracingBlue',
    value: 'rgb(0, 64, 128)',
    type: 'interactive',
    item: 'darkBlue'
  },
  'color-status-red': {
    id: 'color-status-red',
    category: 'color',
    ancestorId: 'color-base-virtualBoy',
    value: 'rgb(187, 50, 12)',
    type: 'status',
    item: 'red'
  },
  'color-status-green': {
    id: 'color-status-green',
    category: 'color',
    ancestorId: 'color-base-camarone',
    value: 'rgb(33, 115, 49)',
    type: 'status',
    item: 'green'
  },
  'color-text-lightestBeige': {
    id: 'color-text-lightestBeige',
    category: 'color',
    ancestorId: 'color-base-doctor',
    value: 'rgb(250,249,247)',
    type: 'text',
    item: 'lightestBeige'
  },
  'color-text-lightBrown': {
    id: 'color-text-lightBrown',
    category: 'color',
    ancestorId: 'color-base-fozzieBear',
    value: 'rgb(110,98,94)',
    type: 'text',
    item: 'lightBrown'
  },
  'color-text-brown': {
    id: 'color-text-brown',
    category: 'color',
    ancestorId: 'color-base-blackSlug',
    value: 'rgb(51,30,17)',
    type: 'text',
    item: 'brown'
  },
  'font-family-sans-variable': {
    id: 'font-family-sans-variable',
    category: 'font-family',
    value: '"If Sans Variable", Arial, sans-serif',
    type: 'sans',
    item: 'variable'
  },
  'font-family-sans-thin-regular': {
    id: 'font-family-sans-thin-regular',
    category: 'font-family',
    value: '"If Sans Thin", Arial, sans-serif',
    type: 'sans',
    item: 'thin',
    subItem: 'regular'
  },
  'font-family-sans-thin-italic': {
    id: 'font-family-sans-thin-italic',
    category: 'font-family',
    value: '"If Sans Thin Italic", Arial, sans-serif',
    type: 'sans',
    item: 'thin',
    subItem: 'italic'
  },
  'font-family-sans-light-regular': {
    id: 'font-family-sans-light-regular',
    category: 'font-family',
    value: '"If Sans Light", Arial, sans-serif',
    type: 'sans',
    item: 'light',
    subItem: 'regular'
  },
  'font-family-sans-light-italic': {
    id: 'font-family-sans-light-italic',
    category: 'font-family',
    value: '"If Sans Light Italic", Arial, sans-serif',
    type: 'sans',
    item: 'light',
    subItem: 'italic'
  },
  'font-family-sans-normal-regular': {
    id: 'font-family-sans-normal-regular',
    category: 'font-family',
    value: '"If Sans", Arial, sans-serif',
    type: 'sans',
    item: 'normal',
    subItem: 'regular'
  },
  'font-family-sans-normal-italic': {
    id: 'font-family-sans-normal-italic',
    category: 'font-family',
    value: '"If Sans Italic", Arial, sans-serif',
    type: 'sans',
    item: 'normal',
    subItem: 'italic'
  },
  'font-family-sans-medium-regular': {
    id: 'font-family-sans-medium-regular',
    category: 'font-family',
    value: '"If Sans Medium", Arial, sans-serif',
    type: 'sans',
    item: 'medium',
    subItem: 'regular'
  },
  'font-family-sans-medium-italic': {
    id: 'font-family-sans-medium-italic',
    category: 'font-family',
    value: '"If Sans Medium Italic", Arial, sans-serif',
    type: 'sans',
    item: 'medium',
    subItem: 'italic'
  },
  'font-family-sans-bold-regular': {
    id: 'font-family-sans-bold-regular',
    category: 'font-family',
    value: '"If Sans Bold", Arial, sans-serif',
    type: 'sans',
    item: 'bold',
    subItem: 'regular'
  },
  'font-family-sans-bold-italic': {
    id: 'font-family-sans-bold-italic',
    category: 'font-family',
    value: '"If Sans Bold Italic", Arial, sans-serif',
    type: 'sans',
    item: 'bold',
    subItem: 'italic'
  },
  'size-font-14': {
    id: 'size-font-14',
    category: 'size',
    value: '0.875rem',
    type: 'font',
    item: '14',
    comment: '14 pixels'
  },
  'size-font-15': {
    id: 'size-font-15',
    category: 'size',
    value: '0.9375rem',
    type: 'font',
    item: '15',
    comment: '15 pixels'
  },
  'size-font-16': {
    id: 'size-font-16',
    category: 'size',
    value: '1rem',
    type: 'font',
    item: '16',
    comment: '16 pixels'
  },
  'size-font-18': {
    id: 'size-font-18',
    category: 'size',
    value: '1.125rem',
    type: 'font',
    item: '18',
    comment: '18 pixels'
  },
  'size-font-20': {
    id: 'size-font-20',
    category: 'size',
    value: '1.25rem',
    type: 'font',
    item: '20',
    comment: '20 pixels'
  },
  'size-font-22': {
    id: 'size-font-22',
    category: 'size',
    value: '1.375rem',
    type: 'font',
    item: '22',
    comment: '22 pixels'
  },
  'size-font-24': {
    id: 'size-font-24',
    category: 'size',
    value: '1.5rem',
    type: 'font',
    item: '24',
    comment: '24 pixels'
  },
  'size-font-26': {
    id: 'size-font-26',
    category: 'size',
    value: '1.625rem',
    type: 'font',
    item: '26',
    comment: '26 pixels'
  },
  'size-font-28': {
    id: 'size-font-28',
    category: 'size',
    value: '1.75rem',
    type: 'font',
    item: '28',
    comment: '28 pixels'
  },
  'size-font-30': {
    id: 'size-font-30',
    category: 'size',
    value: '1.875rem',
    type: 'font',
    item: '30',
    comment: '30 pixels'
  },
  'size-font-32': {
    id: 'size-font-32',
    category: 'size',
    value: '2rem',
    type: 'font',
    item: '32',
    comment: '32 pixels'
  },
  'size-font-33': {
    id: 'size-font-33',
    category: 'size',
    value: '2.0625rem',
    type: 'font',
    item: '33',
    comment: '33 pixels'
  },
  'size-font-36': {
    id: 'size-font-36',
    category: 'size',
    value: '2.25rem',
    type: 'font',
    item: '36',
    comment: '36 pixels'
  },
  'size-font-38': {
    id: 'size-font-38',
    category: 'size',
    value: '2.375rem',
    type: 'font',
    item: '38',
    comment: '38 pixels'
  },
  'size-font-42': {
    id: 'size-font-42',
    category: 'size',
    value: '2.625rem',
    type: 'font',
    item: '42',
    comment: '42 pixels'
  },
  'size-font-48': {
    id: 'size-font-48',
    category: 'size',
    value: '3rem',
    type: 'font',
    item: '48',
    comment: '48 pixels'
  },
  'size-font-54': {
    id: 'size-font-54',
    category: 'size',
    value: '3.375rem',
    type: 'font',
    item: '54',
    comment: '54 pixels'
  },
  'size-font-56': {
    id: 'size-font-56',
    category: 'size',
    value: '3.5rem',
    type: 'font',
    item: '56',
    comment: '56 pixels'
  },
  'size-font-66': {
    id: 'size-font-66',
    category: 'size',
    value: '4.125rem',
    type: 'font',
    item: '66',
    comment: '66 pixels'
  },
  'size-lineHeight-24': {
    id: 'size-lineHeight-24',
    category: 'size',
    value: '1.5rem',
    type: 'lineHeight',
    item: '24',
    comment: '24px'
  },
  'size-lineHeight-28': {
    id: 'size-lineHeight-28',
    category: 'size',
    value: '1.75rem',
    type: 'lineHeight',
    item: '28',
    comment: '28px'
  },
  'size-lineHeight-32': {
    id: 'size-lineHeight-32',
    category: 'size',
    value: '2rem',
    type: 'lineHeight',
    item: '32',
    comment: '32px'
  },
  'size-lineHeight-40': {
    id: 'size-lineHeight-40',
    category: 'size',
    value: '2.5rem',
    type: 'lineHeight',
    item: '40',
    comment: '40px'
  },
  'size-lineHeight-42': {
    id: 'size-lineHeight-42',
    category: 'size',
    value: '2.625rem',
    type: 'lineHeight',
    item: '42',
    comment: '42px'
  },
  'size-lineHeight-44': {
    id: 'size-lineHeight-44',
    category: 'size',
    value: '2.75rem',
    type: 'lineHeight',
    item: '44',
    comment: '44px'
  },
  'size-lineHeight-48': {
    id: 'size-lineHeight-48',
    category: 'size',
    value: '3rem',
    type: 'lineHeight',
    item: '48',
    comment: '48px'
  },
  'size-lineHeight-52': {
    id: 'size-lineHeight-52',
    category: 'size',
    value: '3.25rem',
    type: 'lineHeight',
    item: '52',
    comment: '52px'
  },
  'size-lineHeight-56': {
    id: 'size-lineHeight-56',
    category: 'size',
    value: '3.5rem',
    type: 'lineHeight',
    item: '56',
    comment: '56px'
  },
  'size-lineHeight-64': {
    id: 'size-lineHeight-64',
    category: 'size',
    value: '4rem',
    type: 'lineHeight',
    item: '64',
    comment: '64px'
  },
  'size-lineHeight-72': {
    id: 'size-lineHeight-72',
    category: 'size',
    value: '4.5rem',
    type: 'lineHeight',
    item: '72',
    comment: '72px'
  },
  'size-spacing-4': {
    id: 'size-spacing-4',
    category: 'size',
    value: '0.25rem',
    type: 'spacing',
    item: '4',
    comment: '4px'
  },
  'size-spacing-8': {
    id: 'size-spacing-8',
    category: 'size',
    value: '0.5rem',
    type: 'spacing',
    item: '8',
    comment: '8px'
  },
  'size-spacing-12': {
    id: 'size-spacing-12',
    category: 'size',
    value: '0.75rem',
    type: 'spacing',
    item: '12',
    comment: '12px'
  },
  'size-spacing-16': {
    id: 'size-spacing-16',
    category: 'size',
    value: '1rem',
    type: 'spacing',
    item: '16',
    comment: '16px'
  },
  'size-spacing-20': {
    id: 'size-spacing-20',
    category: 'size',
    value: '1.25rem',
    type: 'spacing',
    item: '20',
    comment: '20px'
  },
  'size-spacing-24': {
    id: 'size-spacing-24',
    category: 'size',
    value: '1.5rem',
    type: 'spacing',
    item: '24',
    comment: '24px'
  },
  'size-spacing-28': {
    id: 'size-spacing-28',
    category: 'size',
    value: '1.75rem',
    type: 'spacing',
    item: '28',
    comment: '28px'
  },
  'size-spacing-32': {
    id: 'size-spacing-32',
    category: 'size',
    value: '2rem',
    type: 'spacing',
    item: '32',
    comment: '32px'
  },
  'size-spacing-36': {
    id: 'size-spacing-36',
    category: 'size',
    value: '2.25rem',
    type: 'spacing',
    item: '36',
    comment: '36px'
  },
  'size-spacing-40': {
    id: 'size-spacing-40',
    category: 'size',
    value: '2.5rem',
    type: 'spacing',
    item: '40',
    comment: '40px'
  },
  'size-spacing-44': {
    id: 'size-spacing-44',
    category: 'size',
    value: '2.75rem',
    type: 'spacing',
    item: '44',
    comment: '44px'
  },
  'size-spacing-48': {
    id: 'size-spacing-48',
    category: 'size',
    value: '3rem',
    type: 'spacing',
    item: '48',
    comment: '48px'
  },
  'size-spacing-52': {
    id: 'size-spacing-52',
    category: 'size',
    value: '3.25rem',
    type: 'spacing',
    item: '52',
    comment: '52px'
  },
  'size-spacing-56': {
    id: 'size-spacing-56',
    category: 'size',
    value: '3.5rem',
    type: 'spacing',
    item: '56',
    comment: '56px'
  },
  'size-spacing-60': {
    id: 'size-spacing-60',
    category: 'size',
    value: '3.75rem',
    type: 'spacing',
    item: '60',
    comment: '60px'
  },
  'size-spacing-64': {
    id: 'size-spacing-64',
    category: 'size',
    value: '4rem',
    type: 'spacing',
    item: '64',
    comment: '64px'
  },
  'size-spacing-68': {
    id: 'size-spacing-68',
    category: 'size',
    value: '4.25rem',
    type: 'spacing',
    item: '68',
    comment: '68px'
  },
  'size-spacing-72': {
    id: 'size-spacing-72',
    category: 'size',
    value: '4.5rem',
    type: 'spacing',
    item: '72',
    comment: '72px'
  },
  'size-spacing-76': {
    id: 'size-spacing-76',
    category: 'size',
    value: '4.75rem',
    type: 'spacing',
    item: '76',
    comment: '76px'
  },
  'size-spacing-80': {
    id: 'size-spacing-80',
    category: 'size',
    value: '5rem',
    type: 'spacing',
    item: '80',
    comment: '80px'
  },
  'size-spacing-84': {
    id: 'size-spacing-84',
    category: 'size',
    value: '5.25rem',
    type: 'spacing',
    item: '84',
    comment: '84px'
  },
  'size-spacing-88': {
    id: 'size-spacing-88',
    category: 'size',
    value: '5.5rem',
    type: 'spacing',
    item: '88',
    comment: '88px'
  },
  'size-spacing-92': {
    id: 'size-spacing-92',
    category: 'size',
    value: '5.75rem',
    type: 'spacing',
    item: '92',
    comment: '92px'
  },
  'size-spacing-96': {
    id: 'size-spacing-96',
    category: 'size',
    value: '6rem',
    type: 'spacing',
    item: '96',
    comment: '96px'
  },
  'size-spacing-100': {
    id: 'size-spacing-100',
    category: 'size',
    value: '6.25rem',
    type: 'spacing',
    item: '100',
    comment: '100px'
  },
  'size-spacing-104': {
    id: 'size-spacing-104',
    category: 'size',
    value: '6.5rem',
    type: 'spacing',
    item: '104',
    comment: '104px'
  },
  'font-weight-36': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-36',
    category: 'font',
    value: 36,
    type: 'weight',
    item: '36'
  },
  'font-weight-40': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-40',
    category: 'font',
    value: 40,
    type: 'weight',
    item: '40'
  },
  'font-weight-45': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-45',
    category: 'font',
    value: 45,
    type: 'weight',
    item: '45'
  },
  'font-weight-48': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-48',
    category: 'font',
    value: 48,
    type: 'weight',
    item: '48'
  },
  'font-weight-50': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-50',
    category: 'font',
    value: 50,
    type: 'weight',
    item: '50'
  },
  'font-weight-54': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-54',
    category: 'font',
    value: 54,
    type: 'weight',
    item: '54'
  },
  'font-weight-64': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-64',
    category: 'font',
    value: 64,
    type: 'weight',
    item: '64'
  },
  'font-weight-70': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-70',
    category: 'font',
    value: 70,
    type: 'weight',
    item: '70'
  },
  'font-weight-78': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-78',
    category: 'font',
    value: 78,
    type: 'weight',
    item: '78'
  },
  'font-weight-82': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-82',
    category: 'font',
    value: 82,
    type: 'weight',
    item: '82'
  },
  'font-weight-85': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-85',
    category: 'font',
    value: 85,
    type: 'weight',
    item: '85'
  },
  'font-weight-104': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-104',
    category: 'font',
    value: 104,
    type: 'weight',
    item: '104'
  },
  'font-weight-126': {
    variable: true,
    'font-family': '"If Sans", Arial, sans-serif',
    id: 'font-weight-126',
    category: 'font',
    value: 126,
    type: 'weight',
    item: '126'
  }
};

const DTF = function (raw_tokens) {
  this._raw_tokens = raw_tokens;
  this._tokens = [];
  this._init();
};

DTF.prototype._process_tokens = function () {
  this._tokens.forEach(token => {
    // console.log(token);
    token.process();
  });
};

DTF.prototype._clear_lines = function () {
  document.querySelectorAll('path:not(.original)').forEach(el => el.remove());
};

DTF.prototype._setup_tokens = function () {
  if (this._raw_tokens) {
    const _tokens_array = [];
    const _grouped_tokens = {};
    Object.keys(this._raw_tokens).forEach(token => {
      _tokens_array.push(this._raw_tokens[token]);

      // const _design_token = new DesignToken(this._raw_tokens[token]);
      // document.querySelector('.container .base').appendChild(_design_token.el);
      // this._tokens.push(_design_token);
    });

    _tokens_array.forEach(token => {
      const { category, type, item } = token;
      const _group_name = item == 'button' ? `${category}-${type}-${item}` : `${category}-${type}`;
      if (!_grouped_tokens[_group_name]) {
        _grouped_tokens[_group_name] = [];
      }
      _grouped_tokens[_group_name].push(token);
    });

    let _custom_grouping_ordering = [
      ['color-base'],
      ['color-accent', 'color-background', 'color-text', 'color-infographic', 'color-interactive', 'color-status'],
      ['color-cta'],
      ['color-background-button'],
      ['size-font', 'size-lineHeight', 'font-weight'],
      ['font-family-sans', 'size-spacing']
    ];

    const _customized_grouping = [];

    _custom_grouping_ordering.forEach((custom_group, i) => {
      custom_group.forEach(group => {
        if (!_customized_grouping[i]) {
          _customized_grouping[i] = [];
        }
        _grouped_tokens[group].forEach(token => _customized_grouping[i].push(token));
      });
    });

    _customized_grouping.forEach(group => {
      const _base = node.create({ type: 'div', classNames: `base ${group}` });
      group.forEach(token => {
        const _design_token = new DesignToken(token);
        _base.appendChild(_design_token.el);
        this._tokens.push(_design_token);
      });
      this._container_el.appendChild(_base);
    });
  }
};

DTF.prototype._init = function () {
  this._container_el = document.querySelector('.container');
  // this._container_rect = document.querySelector('.container').getBoundingClientRect();
  this._setup_tokens();
  this._connect_tokens();
  this._process_tokens();
  //give resizing time to happen
  var raf;
  window.addEventListener(
    'resize',
    function () {
      // If there's a timer, cancel it
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      raf = window.requestAnimationFrame(
        function () {
          this._clear_lines();
          this._connect_tokens();
        }.bind(this)
      );
    }.bind(this)
  );
};

DTF.prototype._connect_tokens = function () {
  const _original_path_el = document.getElementById('path');

  this._tokens.forEach(token => {
    if (token.ancestors && token.ancestors.length !== 0) {
      token.ancestors.split(',').forEach(ancestor => {
        const _start_token = this._tokens.find(token => token.id === ancestor);
        const _stop_token = token;
        this._line(_original_path_el, _start_token, _stop_token);
        this._check_relation(_start_token, _stop_token);
      });
    }
  });
};

DTF.prototype._get_positions_for_path = function (direction) {
  let _pos1;
  let _pos2;
  switch (direction) {
    case 'north': {
      _pos1 = 'bottom';
      _pos2 = 'top';
      break;
    }
    case 'north-east': {
      _pos1 = 'left';
      _pos2 = 'right';
      break;
    }
    case 'east': {
      _pos1 = 'left';
      _pos2 = 'right';
      break;
    }
    case 'south-east': {
      _pos1 = 'left';
      _pos2 = 'right';
      break;
    }
    case 'south': {
      _pos1 = 'top';
      _pos2 = 'bottom';
      break;
    }
    case 'south-west':
    case 'west':
    case 'north-west':
    default: {
      _pos1 = 'right';
      _pos2 = 'left';
      break;
    }
  }

  return {
    pos1: _pos1,
    pos2: _pos2
  };
};

DTF.prototype._get_path = function (start_el, stop_el) {
  const _direction = cardinal.direction_of_element({ stop: stop_el, start: start_el });

  const { pos1, pos2 } = this._get_positions_for_path(_direction);

  const { x1, y1, x2, y2 } = cardinal.get_coords_pair_from_objects(start_el, stop_el, pos1, pos2);

  const _p0 = { x: x1, y: y1 }; // The first point of line
  const _c0 = { x: x1 + (x2 - x1) / 2, y: y1 }; // Controller for p0
  const _c1 = { x: x1 + (x2 - x1) / 2, y: y2 }; // Controller for p1
  const _p1 = { x: x2, y: y2 }; // The last point of line

  return (
    'M ' + _p0.x + ' ' + _p0.y + 'C ' + _c0.x + ' ' + _c0.y + ', ' + _c1.x + ' ' + _c1.y + ', ' + _p1.x + ' ' + _p1.y
  );
};

DTF.prototype._line = function (path, start_token, stop_token) {
  if (!start_token || !stop_token) return;

  const _start_el = start_token.el;
  const _stop_el = stop_token.el;
  const _id = uniqueID();
  const _path_el_id = `ph_draw_path-path-${_id}`;
  const _new_path = path.cloneNode(false);
  _new_path.setAttribute('id', _path_el_id);

  _new_path.setAttribute('data-start-el', _start_el.id);
  _new_path.setAttribute('data-stop-el', _stop_el.id);
  _new_path.classList.remove('original');
  _start_el.classList.add('is-connected');
  _stop_el.classList.add('is-connected');
  path.parentNode.insertBefore(_new_path, path.nextSibling);

  const _d = this._get_path(_start_el, _stop_el);

  _new_path.setAttribute('d', _d); //svg attributes

  //  const _new_control_1 = _control_el.cloneNode(false);
  //  const _control_el = document.getElementById('control');
  //  const _new_control_2 = _control_el.cloneNode(false);
  //  _new_control_1.setAttribute('data-for', _path_el_id);
  //  _new_control_2.setAttribute('data-for', _path_el_id);
  //  _new_control_1.classList.remove('original');
  //  _new_control_2.classList.remove('original');
  // _control_el.parentNode.insertBefore(_new_control_1, _control_el.nextSibling);
  // _control_el.parentNode.insertBefore(_new_control_2, _control_el.nextSibling);

  //_new_control_1.setAttribute('d','M'+_p0.x+','+(_p0.y)+'L'+_c0.x+','+(_c0.y));
  //_new_control_2.setAttribute('d','M'+_p1.x+','+(_p1.y)+'L'+_c1.x+','+(_c1.y));
};

DTF.prototype._check_relation = function (start_token, stop_token) {
  let _start_descendants = start_token._get('descendants');
  let _stop_ancestors = stop_token._get('ancestors');

  if (
    !_start_descendants ||
    (_start_descendants && _start_descendants.length === 0) ||
    (_start_descendants && _start_descendants === '')
  ) {
    start_token._set('descendants', stop_token.id);
  } else {
    const _to_array = _start_descendants.split(',');
    if (!_to_array.includes(stop_token.id)) {
      const _new_descendants = [..._start_descendants.split(','), ...[stop_token.id]].join(',');
      start_token._set('descendants', _new_descendants);
    }
  }

  if (
    !_stop_ancestors ||
    (_stop_ancestors && _stop_ancestors.length === 0) ||
    (_stop_ancestors && _stop_ancestors === '')
  ) {
    stop_token._set('ancestors', start_token.id);
  } else {
    const _to_array = _stop_ancestors.split(',');
    if (!_to_array.includes(start_token.id)) {
      const _new_ancestors = [..._stop_ancestors.split(','), ...[start_token.id]].join(',');
      stop_token._set('ancestors', _new_ancestors);
    }
  }
};

const draw = new DTF(tokens);

requestAnimationFrame(function () {
  draw._clear_lines();
  draw._connect_tokens();
});

let raf;

const position_and_draw = () => {
  draw._clear_lines();
  draw._connect_tokens();
  setTranslate(currentX, currentY, dragItem);

  raf = null;
};
var dragItem;
var container = document.querySelector('.container');

var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;

container.addEventListener('pointerdown', userPressed, { passive: true });

function userPressed(e) {
  dragItem = e.target;
  if (dragItem.classList.contains('is-moveable')) {
    container.addEventListener('pointerup', userReleased, { passive: true });
    container.addEventListener('pointercancel', userReleased, { passive: true });
    container.addEventListener('pointermove', userMoved, { passive: true });
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }
}

function userReleased() {
  container.removeEventListener('pointerup', userReleased, { passive: true });
  container.removeEventListener('pointercancel', userReleased, { passive: true });
  container.removeEventListener('pointermove', userMoved, { passive: true });
  initialX = currentX;
  initialY = currentY;

  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
  }
  dragItem.classList.remove('is-moving');
}

function userMoved(e) {
  dragItem.classList.add('is-moving');
  if (!raf) {
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;
    raf = requestAnimationFrame(position_and_draw);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0)';
}

const pan = panzoom(document.getElementById('scene'), {
  bounds: true,
  boundsPadding: 0.1,
  maxZoom: 3,
  minZoom: 0.1,
  transformOrigin: { x: 0.5, y: 0.5 },
  beforeWheel: function (e) {
    // allow wheel-zoom only if altKey is down. Otherwise - ignore
    var shouldIgnore = !e.shiftKey;
    return shouldIgnore;
  },
  beforeMouseDown: function (e) {
    // allow mouse-down panning only if altKey is down. Otherwise - ignore
    var shouldIgnore = !e.altKey;
    return shouldIgnore;
  }
});

const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
let currentZoomLevel = zoomLevels[4];
const text = document.querySelector('.zoomValue');

const setText = input => {
  text.textContent = `${input}%`;
};

const zoom = () => {
  const isSmooth = false;
  const scale = currentZoomLevel;
  if (scale) {
    const transform = pan.getTransform();
    const deltaX = transform.x;
    const deltaY = transform.y;
    const offsetX = scale + deltaX;
    const offsetY = scale + deltaY;

    if (isSmooth) {
      pan.zoom(0, 0, scale);
    } else {
      pan.zoomAbs(offsetX, offsetY, scale);
    }
  }
};

const zoomIn = () => {
  const idx = zoomLevels.indexOf(currentZoomLevel);

  // If next element exists
  if (typeof zoomLevels[idx + 1] !== 'undefined') {
    currentZoomLevel = zoomLevels[idx + 1];
  }

  if (currentZoomLevel === 1) {
    pan.moveTo(0, 0);
    pan.zoomAbs(0, 0, 1);
  } else {
    zoom();
  }
  setText(currentZoomLevel * 100);
};

const zoomOut = () => {
  const idx = zoomLevels.indexOf(currentZoomLevel);

  //if previous element exists
  if (typeof zoomLevels[idx - 1] !== 'undefined') {
    currentZoomLevel = zoomLevels[idx - 1];
  }

  if (currentZoomLevel === 1) {
    pan.moveTo(0, 0);
    pan.zoomAbs(0, 0, 1);
  } else {
    zoom();
  }

  setText(currentZoomLevel * 100);
};

function resetZoom() {
  pan.moveTo(0, 0);
  pan.zoomAbs(0, 0, 1);
}
const center_button_el = document.querySelector('.center');
center_button_el.addEventListener('click', resetZoom);

const zoomOut_button_el = document.querySelector('.zoomOut');
zoomOut_button_el.addEventListener('click', zoomOut);

const zoomIn_button_el = document.querySelector('.zoomIn');
zoomIn_button_el.addEventListener('click', zoomIn);
