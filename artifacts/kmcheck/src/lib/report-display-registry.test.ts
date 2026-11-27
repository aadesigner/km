import { describe, expect, it } from 'vitest';
import {
  ensureExportRegistryEvent,
  isRegistryStatusCheckNoise,
  sanitizeRegistryHistory,
} from './report-display';

describe('registry status-check noise', () => {
  it('detects Government/Special Usage Present rows', () => {
    expect(isRegistryStatusCheckNoise({ title: 'Government', subtitle: 'Present', type: 'government_use_history' })).toBe(true);
    expect(isRegistryStatusCheckNoise({ title: 'Special Usage', subtitle: 'Present', type: 'special_usage_history' })).toBe(true);
    expect(isRegistryStatusCheckNoise({ title: 'Owner change', subtitle: 'Personal Car', type: 'owner_change' })).toBe(false);
  });

  it('drops status checks and undated owner changes from the timeline', () => {
    const out = sanitizeRegistryHistory([
      { date: '2026-08-30', type: 'government_use_history', title: 'Government', subtitle: 'Present' },
      { date: '2026-08-30', type: 'special_usage_history', title: 'Special Usage', subtitle: 'Present' },
      { date: '2026-03-16', type: 'owner_change', title: 'Owner change', subtitle: 'Personal Car' },
      { date: null, type: 'owner_change', title: 'Owner change', subtitle: 'Personal Car' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.date).toBe('2026-03-16');
  });

  it('scrubs cached accident dump titles and subtitles', () => {
    const out = sanitizeRegistryHistory([
      {
        date: '2024-05-12',
        type: 'insurance',
        title: 'other_car_accident_list',
        subtitle:
          '3 · amount · component · insurance_amount · 607만원 · insurance_money · false · true · painting · repair_estimate_amount · reserve_amount · repair_estimate · wage',
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.title).toBe('Other vehicle accident');
    expect(out[0]?.subtitle ?? '').toMatch(/6,?070,?000|Insurance payout/i);
    expect(out[0]?.subtitle ?? '').not.toMatch(/insurance_amount|repair_estimate_amount/);
  });

  it('drops Detail N / bids count and cleans owner-change noise', () => {
    const out = sanitizeRegistryHistory([
      {
        date: '2020-09-07',
        type: 'owner_change',
        title: 'Owner change',
        subtitle: '1 · Owner change',
        details: [
          { label: 'Detail 1', value: '1' },
          { label: 'Detail 2', value: 'Owner change' },
          { label: 'Bids count', value: '4' },
          { label: 'usage', value: 'Personal use' },
        ],
      },
      {
        date: '2022-12-25',
        type: 'insurance',
        title: 'my car accident list + my car current owner accident list',
        subtitle: 'Paid 980,000 KRW',
      },
    ]);
    expect(out).toHaveLength(2);
    const owner = out.find((e) => e.type === 'owner_change');
    expect(owner?.subtitle).toBeNull();
    expect(owner?.details?.some((d) => /detail|bids/i.test(d.label))).toBeFalsy();
    expect(owner?.details?.some((d) => d.label === 'Usage' && d.value === 'Personal use')).toBe(true);
    const accident = out.find((e) => e.type === 'insurance');
    expect(accident?.title).toBe('Own vehicle accident + Accident under current owner');
  });
});

describe('ensureExportRegistryEvent', () => {
  it('adds export to registry when date/mileage only exist in mileage history', () => {
    const out = ensureExportRegistryEvent(
      [{ date: '2024-01-10', type: 'inspection', title: 'Inspection', mileage: 50000 }],
      [{ date: '2025-06-18', odometer: 94210, source: 'Export declaration' }],
    );
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({
      date: '2025-06-18',
      type: 'export',
      title: 'Export declaration',
      mileage: 94210,
    });
  });

  it('keeps export mileage through sanitize when bridged from mileage', () => {
    const bridged = ensureExportRegistryEvent(
      [],
      [{ date: '2025-06-18', odometer: 94210, source: 'Export declaration' }],
    );
    const out = sanitizeRegistryHistory(bridged);
    expect(out).toHaveLength(1);
    expect(out[0]?.type).toBe('export');
    expect(out[0]?.date).toBe('2025-06-18');
    expect(out[0]?.mileage).toBe(94210);
  });

  it('does not duplicate an existing export registry row', () => {
    const out = ensureExportRegistryEvent(
      [{ date: '2025-06-18', type: 'export', title: 'Export declaration', mileage: 94210 }],
      [{ date: '2025-06-18', odometer: 94210, source: 'Export declaration' }],
    );
    expect(out).toHaveLength(1);
  });
});
