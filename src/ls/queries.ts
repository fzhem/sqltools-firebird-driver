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
SELECT   TRIM(RF.RDB$FIELD_NAME)        AS "label"
       , TRIM('${ContextValue.COLUMN}') AS "type"
       , TRIM('${p => p.label}')        AS "table"
FROM     RDB$RELATION_FIELDS RF
JOIN     RDB$FIELDS F ON RF.RDB$FIELD_SOURCE = F.RDB$FIELD_NAME
WHERE    RF.RDB$RELATION_NAME = '${p => p.label}'
ORDER BY RF.RDB$FIELD_POSITION;
`

