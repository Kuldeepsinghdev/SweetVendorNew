import bcrypt from 'bcryptjs';
import { getTableName } from 'drizzle-orm';
import * as schema from '@/src/db/schema';
import {
  INITIAL_FESTIVALS,
  INITIAL_MASTER_SWEETS,
  INITIAL_CITIES,
  INITIAL_SALE_CENTERS,
  INITIAL_DISTRIBUTION_CENTERS,
  INITIAL_SALE_CENTER_SWEETS,
  INITIAL_BOOKINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_DISCOUNTS,
  INITIAL_MITRAS,
} from '@/src/data/initialData';

// Generate default users with known credentials
const now = new Date().toISOString();
const pin4729Hash = bcrypt.hashSync('4729', 10);
const pin1234Hash = bcrypt.hashSync('1234', 10);

const INITIAL_USERS = [
  {
    id: 'usr_superadmin_7737691749',
    name: 'Super Admin',
    phone: '7737691749',
    email: 'superadmin@sahakar.local',
    role: 'super_admin',
    pinHash: pin4729Hash,
    cityId: null,
    distributionCenterId: null,
    pincode: null,
    address: null,
    mustResetPin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'usr_superadmin_9000000001',
    name: 'Super Admin',
    phone: '9000000001',
    email: 'admin@sahakar.org',
    role: 'super_admin',
    pinHash: pin1234Hash,
    cityId: null,
    distributionCenterId: null,
    pincode: null,
    address: null,
    mustResetPin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'usr_cityadmin_9829012345',
    name: 'Jaipur City Admin',
    phone: '9829012345',
    email: 'jaipur.admin@sahakar.org',
    role: 'city_admin',
    pinHash: pin1234Hash,
    cityId: 'jaipur',
    distributionCenterId: null,
    pincode: '302001',
    address: 'Jaipur Head Office',
    mustResetPin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'usr_kendra_9875168011',
    name: 'Kendra Bajariya Lead',
    phone: '9875168011',
    email: 'bajariya.lead@sahakar.org',
    role: 'kendra',
    pinHash: pin1234Hash,
    cityId: 'sawai_madhopur',
    distributionCenterId: null,
    pincode: '322001',
    address: 'Main Market, Bajariya',
    mustResetPin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'usr_mitra_9413753383',
    name: 'राजेश गुप्ता',
    phone: '9413753383',
    email: 'rajesh.mitra@sahakar.org',
    role: 'mitra',
    pinHash: pin1234Hash,
    cityId: 'sawai_madhopur',
    centerId: 'kendra_aastha_sawaimadhopur',
    distributionCenterId: 'dc_aastha_bajariya',
    pincode: '322001',
    address: 'बजरिया, सवाई माधोपुर',
    mustResetPin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'usr_customer_9414011223',
    name: 'मुकेश गोयल',
    phone: '9414011223',
    email: 'mukesh.customer@gmail.com',
    role: 'customer',
    pinHash: pin1234Hash,
    cityId: 'sawai_madhopur',
    distributionCenterId: null,
    pincode: '322001',
    address: 'खेरदा, सवाई माधोपुर',
    mustResetPin: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

// In-memory data store map
const memoryStore: Record<string, any[]> = {
  users: [...INITIAL_USERS],
  master_sweets: JSON.parse(JSON.stringify(INITIAL_MASTER_SWEETS)),
  cities: JSON.parse(JSON.stringify(INITIAL_CITIES)),
  sale_centers: JSON.parse(JSON.stringify(INITIAL_SALE_CENTERS)),
  distribution_centers: JSON.parse(JSON.stringify(INITIAL_DISTRIBUTION_CENTERS)),
  sale_center_sweets: JSON.parse(JSON.stringify(INITIAL_SALE_CENTER_SWEETS)),
  festivals: JSON.parse(JSON.stringify(INITIAL_FESTIVALS)),
  bookings: JSON.parse(JSON.stringify(INITIAL_BOOKINGS)),
  audit_logs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
  notification_templates: JSON.parse(JSON.stringify(INITIAL_NOTIFICATION_TEMPLATES)),
  discounts: JSON.parse(JSON.stringify(INITIAL_DISCOUNTS)),
  mitra_applications: JSON.parse(JSON.stringify(INITIAL_MITRAS || [])),
  invoices: [],
  password_resets: [],
  login_otps: [],
};

function resolveTableName(tableOrName: any): string {
  if (typeof tableOrName === 'string') return tableOrName;
  if (!tableOrName) return '';
  try {
    return getTableName(tableOrName);
  } catch {
    if (tableOrName._?.name) return tableOrName._.name;
    return String(tableOrName);
  }
}

function getTableRows(tableOrName: any): any[] {
  const name = resolveTableName(tableOrName);
  if (!memoryStore[name]) {
    memoryStore[name] = [];
  }
  return memoryStore[name];
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase());
}

function extractConditions(cond: any): Array<{ col: string; val: any; op?: string }> {
  if (!cond) return [];
  const results: Array<{ col: string; val: any; op?: string }> = [];

  function walk(node: any) {
    if (!node) return;
    if (node.queryChunks) {
      let colName: string | null = null;
      let paramVal: any = undefined;
      let hasParam = false;
      let hasSubSql = false;

      for (const chunk of node.queryChunks) {
        if (!chunk) continue;
        if (typeof chunk === 'object') {
          if (chunk.queryChunks) {
            hasSubSql = true;
            walk(chunk);
          } else if ('name' in chunk && typeof chunk.name === 'string' && chunk.table) {
            colName = chunk.name;
          } else if ('value' in chunk && !('table' in chunk) && !Array.isArray(chunk.value)) {
            paramVal = chunk.value;
            hasParam = true;
          }
        }
      }

      if (!hasSubSql && colName && hasParam) {
        results.push({ col: colName, val: paramVal });
      }
    }
  }

  walk(cond);
  return results;
}

function matchesRow(row: any, conditions: Array<{ col: string; val: any }>): boolean {
  for (const { col, val } of conditions) {
    const camelCol = toCamelCase(col);
    const rowVal = row[col] !== undefined ? row[col] : row[camelCol];

    if (typeof val === 'boolean') {
      if (Boolean(rowVal) !== val) return false;
    } else if (val !== null && val !== undefined) {
      if (String(rowVal).toLowerCase() !== String(val).toLowerCase()) return false;
    }
  }
  return true;
}

export function createMockDb() {
  const mockDb: any = {
    select(selectFields?: any) {
      return {
        from(table: any) {
          const tableName = resolveTableName(table);
          let conditions: Array<{ col: string; val: any }> = [];
          let limitCount: number | null = null;
          let offsetCount: number | null = null;
          let joins: Array<{ table: any; on: any }> = [];

          const queryObj = {
            innerJoin(joinTable: any, onCondition: any) {
              joins.push({ table: joinTable, on: onCondition });
              return queryObj;
            },
            leftJoin(joinTable: any, onCondition: any) {
              joins.push({ table: joinTable, on: onCondition });
              return queryObj;
            },
            where(condition: any) {
              conditions = extractConditions(condition);
              return queryObj;
            },
            orderBy(..._args: any[]) {
              return queryObj;
            },
            limit(n: number) {
              limitCount = n;
              return queryObj;
            },
            offset(n: number) {
              offsetCount = n;
              return queryObj;
            },
            then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
              return new Promise((resolve) => {
                let rows = [...getTableRows(tableName)];

                // Handle inner joins if present (e.g. sweets catalog query)
                if (joins.length > 0) {
                  for (const join of joins) {
                    const joinTableName = resolveTableName(join.table);
                    const joinRows = getTableRows(joinTableName);
                    const joinConditions = extractConditions(join.on);

                    // Typical join is sweet_id = master_sweets.id & sale_center_id = ...
                    rows = rows.flatMap((r) => {
                      const matchingJoinRows = joinRows.filter((jr) => {
                        const sweetMatch =
                          jr.sweetId === r.id || jr.sweet_id === r.id || !jr.sweetId;
                        return sweetMatch;
                      });
                      return matchingJoinRows.map((jr) => ({ ...r, ...jr }));
                    });
                  }
                }

                // Filter by where conditions
                if (conditions.length > 0) {
                  rows = rows.filter((r) => matchesRow(r, conditions));
                }

                // Apply offset & limit
                if (offsetCount !== null) {
                  rows = rows.slice(offsetCount);
                }
                if (limitCount !== null) {
                  rows = rows.slice(0, limitCount);
                }

                // If selectFields specified fields (like { count: sql`count(*)` })
                if (selectFields && typeof selectFields === 'object') {
                  if ('count' in selectFields) {
                    rows = [{ count: rows.length }];
                  } else {
                    const keys = Object.keys(selectFields);
                    rows = rows.map((r) => {
                      const projected: any = {};
                      for (const k of keys) {
                        const targetCol = selectFields[k];
                        const colName =
                          typeof targetCol === 'object' && targetCol?.name
                            ? targetCol.name
                            : k;
                        const camelCol = toCamelCase(colName);
                        projected[k] = r[k] ?? r[colName] ?? r[camelCol];
                      }
                      return projected;
                    });
                  }
                }

                resolve(rows);
              }).then(onfulfilled, onrejected);
            },
            catch(onrejected?: (err: any) => any) {
              return queryObj.then(undefined, onrejected);
            },
          };

          return queryObj;
        },
      };
    },

    insert(table: any) {
      const tableName = resolveTableName(table);
      const rows = getTableRows(tableName);

      return {
        values(data: any) {
          const toInsert = Array.isArray(data) ? data : [data];

          const insertObj = {
            onConflictDoUpdate(opts: any) {
              for (const item of toInsert) {
                const targetKey = opts?.target?.name || 'id';
                const camelTarget = toCamelCase(targetKey);
                const targetVal = item[targetKey] ?? item[camelTarget];
                const existingIdx = rows.findIndex((r) => {
                  const rVal = r[targetKey] ?? r[camelTarget];
                  return rVal && targetVal && String(rVal) === String(targetVal);
                });

                if (existingIdx !== -1) {
                  const setUpdates = opts?.set || {};
                  rows[existingIdx] = { ...rows[existingIdx], ...setUpdates, ...item };
                } else {
                  rows.push({ ...item });
                }
              }
              return insertObj;
            },
            onConflictDoNothing() {
              for (const item of toInsert) {
                const id = item.id;
                if (!id || !rows.some((r) => r.id === id)) {
                  rows.push({ ...item });
                }
              }
              return insertObj;
            },
            returning() {
              return Promise.resolve(toInsert);
            },
            then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
              for (const item of toInsert) {
                // If row already has matching id, update or push
                const existingIdx = item.id ? rows.findIndex((r) => r.id === item.id) : -1;
                if (existingIdx !== -1) {
                  rows[existingIdx] = { ...rows[existingIdx], ...item };
                } else {
                  rows.push({ ...item });
                }
              }
              return Promise.resolve(toInsert).then(onfulfilled, onrejected);
            },
            catch(onrejected?: (err: any) => any) {
              return insertObj.then(undefined, onrejected);
            },
          };

          return insertObj;
        },
      };
    },

    update(table: any) {
      const tableName = resolveTableName(table);
      const rows = getTableRows(tableName);

      return {
        set(updates: any) {
          return {
            where(condition: any) {
              const conditions = extractConditions(condition);
              const updatedRows: any[] = [];

              for (let i = 0; i < rows.length; i++) {
                if (matchesRow(rows[i], conditions)) {
                  const current = rows[i];
                  const appliedUpdates: any = {};

                  for (const [k, v] of Object.entries(updates)) {
                    if (v && typeof v === 'object' && (v as any).queryChunks) {
                      // Expression like sql`${timesUsed} + 1`
                      appliedUpdates[k] = (Number(current[k]) || 0) + 1;
                    } else {
                      appliedUpdates[k] = v;
                    }
                  }

                  rows[i] = { ...current, ...appliedUpdates };
                  updatedRows.push(rows[i]);
                }
              }

              const resultObj = {
                returning() {
                  return Promise.resolve(updatedRows);
                },
                then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
                  return Promise.resolve(updatedRows).then(onfulfilled, onrejected);
                },
                catch(onrejected?: (err: any) => any) {
                  return resultObj.then(undefined, onrejected);
                },
              };

              return resultObj;
            },
          };
        },
      };
    },

    delete(table: any) {
      const tableName = resolveTableName(table);
      const rows = getTableRows(tableName);

      return {
        where(condition: any) {
          const conditions = extractConditions(condition);
          const remaining: any[] = [];
          const deleted: any[] = [];

          for (const row of rows) {
            if (matchesRow(row, conditions)) {
              deleted.push(row);
            } else {
              remaining.push(row);
            }
          }

          memoryStore[tableName] = remaining;

          const resultObj = {
            returning() {
              return Promise.resolve(deleted);
            },
            then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
              return Promise.resolve(deleted).then(onfulfilled, onrejected);
            },
            catch(onrejected?: (err: any) => any) {
              return resultObj.then(undefined, onrejected);
            },
          };

          return resultObj;
        },
      };
    },

    execute(sqlQuery: any) {
      // Used by generateInvoiceNumber
      const invoices = memoryStore['invoices'] || [];
      return Promise.resolve([{ count: invoices.length }]);
    },

    query: new Proxy(
      {},
      {
        get(_, tableProp: string) {
          // Table name might be camelCase (masterSweets) or snake_case
          const tableName = tableProp.replace(/([A-Z])/g, '_$1').toLowerCase();
          const rows = getTableRows(tableName) || getTableRows(tableProp);

          return {
            findMany(opts?: any) {
              let result = [...rows];
              if (opts?.where) {
                if (typeof opts.where === 'function') {
                  const mockTable = new Proxy(
                    {},
                    { get: (_, prop) => ({ name: String(prop) }) }
                  );
                  const mockOps = {
                    eq: (col: any, val: any) => [
                      { col: col?.name || String(col), val },
                    ],
                    and: (...args: any[]) => args.flat(),
                  };
                  try {
                    const conds = opts.where(mockTable, mockOps);
                    if (Array.isArray(conds)) {
                      result = result.filter((r) => matchesRow(r, conds));
                    }
                  } catch {
                    // Fallback to all
                  }
                } else {
                  const conds = extractConditions(opts.where);
                  result = result.filter((r) => matchesRow(r, conds));
                }
              }
              if (opts?.limit) {
                result = result.slice(0, opts.limit);
              }
              return Promise.resolve(result);
            },

            findFirst(opts?: any) {
              let result = [...rows];
              if (opts?.where) {
                if (typeof opts.where === 'function') {
                  const mockTable = new Proxy(
                    {},
                    { get: (_, prop) => ({ name: String(prop) }) }
                  );
                  const mockOps = {
                    eq: (col: any, val: any) => [
                      { col: col?.name || String(col), val },
                    ],
                    and: (...args: any[]) => args.flat(),
                  };
                  try {
                    const conds = opts.where(mockTable, mockOps);
                    if (Array.isArray(conds)) {
                      result = result.filter((r) => matchesRow(r, conds));
                    }
                  } catch {
                    // Fallback
                  }
                } else {
                  const conds = extractConditions(opts.where);
                  result = result.filter((r) => matchesRow(r, conds));
                }
              }
              return Promise.resolve(result[0] || null);
            },
          };
        },
      }
    ),
  };

  return mockDb;
}
