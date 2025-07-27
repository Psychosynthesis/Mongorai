import { useNotifications } from '../NotificationsContext';

import { ServerJSON } from '../../../../lib/Server';
import { DatabaseJSON } from '../../../../lib/Database';
import { CollectionJSON } from '../../../../lib/Collection';

export type { ServerJSON, DatabaseJSON, CollectionJSON };

const API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:3100/api' : '/api';

type ApiResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
};


export class MongoDbService {
  private static async handleRequest<T>(
    method: string,
    path: string,
    params?: Record<string, string>,
    body?: any,
    notifyError?: (message: string) => void
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || `HTTP error ${response.status}`;
        notifyError?.(errorMessage);
        return { ok: false, error: errorMessage };
      }

      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notifyError?.(errorMessage);
      return { ok: false, error: errorMessage };
    }
  }

  // Уведомления интегрируются через хук
  static useMongoDb() {
    const { notify } = useNotifications(); // Предполагается существующий хук уведомлений

    return {
      isReadOnly: async (): Promise<boolean> => {
        const response = await this.handleRequest<{ readOnly: boolean }>(
          'GET',
          '/readonly',
          undefined,
          undefined,
          notify
        );
        return response.data?.readOnly ?? false;
      },

      getServers: async (): Promise<ServerJSON[]> => {
        const response = await this.handleRequest<ServerJSON[]>(
          'GET',
          '/servers',
          undefined,
          undefined,
          notify
        );
        return response.data || [];
      },

      addServer: async (url: string): Promise<void> => {
        await this.handleRequest(
          'PUT',
          '/servers',
          undefined,
          { url },
          notify
        );
      },

      removeServer: async (server: string): Promise<void> => {
        await this.handleRequest(
          'DELETE',
          `/servers/${encodeURIComponent(server)}`,
          undefined,
          undefined,
          notify
        );
      },

      getDatabases: async (server: string): Promise<DatabaseJSON[]> => {
        const response = await this.handleRequest<DatabaseJSON[]>(
          'GET',
          `/servers/${encodeURIComponent(server)}/databases`,
          undefined,
          undefined,
          notify
        );
        return response.data || [];
      },

      getCollections: async (
        server: string,
        database: string
      ): Promise<CollectionJSON[]> => {
        const response = await this.handleRequest<CollectionJSON[]>(
          'GET',
          `/servers/${encodeURIComponent(server)}/databases/${
            encodeURIComponent(database)}/collections`,
          undefined,
          undefined,
          notify
        );
        return response.data || [];
      },

      getDocument: async (
        server: string,
        database: string,
        collection: string,
        document: string
      ): Promise<any> => {
        const response = await this.handleRequest(
          'GET',
          `/servers/${encodeURIComponent(server)}/databases/${
            encodeURIComponent(database)}/collections/${
            encodeURIComponent(collection)}/documents/${
            encodeURIComponent(document)}`,
          undefined,
          undefined,
          notify
        );
        return response.data;
      },

      query: async (
        server: string,
        database: string,
        collection: string,
        query: any,
        project: any,
        sort: any,
        skip: number = 0,
        limit: number = 20
      ): Promise<any[]> => {
        const params = {
          q: JSON.stringify(query),
          sort: JSON.stringify(sort),
          skip: String(skip),
          limit: String(limit),
          project: JSON.stringify(project)
        };

        const response = await this.handleRequest<{ results: any[] }>(
          'GET',
          `/servers/${encodeURIComponent(server)}/databases/${
            encodeURIComponent(database)}/collections/${
            encodeURIComponent(collection)}/query`,
          params,
          undefined,
          notify
        );
        if (response.ok) {
          return response.data?.results || [];
        } else {
          return []
        }
      },

      update: async (
        server: string,
        database: string,
        collection: string,
        document: string,
        update: any,
        partial: boolean
      ): Promise<void> => {
        await this.handleRequest(
          'POST',
          `/servers/${encodeURIComponent(server)}/databases/${
            encodeURIComponent(database)}/collections/${
            encodeURIComponent(collection)}/documents/${
            encodeURIComponent(document)}`,
          { partial: String(partial) },
          update,
          notify
        );
      },

      remove: async (
        server: string,
        database: string,
        collection: string,
        document: string
      ): Promise<void> => {
        await this.handleRequest(
          'DELETE',
          `/servers/${encodeURIComponent(server)}/databases/${
            encodeURIComponent(database)}/collections/${
            encodeURIComponent(collection)}/documents/${
            encodeURIComponent(document)}`,
          undefined,
          undefined,
          notify
        );
      },

      count: async (
        server: string,
        database: string,
        collection: string,
        query: any
      ): Promise<number> => {
        const response = await this.handleRequest<{ count: number }>(
          'GET',
          `/servers/${encodeURIComponent(server)}/databases/${
            encodeURIComponent(database)}/collections/${
            encodeURIComponent(collection)}/count`,
          { q: JSON.stringify(query) },
          undefined,
          notify
        );
        return response.data?.count ?? 0;
      }
    };
  }
}
