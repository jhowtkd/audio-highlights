import React, { useState, useEffect } from 'react';
import { IDBService } from './idb-service';

export default function IDBPOC() {
  const [file, setFile] = useState<File | null>(null);
  const [savedFile, setSavedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Idle');
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    refreshKeys();
  }, []);

  const refreshKeys = async () => {
    try {
      const dbKeys = await IDBService.getAllKeys();
      setKeys(dbKeys);
    } catch (error) {
      console.error('Error fetching keys:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setStatus('Saving...');
    try {
      await IDBService.saveFile('test-file', file);
      setStatus('Saved!');
      await refreshKeys();
    } catch (error) {
      setStatus(`Error saving: ${error}`);
    }
  };

  const handleLoad = async () => {
    setStatus('Loading...');
    try {
      const loadedFile = await IDBService.getFile('test-file');
      if (loadedFile) {
        setSavedFile(loadedFile);
        const url = URL.createObjectURL(loadedFile);
        setFileUrl(url);
        setStatus(`Loaded: ${loadedFile.name} (${loadedFile.size} bytes)`);
      } else {
        setStatus('No file found.');
      }
    } catch (error) {
      setStatus(`Error loading: ${error}`);
    }
  };

  const handleDelete = async () => {
    setStatus('Deleting...');
    try {
        await IDBService.deleteFile('test-file');
        setStatus('Deleted.');
        setSavedFile(null);
        setFileUrl(null);
        await refreshKeys();
    } catch (error) {
        setStatus(`Error deleting: ${error}`);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">IndexedDB POC (Native)</h2>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Select File:</label>
        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100
        "/>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSave}
          disabled={!file}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
        >
          Save to DB
        </button>
        <button
          onClick={handleLoad}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Load from DB
        </button>
        <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
            Delete
        </button>
      </div>

      <div className="mb-4">
        <p className="font-mono text-sm">Status: {status}</p>
        <p className="font-mono text-xs text-gray-500 mt-1">Keys in DB: {keys.join(', ')}</p>
      </div>

      {savedFile && fileUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">Loaded File:</h3>
          <p>Name: {savedFile.name}</p>
          <p>Type: {savedFile.type}</p>
          <p>Size: {(savedFile.size / 1024 / 1024).toFixed(2)} MB</p>

          {savedFile.type.startsWith('audio/') && (
            <audio controls src={fileUrl} className="w-full mt-2" />
          )}
        </div>
      )}
    </div>
  );
}
