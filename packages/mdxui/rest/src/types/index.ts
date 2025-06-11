export interface RestApiResponse<T = any> {
  api: ApiHeaderObject;
  data: T;
  links: HateoasLinks;
  meta?: Record<string, any>;
  user: UserFooterObject;
}

export interface ApiHeaderObject {
  name: string;
  version: string;
  links: {
    home: string;
    root: string;
    docs: string;
    repo: string;
    [key: string]: string;
  };
  meta?: Record<string, any>;
}

export interface UserFooterObject {
  auth: {
    authenticated: boolean;
    user?: string;
    roles?: string[];
  };
  usage: {
    requests: number;
    remaining?: number;
  };
  subscription?: {
    plan: string;
    expires?: string;
  };
  client: {
    ip?: string;
    userAgent?: string;
    location?: string;
  };
}

export interface HateoasLinks {
  self: string;
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
  [key: string]: string | undefined;
}

export interface ResourceObject {
  id: string;
  type: string;
  attributes: Record<string, any>;
  relationships?: Record<string, RelationshipObject>;
  links: HateoasLinks;
  meta?: Record<string, any>;
}

export interface RelationshipObject {
  data: { id: string; type: string } | Array<{ id: string; type: string }>;
  links?: HateoasLinks;
}
