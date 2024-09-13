import Firebird from "node-firebird";
import * as Queries from "./queries";
import AbstractDriver from "@sqltools/base-driver";
import {
  IConnectionDriver,
  NSDatabase,
  ContextValue,
  Arg0,
  IQueryOptions,
  IConnection,
  MConnectionExplorer,
} from "@sqltools/types";
import { v4 as generateId } from "uuid";

export default class FirebirdSQL
  extends AbstractDriver<any, any>
  implements IConnectionDriver
{
  queries: any = Queries;

  public getId() {
    return this.credentials.id;
  }

  public async open() {
    if (this.connection) {
      return this.connection;
    }
    
    this.connection = this.openConnection(this.credentials);
    return this.connection;
  }

  private async openConnection(credentials: IConnection<unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const options = {
        host: credentials.host,
        port: credentials.port,
        database: credentials.database,
        user: credentials.username,
        password: credentials.password,
        lowercase_keys: credentials.firebirdOptions.lowercase_keys,
        role: credentials.firebirdOptions.role,
        pageSize: credentials.firebirdOptions.pageSize,
        retryConnectionInterval: credentials.firebirdOptions.retryConnectionInterval,
        blobAsText: credentials.firebirdOptions.blobAsText,
        encoding: credentials.firebirdOptions.encoding
      };
  
      Firebird.attach(options, (err, db) => {
        if (err) {
          return reject(err);
        }
  
        // Return the db connection to be used elsewhere
        resolve(db);
      });
    });
  }

  public async close() {
    if (!this.connection) {
      return;
    }

    const conn = await this.connection;
    conn.detach();
    (this.connection as any) = null;
  }

  public async testConnection() {
    await this.open();
    await this.query("SELECT 1 FROM RDB$DATABASE", {});
  }

  public async query(
    query: string,
    opt: IQueryOptions = {}
  ): Promise<NSDatabase.IResult[]> {
    const connection = await this.connection;

    try {
      const queryResults = await this.executeQuery(connection, query);

      const cols = queryResults.length > 0 ? Object.keys(queryResults[0]) : [];

      return [
        <NSDatabase.IResult>{
          requestId: opt.requestId,
          resultId: generateId(),
          connId: this.getId(),
          cols,
          messages: [
            {
              date: new Date(),
              message: `Query ok with ${queryResults.length} results`,
            },
          ],
          query,
          results: queryResults,
        },
      ];
    } catch (error) {
      console.error(error);

      let rawMessage = (error as any).message || error + "";

      return [
        <NSDatabase.IResult>{
          requestId: opt.requestId,
          connId: this.getId(),
          resultId: generateId(),
          cols: [],
          messages: [rawMessage],
          error: true,
          rawError: rawMessage,
          query,
          results: [],
        },
      ];
    }
  }

  private async executeQuery(
    conn,
    query: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      conn.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  public async getChildrenForItem({
    item,
    parent,
  }: Arg0<IConnectionDriver["getChildrenForItem"]>) {
    switch (item.type) {
      case ContextValue.CONNECTION:
      case ContextValue.CONNECTED_CONNECTION:
        return this.queryResults(this.queries.fetchSchemas());
      case ContextValue.SCHEMA:
        return <MConnectionExplorer.IChildItem[]>[
          {
            label: "Tables",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.TABLE,
          },
          {
            label: "Views",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.VIEW,
          },
        ];
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        return this.getColumns(item as NSDatabase.ITable);
      case ContextValue.RESOURCE_GROUP:
        return this.getChildrenForGroup({ item, parent });
    }
    return [];
  }

  async showRecords(
    table: NSDatabase.ITable,
    opt: IQueryOptions & {
      limit: number;
      page?: number;
    }
  ): Promise<NSDatabase.IResult<any>[]> {
    return await this.query(`SELECT * FROM ${table.label} ROWS ${opt.limit}`)
  }

  private async getChildrenForGroup({
    parent,
    item,
  }: Arg0<IConnectionDriver["getChildrenForItem"]>) {
    switch (item.childType) {
      case ContextValue.TABLE:
        return this.queryResults(this.queries.fetchTables(parent as NSDatabase.ISchema))
      case ContextValue.VIEW:
        return [];
    }
  }

  private async getColumns(
    parent: NSDatabase.ITable
  ): Promise<NSDatabase.IColumn[]> {
    const results = await this.queryResults(this.queries.fetchColumns(parent));
    return results.map((col) => ({
      ...col,
      iconName: col.isPk ? "pk" : col.isFk ? "fk" : null,
      childType: ContextValue.NO_CHILD,
      table: parent,
    }));
  }
}