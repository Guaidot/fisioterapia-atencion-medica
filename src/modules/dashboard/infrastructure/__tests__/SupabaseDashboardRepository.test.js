import { describe, expect, it } from 'vitest';
import { SupabaseDashboardRepository } from '../SupabaseDashboardRepository.js';

const evaluationRows = [
  { created_at: '2026-10-20T12:00:00.000Z', zone: 'rodilla', lesion_type: 'muscular' },
  { created_at: '2026-10-19T12:00:00.000Z', zone: 'hombro', lesion_type: 'articular' },
  { created_at: '2026-10-18T12:00:00.000Z', zone: 'rodilla', lesion_type: 'muscular' },
];

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.offset = 0;
  }

  select(selection, options) {
    this.selection = selection;
    this.selectOptions = options;
    return this;
  }

  is() {
    return this;
  }

  gte(_column, value) {
    this.since = value;
    return this;
  }

  order() {
    return this;
  }

  range(start) {
    this.offset = start;
    return this;
  }

  then(resolve, reject) {
    const response =
      this.table === 'patients'
        ? { count: 7, data: null, error: null }
        : {
            data: evaluationRows.slice(this.offset, this.offset + 2),
            count: null,
            error: null,
          };
    return Promise.resolve(response).then(resolve, reject);
  }
}

describe('SupabaseDashboardRepository', () => {
  it('counts active patients and reads only summary fields in pages', async () => {
    const selections = [];
    const client = {
      from: (table) => {
        const builder = new QueryBuilder(table);
        const select = builder.select.bind(builder);
        builder.select = (columns, options) => {
          selections.push({ table, columns, options });
          return select(columns, options);
        };
        return builder;
      },
    };
    const repository = new SupabaseDashboardRepository(client);

    const result = await repository.getOverview({
      since: '2026-09-20T12:00:00.000Z',
      pageSize: 2,
    });

    expect(result).toEqual({
      activePatients: 7,
      evaluations: evaluationRows.map((row) => ({
        createdAt: row.created_at,
        zone: row.zone,
        lesionType: row.lesion_type,
      })),
    });
    expect(selections.find((item) => item.table === 'patients')).toMatchObject({
      options: { count: 'exact', head: true },
    });
    expect(selections.filter((item) => item.table === 'clinical_evaluations')).toHaveLength(2);
    expect(selections[1].columns).toBe('created_at, zone, lesion_type');
  });
});
