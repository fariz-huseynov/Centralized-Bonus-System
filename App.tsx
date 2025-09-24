
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import type { Employee, AuditLog, WorkArea, ToastInfo } from './types';
import { generateEmployeeData, replaceBackground } from './services/geminiService';

// Recharts components from global UMD build
declare const Recharts: any;

// SweetAlert2 from global scope
declare const Swal: any;

// face-api.js from global scope
declare const faceapi: any;

// --- MOCK DATA ---
const initialEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    bonusNumber: '123',
    payrollNumber: '12345678',
    workAreas: ['Picking' as WorkArea, 'Packing' as WorkArea],
    photo: 'https://picsum.photos/seed/johndoe/200/200',
    faceEmbedding: [],
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    bonusNumber: '456',
    payrollNumber: '87654321',
    workAreas: ['Intake' as WorkArea],
    photo: 'https://picsum.photos/seed/janesmith/200/200',
    faceEmbedding: [],
  }
];

const initialAuditLogs: AuditLog[] = [
    { id: '101', employeeId: '1', employeeName: 'John Doe', action: 'Item Picked', timestamp: new Date(Date.now() - 3600000 * 2) },
    { id: '102', employeeId: '1', employeeName: 'John Doe', action: 'BDC Scanned', timestamp: new Date(Date.now() - 3600000 * 1.5) },
    { id: '103', employeeId: '2', employeeName: 'Jane Smith', action: 'Item Intaken', timestamp: new Date(Date.now() - 3600000 * 3) },
    { id: '104', employeeId: '1', employeeName: 'John Doe', action: 'Item Packed', timestamp: new Date() },
];

const WORK_AREAS: WorkArea[] = ['Intake' as WorkArea, 'Refurb' as WorkArea, 'Picking' as WorkArea, 'Packing' as WorkArea, 'Shipping' as WorkArea];
const AUDIT_ACTIONS = ['Item Picked', 'Item Packed', 'BDC Scanned', 'Item Intaken', 'Device Refurbished', 'Package Shipped'];

// --- GLOBAL STATE / CONTEXT ---
interface AppContextType {
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    auditLogs: AuditLog[];
    setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    generateLogsForEmployee: (employee: Employee) => void;
}
const AppContext = createContext<AppContextType | null>(null);

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

// --- ICONS ---
const Icons = {
    view: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>,
    edit: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>,
    delete: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    add: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>,
    search: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>,
    camera: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    back: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    ai: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>,
    help: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// --- HELPER HOOKS ---
function useFaceApi() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/weights';
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setIsReady(true);
            } catch (error) {
                console.error("Error loading face-api models:", error);
            }
        };
        loadModels();
    }, []);

    const getEmbedding = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
        if (!isReady) return null;
        const detections = await faceapi.detectSingleFace(imageElement).withFaceLandmarks().withFaceDescriptor();
        // FIX: Cast descriptor to number array to ensure correct type from Array.from.
        return detections ? Array.from(detections.descriptor as number[]) : null;
    };

    const findBestMatch = (embedding: number[], employees: Employee[]) => {
        if (!embedding || employees.length === 0) return null;
        let bestMatch: { employee: Employee; distance: number } | null = null;

        employees.forEach(employee => {
            if (employee.faceEmbedding && employee.faceEmbedding.length > 0) {
                const distance = faceapi.euclideanDistance(embedding, employee.faceEmbedding);
                if (distance < 0.5 && (!bestMatch || distance < bestMatch.distance)) { // Threshold of 0.5
                    bestMatch = { employee, distance };
                }
            }
        });

        return bestMatch ? bestMatch.employee : null;
    };


    return { isReady, getEmbedding, findBestMatch };
}


// --- UI COMPONENTS ---

const Header: React.FC<{ onLoginClick: () => void, onHelpClick: () => void }> = ({ onLoginClick, onHelpClick }) => (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Centralized Bonus System</h1>
        <div className="flex items-center space-x-2">
            <button onClick={onHelpClick} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors" title="Help/Walkthrough">{Icons.help}</button>
            <button onClick={onLoginClick} className="bg-gray-800 text-white font-medium py-2 px-4 rounded-lg shadow-sm hover:bg-gray-700 transition-colors">
                Face Login
            </button>
        </div>
    </header>
);

