import { Request, Response } from "express";

export interface RouterRequest<
  TParams extends Request["params"] = {},
  TBody = {},
  TQuery extends Request["query"] = {}
> extends Request {
  params: TParams;
  body: TBody;
  query: TQuery;
}

export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

export type ValidationDef = (
  field: string,
  value: any
) => ValidationError | undefined;

export type RouteDef<
  TParams extends Record<string, string> = {},
  TBody extends Record<string, string> = {}
> = {
  path: string;
  method: "get" | "post" | "put" | "delete";
  validations?: {
    params?: Record<keyof TParams, ValidationDef>;
    body?: Record<keyof TBody, ValidationDef>;
  };
  handler: (req: RouterRequest<TParams, TBody>, res: Response) => void;
};

export type RouterDef<T extends Record<string, Array<RouteDef<any, any>>>> = {
  [K in keyof T]: T[K];
};
