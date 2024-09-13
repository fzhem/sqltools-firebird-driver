import queryFactory from '@sqltools/base-driver/dist/lib/factory';
import { IBaseQueries, ContextValue } from '@sqltools/types';

export const fetchSchemas: IBaseQueries['fetchSchemas'] = queryFactory`
SELECT DISTINCT TRIM(RDB$OWNER_NAME)           AS "label"
              , TRIM(RDB$OWNER_NAME)           AS "schema"
              , TRIM('${ContextValue.SCHEMA}') AS "type"
              , TRIM('schema')                 AS "detail"
              , TRIM('group-by-ref-type')      AS "iconId"
FROM            RDB$RELATIONS 
WHERE           RDB$SYSTEM_FLAG = 0
`;

export const fetchTables: IBaseQueries['fetchTables'] = queryFactory`
SELECT TRIM(RDB$RELATION_NAME)       AS "label"
     , TRIM('${ContextValue.TABLE}') AS "type"
FROM   RDB$RELATIONS 
WHERE  RDB$SYSTEM_FLAG = 0
AND    RDB$OWNER_NAME = '${p => p.schema}'
`;

export const fetchColumns: IBaseQueries['fetchColumns'] = queryFactory`
SELECT TRIM(rf.RDB$FIELD_NAME)        AS "label"
     , TRIM('${ContextValue.COLUMN}') AS "type"
     , TRIM('${p => p.label}')        AS "table" 
     , TRIM(CASE f.RDB$FIELD_TYPE
              WHEN 7 THEN 'SMALLINT'
              WHEN 8 THEN 'INTEGER'
              WHEN 9 THEN 'QUAD'
              WHEN 10 THEN 'FLOAT'
              WHEN 12 THEN 'DATE'
              WHEN 13 THEN 'TIME'
              WHEN 14 THEN 'CHAR'
              WHEN 16 THEN 'BIGINT'
              WHEN 27 THEN 'DOUBLE PRECISION'
              WHEN 35 THEN 'TIMESTAMP'
              WHEN 37 THEN 'VARCHAR'
              WHEN 40 THEN 'CSTRING'
              WHEN 261 THEN 'BLOB'
              ELSE 'UNKNOWN'
            END)                      AS "dataType"
     , TRIM(CASE
              WHEN f.RDB$FIELD_LENGTH > 0 THEN
                  CASE f.RDB$FIELD_TYPE
                      WHEN 7 THEN 'SMALLINT'
                      WHEN 8 THEN 'INTEGER'
                      WHEN 9 THEN 'QUAD'
                      WHEN 10 THEN 'FLOAT'
                      WHEN 12 THEN 'DATE'
                      WHEN 13 THEN 'TIME'
                      WHEN 14 THEN 'CHAR'
                      WHEN 16 THEN 'BIGINT'
                      WHEN 27 THEN 'DOUBLE PRECISION'
                      WHEN 35 THEN 'TIMESTAMP'
                      WHEN 37 THEN 'VARCHAR'
                      WHEN 40 THEN 'CSTRING'
                      WHEN 261 THEN 'BLOB'
                      ELSE 'UNKNOWN'
                  END || '(' || f.RDB$FIELD_LENGTH || ')'
              ELSE
                  CASE f.RDB$FIELD_TYPE
                      WHEN 7 THEN 'SMALLINT'
                      WHEN 8 THEN 'INTEGER'
                      WHEN 9 THEN 'QUAD'
                      WHEN 10 THEN 'FLOAT'
                      WHEN 12 THEN 'DATE'
                      WHEN 13 THEN 'TIME'
                      WHEN 14 THEN 'CHAR'
                      WHEN 16 THEN 'BIGINT'
                      WHEN 27 THEN 'DOUBLE PRECISION'
                      WHEN 35 THEN 'TIMESTAMP'
                      WHEN 37 THEN 'VARCHAR'
                      WHEN 40 THEN 'CSTRING'
                      WHEN 261 THEN 'BLOB'
                      ELSE 'UNKNOWN'
                  END
            END) AS "detail"
    , CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM RDB$RELATION_CONSTRAINTS rc
            JOIN RDB$INDEX_SEGMENTS sg ON rc.RDB$INDEX_NAME = sg.RDB$INDEX_NAME
            WHERE rc.RDB$RELATION_NAME = rf.RDB$RELATION_NAME
            AND rc.RDB$CONSTRAINT_TYPE = 'PRIMARY KEY'
            AND sg.RDB$FIELD_NAME = rf.RDB$FIELD_NAME
        ) THEN 1
        ELSE 0
      END AS "isPk"
    , CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM RDB$RELATION_CONSTRAINTS rc
            JOIN RDB$INDEX_SEGMENTS sg ON rc.RDB$INDEX_NAME = sg.RDB$INDEX_NAME
            WHERE rc.RDB$RELATION_NAME = rf.RDB$RELATION_NAME
            AND rc.RDB$CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND sg.RDB$FIELD_NAME = rf.RDB$FIELD_NAME
        ) THEN 1
        ELSE 0
      END AS "isFk"
FROM   RDB$RELATION_FIELDS rf
JOIN   RDB$FIELDS          f ON rf.RDB$FIELD_SOURCE = f.RDB$FIELD_NAME
WHERE  rf.RDB$RELATION_NAME = '${p => p.label}'
`