const ToastContainer: React.FC<{ toasts: ToastInfo[], removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-3">
            {toasts.map(toast => {
                const colors = {
                    success: 'bg-green-500',
                    error: 'bg-red-500',
                    info: 'bg-gray-800',
                };
                return (
                    <div
                        key={toast.id}
                        className={`max-w-sm w-full ${colors[toast.type]} text-white rounded-xl shadow-lg p-4 flex items-center justify-between animate-fade-in-right`}
                    >
                        <span>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-4 text-xl font-bold opacity-70 hover:opacity-100">&times;</button>
                    </div>
                );
            })}
        </div>
    );
};

const WebcamCapture: React.FC<{
    onCapture: (dataUrl: string) => void;
    onClear: () => void;
    image: string | null;
    processing: boolean;
    onBackgroundReplace: () => void;
}> = ({ onCapture, onClear, image, processing, onBackgroundReplace }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
            Swal.fire('Webcam Error', 'Could not access the webcam. Please check permissions.', 'error');
        }
    };
    
    useEffect(() => {
        if (!image) {
           startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image]);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
        }
    };

    const handleCapture = () => {
        const video = videoRef.current;
        if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            onCapture(canvas.toDataURL('image/jpeg'));
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="w-48 h-48 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center relative border-4 border-white shadow-inner">
                {image ? (
                    <img src={image} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                )}
                {processing && (
                     <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white rounded-full">
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="mt-2 text-sm font-medium">AI Processing...</p>
                    </div>
                )}
            </div>
            <div className="flex space-x-2">
                {image ? (
                    <>
                        <button type="button" onClick={onClear} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium">Retake</button>
                        <button type="button" onClick={onBackgroundReplace} disabled={processing || !process.env.API_KEY} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400 text-sm font-medium">AI Background</button>
                    </>
                ) : (
                    <button type="button" onClick={handleCapture} disabled={!isStreaming} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 font-medium">Capture</button>
                )}
            </div>
        </div>
    );
};

