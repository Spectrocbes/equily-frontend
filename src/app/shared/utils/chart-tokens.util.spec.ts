import { getChartTokens, getDonutPalette } from './chart-tokens.util';

describe('getChartTokens', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--accent', '14 92 86');
    document.documentElement.style.setProperty('--gain', '15 143 104');
    document.documentElement.style.setProperty('--loss', '178 58 46');
    document.documentElement.style.setProperty('--border-subtle', '237 239 239');
    document.documentElement.style.setProperty('--ink-muted', '100 116 139');
    document.documentElement.style.setProperty('--surface-card', '255 255 255');
  });

  it('resolves each CSS custom property into an rgb() string', () => {
    expect(getChartTokens()).toEqual({
      accent:   'rgb(14, 92, 86)',
      gain:     'rgb(15, 143, 104)',
      loss:     'rgb(178, 58, 46)',
      gridline: 'rgb(237, 239, 239)',
      axisText: 'rgb(100, 116, 139)',
      surface:  'rgb(255, 255, 255)',
    });
  });
});

describe('getDonutPalette', () => {
  afterEach(() => document.documentElement.classList.remove('dark'));

  it('returns the light palette by default', () => {
    expect(getDonutPalette()[0]).toBe('#0E5C56');
  });

  it('returns the dark palette when html.dark is set', () => {
    document.documentElement.classList.add('dark');
    expect(getDonutPalette()[0]).toBe('#4FB0A5');
  });
});
