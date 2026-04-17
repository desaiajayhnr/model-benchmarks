import { useCallback, useEffect, useState } from "react";
import { listModelCache, createModelCache, deleteModelCache, registerCustomModel } from "../api";
import type { ModelCache as ModelCacheEntry } from "../types";
import ModelCombobox from "../components/ModelCombobox";

function formatBytes(bytes?: number): string {
  if (!bytes) return "\u2014";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatTime(iso?: string): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString();
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  caching: "bg-blue-100 text-blue-800",
  cached: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  deleting: "bg-gray-100 text-gray-800",
};

export default function ModelCache() {
  const [items, setItems] = useState<ModelCacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCacheForm, setShowCacheForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [cacheHfId, setCacheHfId] = useState("");
  const [cacheRevision, setCacheRevision] = useState("main");
  const [cacheToken, setCacheToken] = useState("");

  const [registerS3URI, setRegisterS3URI] = useState("");
  const [registerName, setRegisterName] = useState("");

  const fetchItems = useCallback(() => {
    listModelCache()
      .then((data) => {
        setItems(data || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const hasCaching = items.some((i) => i.status === "caching" || i.status === "pending");
    if (!hasCaching) return;

    const interval = setInterval(fetchItems, 10000);
    return () => clearInterval(interval);
  }, [items, fetchItems]);

  async function handleCache(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await createModelCache({
        model_hf_id: cacheHfId,
        hf_revision: cacheRevision || undefined,
        hf_token: cacheToken || undefined,
      });
      setCacheHfId("");
      setCacheRevision("main");
      setCacheToken("");
      setShowCacheForm(false);
      fetchItems();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to start caching");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await registerCustomModel({
        s3_uri: registerS3URI,
        display_name: registerName,
      });
      setRegisterS3URI("");
      setRegisterName("");
      setShowRegisterForm(false);
      fetchItems();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to register model");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete cached model "${name}"? This will remove the S3 data.`)) return;
    try {
      await deleteModelCache(id);
      fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Model Cache</h1>
        <div className="space-x-2">
          <button
            onClick={() => { setShowCacheForm(!showCacheForm); setShowRegisterForm(false); setFormError(""); }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Cache Model
          </button>
          <button
            onClick={() => { setShowRegisterForm(!showRegisterForm); setShowCacheForm(false); setFormError(""); }}
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Register Custom Model
          </button>
        </div>
      </div>

      {showCacheForm && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Cache HuggingFace Model to S3</h3>
          <form onSubmit={handleCache} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <ModelCombobox
              value={cacheHfId}
              onChange={setCacheHfId}
              hfToken={cacheToken}
            />
            <input
              type="text"
              value={cacheRevision}
              onChange={(e) => setCacheRevision(e.target.value)}
              placeholder="Revision (default: main)"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            />
            <input
              type="password"
              value={cacheToken}
              onChange={(e) => setCacheToken(e.target.value)}
              placeholder="HF Token (optional)"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            />
            <button
              type="submit"
              disabled={submitting || !cacheHfId}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Starting..." : "Start Caching"}
            </button>
          </form>
          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        </div>
      )}

      {showRegisterForm && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Register Custom S3 Model</h3>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={registerS3URI}
              onChange={(e) => setRegisterS3URI(e.target.value)}
              placeholder="s3://bucket/models/my-model"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
              required
            />
            <input
              type="text"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              placeholder="Display name"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={submitting || !registerS3URI || !registerName}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>
          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HF ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S3 URI</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cached</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No cached models. Click "Cache Model" to get started.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[item.status] ?? "bg-gray-100"}`}>
                      {(item.status === "caching" || item.status === "pending") && (
                        <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {item.status}
                    </span>
                    {item.status === "failed" && item.error_message && (
                      <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={item.error_message}>
                        {item.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.display_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                    {item.hf_id || <span className="text-gray-400 italic">Custom</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono max-w-xs truncate" title={item.s3_uri}>
                    {item.s3_uri}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatBytes(item.size_bytes)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatTime(item.cached_at)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(item.id, item.display_name)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
