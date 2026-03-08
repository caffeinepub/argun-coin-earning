import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

/**
 * Creates a StorageClient instance for file uploads.
 * Returns a factory function that creates the client on demand.
 */
export function useStorageClient() {
  const { identity } = useInternetIdentity();

  const createStorageClient = useCallback(
    async (bucket: string): Promise<StorageClient | null> => {
      if (!identity) return null;

      const config = await loadConfig();

      const agent = new HttpAgent({
        host: config.backend_host,
        identity,
      });

      // In local dev, fetch the root key
      if (config.backend_host !== "https://ic0.app") {
        try {
          await agent.fetchRootKey();
        } catch {
          // ignore in production
        }
      }

      return new StorageClient(
        bucket,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    },
    [identity],
  );

  return { createStorageClient };
}
