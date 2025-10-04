'use client';
import { useState, useEffect } from 'react';
import { Download, FileText, Table } from 'lucide-react';

interface SeoFile {
  name: string;
  type: 'crawl' | 'audit' | 'clusters';
  format: 'json' | 'csv';
}

export default function SeoResultsPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const res = await fetch('/api/seo/results');
      const data = await res.json();
      if (data.ok) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFile(fileName: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/seo/results?file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data.ok) {
        setSelectedFile(fileName);
        setFileContent(data.content);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    } finally {
      setLoading(false);
    }
  }

  function downloadFile(fileName: string) {
    if (!fileContent) return;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseFileInfo(fileName: string): SeoFile {
    const match = fileName.match(/^(crawl|audit|clusters)-\d+\.(json|csv)$/);
    return {
      name: fileName,
      type: (match?.[1] || 'unknown') as any,
      format: (match?.[2] || 'unknown') as any
    };
  }

  function getFileIcon(format: string) {
    return format === 'json' ? <FileText className="w-5 h-5" /> : <Table className="w-5 h-5" />;
  }

  function renderPreview() {
    if (!fileContent || !selectedFile) return null;

    const info = parseFileInfo(selectedFile);

    if (info.format === 'json') {
      try {
        const parsed = JSON.parse(fileContent);
        return (
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch {
        return <p className="text-red-600">Invalid JSON</p>;
      }
    }

    if (info.format === 'csv') {
      const lines = fileContent.split(/\r?\n/).filter((l: string) => l.trim());
      const header = lines[0]?.split(',') || [];
      const rows = lines.slice(1, 21); // Show first 20 rows

      return (
        <div className="overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {header.map((col: string, i: number) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {col.replace(/^"|"$/g, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row: string, i: number) => {
                const cells = row.split(',');
                return (
                  <tr key={i}>
                    {cells.map((cell: string, j: number) => (
                      <td key={j} className="px-4 py-2 text-sm text-gray-900">
                        {cell.replace(/^"|"$/g, '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {lines.length > 21 && (
            <p className="text-sm text-gray-500 mt-2">... and {lines.length - 21} more rows</p>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">SEO Results</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and download outputs from SEO builders (crawl, audit, cluster).
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Files</h2>
              {loading && !selectedFile ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : files.length === 0 ? (
                <p className="text-sm text-gray-500">No SEO results yet. Run a builder to generate outputs.</p>
              ) : (
                <ul className="space-y-2">
                  {files.map((file) => {
                    const info = parseFileInfo(file);
                    return (
                      <li key={file}>
                        <button
                          onClick={() => loadFile(file)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-50 ${
                            selectedFile === file ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {getFileIcon(info.format)}
                          <span className="flex-1 truncate">{file}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* File Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {selectedFile ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">{selectedFile}</h2>
                    <button
                      onClick={() => downloadFile(selectedFile)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>

                  {stats && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        {stats.type && (
                          <>
                            <dt className="font-medium text-gray-500">Type:</dt>
                            <dd className="text-gray-900">{stats.type}</dd>
                          </>
                        )}
                        {stats.count !== undefined && (
                          <>
                            <dt className="font-medium text-gray-500">Items:</dt>
                            <dd className="text-gray-900">{stats.count}</dd>
                          </>
                        )}
                        {stats.rows !== undefined && (
                          <>
                            <dt className="font-medium text-gray-500">Rows:</dt>
                            <dd className="text-gray-900">{stats.rows}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                  )}

                  {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : (
                    renderPreview()
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Select a file to preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
