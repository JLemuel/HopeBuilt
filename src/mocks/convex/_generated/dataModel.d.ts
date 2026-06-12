export type Id<TableName extends string = string> = string & {
  readonly __tableName?: TableName;
};

export type Doc<TableName extends string = string> = Record<string, any> & {
  _id: Id<TableName>;
  _creationTime: number;
};

export type DataModel = Record<string, any>;