const EmployeeFormModal: React.FC<{
    employee: Employee | null;
    onClose: () => void;
    onSave: (employee: Employee, newEmbedding: number[] | null) => void;
}> = ({ employee, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Employee>>({
        firstName: '', lastName: '', bonusNumber: '', payrollNumber: '', workAreas: [], photo: '', ...employee
    });
    const [newEmbedding, setNewEmbedding] = useState<number[] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { getEmbedding, isReady: faceApiReady } = useFaceApi();
    const { addToast } = useAppContext();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (area: WorkArea) => {
        const currentAreas = formData.workAreas || [];
        const newAreas = currentAreas.includes(area)
            ? currentAreas.filter(a => a !== area)
            : [...currentAreas, area];
        setFormData(prev => ({ ...prev, workAreas: newAreas }));
    };

    const handlePhotoCapture = async (dataUrl: string) => {
        setFormData(prev => ({ ...prev, photo: dataUrl }));
        const img = document.createElement('img');
        img.src = dataUrl;
        img.onload = async () => {
            const embedding = await getEmbedding(img);
            setNewEmbedding(embedding);
            if (!embedding) {
              addToast('Could not detect a face in the photo.', 'error');
            }
        };
    };
    
    const handleAutoFill = async () => {
        if (!process.env.API_KEY) {
            addToast('API Key is not configured for AI features.', 'error');
            return;
        }
        setIsProcessing(true);
        try {
            const aiData = await generateEmployeeData();
            setFormData(prev => ({ ...prev, ...aiData }));
            addToast('Form auto-filled with AI.', 'success');
        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBackgroundReplace = async () => {
        if (!formData.photo) return;
         if (!process.env.API_KEY) {
            addToast('API Key is not configured for AI features.', 'error');
            return;
        }
        setIsProcessing(true);
        try {
            const newImage = await replaceBackground(formData.photo);
            setFormData(prev => ({...prev, photo: newImage}));
            addToast('AI background applied!', 'success');
        } catch(error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const saveEmployee = () => {
        const finalEmployee: Employee = {
            id: employee?.id || Date.now().toString(),
            firstName: formData.firstName!,
            lastName: formData.lastName!,
            bonusNumber: formData.bonusNumber!,
            payrollNumber: formData.payrollNumber!,
            workAreas: formData.workAreas || [],
            photo: formData.photo!,
            faceEmbedding: newEmbedding || employee?.faceEmbedding || [],
        };
        onSave(finalEmployee, newEmbedding);
        onClose();
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation
        if (!formData.firstName || !formData.lastName || !formData.photo) {
            return addToast('Please fill all required fields and capture a photo.', 'error');
        }
        if (!/^\d{3}$/.test(formData.bonusNumber || '')) {
            return addToast('Bonus Number must be 3 digits.', 'error');
        }
        if (!/^\d{8}$/.test(formData.payrollNumber || '')) {
            return addToast('Payroll Number must be 8 digits.', 'error');
        }

        if (!newEmbedding && !employee) {
            Swal.fire({
                title: 'No Face Detected',
                text: 'The employee will be saved, but Face Login will be unavailable. Do you want to continue?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, save anyway',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33'
            }).then((result: any) => {
                if (result.isConfirmed) {
                    saveEmployee();
                }
            });
        } else {
            saveEmployee();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-40 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-5xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
                        <p className="text-gray-500">Fill in the details below.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {/* Left side: Form fields */}
                    <div className="space-y-4">
                         <button type="button" onClick={handleAutoFill} disabled={isProcessing || !process.env.API_KEY} className="w-full flex items-center justify-center bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:bg-gray-700 transition disabled:bg-gray-400">
                             {isProcessing ? 'Generating...' : <>{Icons.ai} AI Auto-fill</>}
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                           <input type="text" name="firstName" placeholder="First Name" value={formData.firstName || ''} onChange={handleChange} required className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                           <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName || ''} onChange={handleChange} required className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                        </div>
                        <input type="text" name="bonusNumber" placeholder="Bonus Number (3 digits)" value={formData.bonusNumber || ''} onChange={handleChange} required pattern="\d{3}" className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                        <input type="text" name="payrollNumber" placeholder="Payroll Number (8 digits)" value={formData.payrollNumber || ''} onChange={handleChange} required pattern="\d{8}" className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                        <div>
                            <p className="font-medium mb-2 text-gray-700">Work Areas:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {WORK_AREAS.map(area => (
                                    <label key={area} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                                        <input type="checkbox" checked={(formData.workAreas || []).includes(area)} onChange={() => handleCheckboxChange(area)} className="form-checkbox h-5 w-5 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500" />
                                        <span className="text-gray-800">{area}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right side: Webcam */}
                    <div className="flex flex-col items-center justify-center space-y-3 bg-gray-50 p-6 rounded-xl">
                        <p className="font-medium text-center text-gray-700">Employee Photo {!faceApiReady && '(Loading AI...)'}</p>
                        <WebcamCapture 
                            image={formData.photo || null}
                            onCapture={handlePhotoCapture}
                            onClear={() => {
                                setFormData(p => ({...p, photo: ''}));
                                setNewEmbedding(null);
                            }}
                            processing={isProcessing}
                            onBackgroundReplace={handleBackgroundReplace}
                        />
                        <div className="h-6 text-sm text-green-600 font-medium">
                            {newEmbedding && 'Face detected and ready to save!'}
                        </div>
                    </div>

                    {/* Footer: Buttons */}
                    <div className="md:col-span-2 flex justify-end space-x-3 border-t pt-6 mt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" disabled={isProcessing || !faceApiReady} className="bg-black text-white font-medium py-2.5 px-6 rounded-lg shadow-sm hover:bg-gray-800 transition disabled:bg-gray-400">Save Employee</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EmployeeCard: React.FC<{
    employee: Employee;
    onView: (id: string) => void;
    onEdit: (employee: Employee) => void;
    onDelete: (id: string) => void;
}> = ({ employee, onView, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200/50">
            <div className="p-5">
                <div className="flex items-center space-x-4 mb-4">
                    <img src={employee.photo} alt={`${employee.firstName} ${employee.lastName}`} className="w-20 h-20 rounded-full object-cover" />
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-gray-800">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-sm text-gray-500">Payroll: {employee.payrollNumber}</p>
                        <p className="text-sm text-gray-500">Bonus: {employee.bonusNumber}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {employee.workAreas.map(area => (
                        <span key={area} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">{area}</span>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 border-t border-gray-100 pt-3">
                    <button onClick={() => onView(employee.id)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors" title="View Details">{Icons.view}</button>
                    <button onClick={() => onEdit(employee)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition-colors" title="Edit">{Icons.edit}</button>
                    <button onClick={() => onDelete(employee.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors" title="Delete">{Icons.delete}</button>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{
    employees: Employee[];
    onViewEmployee: (id: string) => void;
    onAddEmployee: () => void;
    onEditEmployee: (employee: Employee) => void;
    onDeleteEmployee: (id: string) => void;
}> = ({ employees, onViewEmployee, onAddEmployee, onEditEmployee, onDeleteEmployee }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.payrollNumber.includes(searchTerm)
    );

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">{Icons.search}</div>
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-12 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button
                    id="add-employee-btn"
                    onClick={onAddEmployee}
                    className="flex items-center bg-blue-600 text-white font-medium py-3 px-5 rounded-lg shadow-sm hover:bg-blue-700 transition w-full md:w-auto justify-center"
                >
                    {Icons.add} <span className="ml-2">Add Employee</span>
                </button>
            </div>

            {filteredEmployees.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.map(emp => (
                        <EmployeeCard 
                            key={emp.id} 
                            employee={emp} 
                            onView={onViewEmployee} 
                            onEdit={onEditEmployee} 
                            onDelete={onDeleteEmployee} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <h3 className="text-xl font-semibold text-gray-700">No Employees Found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your search or add a new employee.</p>
                </div>
            )}
        </div>
    );
};

const AuditLogTimeline: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
    return (
        <div className="space-y-4">
            {[...logs].sort((a,b) => Number(b.timestamp) - Number(a.timestamp)).map(log => (
                <div key={log.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="bg-gray-200 text-gray-600 rounded-full h-10 w-10 flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">
                        {log.employeeName.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">{log.action}</p>
                        <p className="text-sm text-gray-500">{log.employeeName}</p>
                        <p className="text-xs text-gray-400 mt-1">{log.timestamp.toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const SummaryCharts: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
    if (typeof Recharts === 'undefined') return null;
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

    const tasksByAction = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(tasksByAction).map(([action, count]) => ({
        name: action,
        tasks: count,
    }));

    if (chartData.length === 0) {
        return <div className="text-center p-8 text-gray-500">No audit log data available for this employee.</div>;
    }

    return (
        <div>
            <h4 className="text-lg font-semibold mb-4 text-center text-gray-700">Tasks by Action Type</h4>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} interval={0} angle={-30} textAnchor="end" height={80} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip wrapperClassName="!rounded-lg !border-gray-200 !shadow-lg" />
                    <Bar dataKey="tasks" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const LeaderboardPyramid: React.FC<{ logs: AuditLog[], employees: Employee[] }> = ({ logs, employees }) => {
    if (typeof Recharts === 'undefined') return null;
    const { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList } = Recharts;

     const tasksPerEmployee = logs.reduce((acc, log) => {
        acc[log.employeeId] = (acc[log.employeeId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const leaderboardData = Object.entries(tasksPerEmployee)
        .map(([employeeId, count]) => {
            const employee = employees.find(e => e.id === employeeId);
            return { name: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown', value: count, fill: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` };
        })
        .sort((a, b) => b.value - a.value);

    return (
        <div className="flex flex-col items-center">
            <h4 className="text-lg font-semibold mb-4 text-center text-gray-700">Top Performers Pyramid</h4>
            <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                    <Tooltip />
                    <Funnel dataKey="value" data={leaderboardData} isAnimationActive>
                        <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>
        </div>
    );
};


const EmployeeDetails: React.FC<{ employeeId: string; onBack: () => void }> = ({ employeeId, onBack }) => {
    const { employees, auditLogs, generateLogsForEmployee } = useAppContext();
    const [activeTab, setActiveTab] = useState('audit');
    const [rechartsReady, setRechartsReady] = useState(typeof (window as any).Recharts !== 'undefined');
    const employee = employees.find(e => e.id === employeeId);
    
    useEffect(() => {
        if (rechartsReady) return;
        const intervalId = setInterval(() => {
            if (typeof (window as any).Recharts !== 'undefined') {
                setRechartsReady(true);
                clearInterval(intervalId);
            }
        }, 100);
        return () => clearInterval(intervalId);
    }, [rechartsReady]);

    if (!employee) return <div className="p-8">Employee not found. <button onClick={onBack}>Go Back</button></div>;

    const employeeLogs = auditLogs.filter(log => log.employeeId === employee.id);

    const tabs = [
        { id: 'audit', label: 'Audit Log' },
        { id: 'summary', label: 'Summary Charts' },
        { id: 'leaderboard', label: 'Leaderboard & Pyramid' },
    ];

    return (
        <div className="p-6 md:p-8 animate-fade-in">
            <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 font-medium mb-6 hover:text-gray-900 transition-colors">
                {Icons.back}
                <span>Back to Dashboard</span>
            </button>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-6">
                    <img src={employee.photo} alt={employee.firstName} className="w-28 h-28 rounded-full object-cover" />
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">{employee.firstName} {employee.lastName}</h2>
                        <p className="text-gray-500">Payroll: {employee.payrollNumber} / Bonus: {employee.bonusNumber}</p>
                    </div>
                </div>
                <button 
                    onClick={() => generateLogsForEmployee(employee)}
                    className="bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm whitespace-nowrap"
                >
                    Generate Logs
                </button>
            </div>

            <div className="bg-gray-100 p-1 rounded-lg mb-6 inline-flex space-x-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                            activeTab === tab.id
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 min-h-[300px]">
                {activeTab === 'audit' && <AuditLogTimeline logs={employeeLogs} />}
                {activeTab === 'summary' && (rechartsReady ? <SummaryCharts logs={employeeLogs} /> : <div className="text-center p-8">Loading Charts...</div>)}
                {activeTab === 'leaderboard' && (rechartsReady ? <LeaderboardPyramid logs={auditLogs} employees={employees} /> : <div className="text-center p-8">Loading Charts...</div>)}
            </div>
        </div>
    );
};

const FaceLoginView: React.FC<{ onBack: () => void; onLoginSuccess: (employee: Employee) => void }> = ({ onBack, onLoginSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { employees, addToast } = useAppContext();
    const { isReady, getEmbedding, findBestMatch } = useFaceApi();
    const [status, setStatus] = useState('Initializing...');
    const intervalRef = useRef<number | null>(null);

    const startVerification = useCallback(() => {
        if (!isReady || !videoRef.current) return;
        setStatus('Point camera at your face...');
        intervalRef.current = window.setInterval(async () => {
            const video = videoRef.current;
            if (video && video.readyState >= 3) {
                const embedding = await getEmbedding(video);
                if (embedding) {
                    setStatus('Face detected, verifying...');
                    const matchedEmployee = findBestMatch(embedding, employees);
                    if (matchedEmployee) {
                        setStatus(`Success! Welcome, ${matchedEmployee.firstName}.`);
                        addToast(`Login successful for ${matchedEmployee.firstName}`, 'success');
                        onLoginSuccess(matchedEmployee);
                        if (intervalRef.current) clearInterval(intervalRef.current);
                    } else {
                        setStatus('Face not recognized. Please try again.');
                    }
                }
            }
        }, 2000);
    }, [isReady, getEmbedding, findBestMatch, employees, onLoginSuccess, addToast]);
    
    useEffect(() => {
        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        startVerification();
                    };
                }
            } catch (err) {
                console.error("Error accessing webcam for login:", err);
                setStatus('Webcam access denied.');
                Swal.fire('Webcam Error', 'Could not access the webcam. Please check permissions.', 'error');
            }
        }
        
        if (isReady) {
            setupCamera();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-600 font-medium flex items-center space-x-2 z-10">
                {Icons.back} <span>Dashboard</span>
            </button>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Face Verification</h2>
                <p className="text-gray-500 mb-6">Position your face in the circle.</p>
                <div className="w-64 h-64 bg-gray-200 rounded-full overflow-hidden mx-auto mb-6 relative border-4 border-white shadow-inner">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100"></video>
                    {!isReady && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">Loading AI models...</div>}
                </div>
                <p className="text-lg font-medium h-12">{status}</p>
            </div>
        </div>
    );
};

const Walkthrough: React.FC<{ isActive: boolean; onEnd: () => void }> = ({ isActive, onEnd }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: 'Welcome to the Bonus System!',
            text: 'This quick tour will show you the main features. Click "Next" to begin.',
            target: null,
            position: 'center',
        },
        {
            title: 'Add New Employees',
            text: 'Click here to add a new employee. You can fill out their details and capture their photo for face login.',
            target: '#add-employee-btn',
            position: 'bottom',
        },
        {
            title: 'View Employee Details',
            text: 'Click the view icon on any card to see detailed audit logs and performance charts for that employee.',
            target: '.grid > div:first-child button:nth-child(1)',
            position: 'bottom',
        },
        {
            title: 'All Done!',
            text: 'You now know the basics. You can restart this tour anytime using the help button in the header.',
            target: null,
            position: 'center',
        }
    ];

    const handleEnd = useCallback(() => {
        setStep(0);
        onEnd();
    }, [onEnd]);

    useEffect(() => {
        if (isActive) {
            setStep(0);
        }
    }, [isActive]);
    
    useEffect(() => {
        if (isActive && step >= steps.length) {
            handleEnd();
        }
    }, [isActive, step, steps.length, handleEnd]);

    if (!isActive || step >= steps.length) {
        return null;
    }

    const currentStep = steps[step];
    const targetElement = currentStep.target ? document.querySelector(currentStep.target) : null;
    const targetRect = targetElement?.getBoundingClientRect();

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => s - 1);

    const tooltipStyle: React.CSSProperties = targetRect ? {
        position: 'absolute',
        top: targetRect.bottom + 12,
        left: targetRect.left + targetRect.width / 2,
        transform: 'translateX(-50%)',
        maxWidth: '300px',
        width: 'max-content'
    } : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm">
            {targetElement && (
                <div 
                    className="absolute ring-4 ring-white ring-offset-4 ring-offset-black/60 rounded-lg transition-all duration-300 pointer-events-none" 
                    style={{ 
                        width: targetRect.width + 8, 
                        height: targetRect.height + 8,
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                    }}
                />
            )}
            <div className="bg-gray-800 text-white rounded-xl p-6 shadow-2xl" style={tooltipStyle}>
                <h3 className="text-xl font-bold mb-2">{currentStep.title}</h3>
                <p className="text-gray-300 mb-4">{currentStep.text}</p>
                <div className="flex justify-between items-center">
                    <button onClick={handleEnd} className="text-sm text-gray-400 hover:underline">Skip Tour</button>
                    <div className="flex items-center space-x-2">
                        {step > 0 && <button onClick={handlePrev} className="bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium">Prev</button>}
                        <button onClick={handleNext} className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium">{step === steps.length - 1 ? 'Finish' : 'Next'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- MAIN APP COMPONENT ---
export default function App() {
    const [view, setView] = useState<'dashboard' | 'details' | 'login'>('dashboard');
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toasts, setToasts] = useState<ToastInfo[]>([]);
    const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);

    // Toast logic
    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    
    const generateLogsForEmployee = (employee: Employee) => {
        const newLogs: AuditLog[] = [];
        for (let i = 0; i < 5; i++) { // Generate 5 logs for this employee
            const randomAction = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
            newLogs.push({
                id: `log-${Date.now()}-${i}`,
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                action: randomAction,
                timestamp: new Date(Date.now() - Math.random() * 1000 * 3600 * 24)
            });
        }
        setAuditLogs(prev => [...prev, ...newLogs]);
        addToast(`Generated 5 random audit logs for ${employee.firstName}.`, 'info');
    };

    const contextValue = { employees, setEmployees, auditLogs, setAuditLogs, addToast, generateLogsForEmployee };

    // Handlers
    const handleViewEmployee = (id: string) => {
        setSelectedEmployeeId(id);
        setView('details');
    };
    const handleBackToDashboard = () => {
        setSelectedEmployeeId(null);
        setView('dashboard');
    };
    const handleSaveEmployee = (employee: Employee, newEmbedding: number[] | null) => {
        setEmployees(prev => {
            const existing = prev.find(e => e.id === employee.id);
            if (existing) {
                return prev.map(e => e.id === employee.id ? {...employee, faceEmbedding: newEmbedding || e.faceEmbedding } : e);
            }
            return [...prev, employee];
        });
        addToast(`Employee ${employee.firstName} saved successfully!`, 'success');
        setIsModalOpen(false);
        setEditingEmployee(null);
    };
    const handleDeleteEmployee = (id: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: '#fff',
            customClass: {
                popup: 'rounded-2xl'
            }
        }).then((result: any) => {
            if (result.isConfirmed) {
                setEmployees(prev => prev.filter(e => e.id !== id));
                addToast('Employee deleted.', 'success');
            }
        });
    };
    
    useEffect(() => {
      // Check if it's the first visit to show walkthrough
      const hasVisited = localStorage.getItem('hasVisitedBonusSystem');
      if (!hasVisited) {
        setIsWalkthroughActive(true);
        localStorage.setItem('hasVisitedBonusSystem', 'true');
      }
    }, []);

    const renderView = () => {
        switch (view) {
            case 'login':
                return <FaceLoginView onBack={handleBackToDashboard} onLoginSuccess={emp => {
                    handleViewEmployee(emp.id);
                }} />;
            case 'details':
                return (
                    <>
                        <Header onLoginClick={() => setView('login')} onHelpClick={() => setIsWalkthroughActive(true)} />
                        {selectedEmployeeId && <EmployeeDetails employeeId={selectedEmployeeId} onBack={handleBackToDashboard} />}
                    </>
                );
            case 'dashboard':
            default:
                return (
                    <>
                        <Header onLoginClick={() => setView('login')} onHelpClick={() => setIsWalkthroughActive(true)} />
                        <main>
                            <Dashboard
                                employees={employees}
                                onViewEmployee={handleViewEmployee}
                                onAddEmployee={() => {
                                    setEditingEmployee(null);
                                    setIsModalOpen(true);
                                }}
                                onEditEmployee={emp => {
                                    setEditingEmployee(emp);
                                    setIsModalOpen(true);
                                }}
                                onDeleteEmployee={handleDeleteEmployee}
                            />
                        </main>
                    </>
                );
        }
    };
    
    return (
        <AppContext.Provider value={contextValue}>
            <div className="min-h-screen">
                {renderView()}
                {isModalOpen && <EmployeeFormModal employee={editingEmployee} onClose={() => setIsModalOpen(false)} onSave={handleSaveEmployee} />}
                <ToastContainer toasts={toasts} removeToast={removeToast} />
                <Walkthrough isActive={isWalkthroughActive} onEnd={() => setIsWalkthroughActive(false)} />
            </div>
        </AppContext.Provider>
    );
}
