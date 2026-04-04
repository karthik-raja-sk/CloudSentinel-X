import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../context/ProjectContext';
import { uploadFile, getScanStatus } from '../api/client';
import { UploadCloud, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Upload() {
  const { selectedProjectId: projectId } = useProjectContext();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanState, setScanState] = useState<{ scanId?: number; status?: string; error?: string }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !projectId) return;
    setIsUploading(true);
    setScanState({});
    
    try {
      const res = await uploadFile(Number(projectId), file);
      setScanState({ scanId: res.scan_id, status: res.status });
    } catch (err: any) {
      setScanState({ error: err.message || 'Upload failed' });
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (scanState.scanId && scanState.status && !['COMPLETED', 'FAILED'].includes(scanState.status)) {
      interval = setInterval(async () => {
        try {
          const res = await getScanStatus(scanState.scanId!);
          setScanState(prev => ({ ...prev, status: res.status, error: res.error_message }));
          
          if (['COMPLETED', 'FAILED'].includes(res.status)) {
            setIsUploading(false);
            clearInterval(interval);
            if (res.status === 'COMPLETED') {
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [scanState.scanId, scanState.status, projectId, navigate]);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Configuration</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        {!isUploading && scanState.status !== 'COMPLETED' && scanState.status !== 'FAILED' && (
          <>
            <UploadCloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select AWS Config / CloudTrail JSON</h3>
            <p className="text-gray-500 text-sm mb-6">File will be analyzed according to V1 rules.</p>
            
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-6 border border-gray-200 rounded-md p-2"
            />
            
            <button 
              onClick={handleUpload}
              disabled={!file}
              className={`w-full py-2 px-4 rounded shadow-sm font-medium text-white transition ${file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Start Security Scan
            </button>
          </>
        )}

        {isUploading && (
          <div className="py-8">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scanning in Progress</h3>
            <p className="text-gray-500 text-sm">Scan ID: {scanState.scanId}</p>
            <p className="text-blue-600 font-bold mt-4 animate-pulse">Status: {scanState.status}</p>
          </div>
        )}

        {scanState.status === 'COMPLETED' && (
          <div className="py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Scan Completed Successfully</h3>
            <p className="text-gray-500 text-sm">Redirecting to project dashboard...</p>
          </div>
        )}

        {scanState.status === 'FAILED' && (
          <div className="py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Scan Failed</h3>
            <p className="text-red-500 text-sm">{scanState.error || 'Unknown error occurred during analysis.'}</p>
            <button 
              onClick={() => { setScanState({}); setFile(null); }}
              className="mt-6 px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
