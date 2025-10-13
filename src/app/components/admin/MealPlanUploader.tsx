'use client';

import { useState, useRef } from 'react';
import { Button } from '@/src/app/components/button';
import { uploadMealPlan } from '@/src/app/admin/actions';
import { UploadCloudIcon, FileTextIcon } from 'lucide-react';

interface MealPlanUploaderProps {
    clientId: string;
    onUploadSuccess: () => void;
}

export function MealPlanUploader({ clientId, onUploadSuccess }: MealPlanUploaderProps) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Drag and Drop Handlers ---
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // This is necessary to allow a drop
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setMessage('');
        } else {
            setMessage('Invalid file type. Please upload a PDF.');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setMessage('');
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedFile) {
            setMessage('Please select a file to upload.');
            return;
        }
        setIsSubmitting(true);
        setMessage('');

        const formData = new FormData();
        formData.append('clientId', clientId);
        formData.append('mealPlanFile', selectedFile);

        const result = await uploadMealPlan(formData);
        setMessage(result.message);
        setIsSubmitting(false);

        if (result.success) {
            setSelectedFile(null);
            onUploadSuccess(); // Notify parent component of success
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex justify-center rounded-lg border-2 border-dashed ${isDragging ? 'border-amber-400' : 'border-gray-700'} px-6 py-10 transition-colors cursor-pointer`}
                >
                    <div className="text-center">
                        {selectedFile ? (
                            <div className="flex flex-col items-center">
                                <FileTextIcon className="mx-auto h-12 w-12 text-green-400" />
                                <p className="mt-4 font-semibold text-white">{selectedFile.name}</p>
                                <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                                >
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <>
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-500" />
                                <p className="mt-4 flex text-sm leading-6 text-gray-400">
                                    <span className="font-semibold text-amber-400">Click to upload</span>
                                    <span className="pl-1">or drag and drop</span>
                                </p>
                                <p className="text-xs leading-5 text-gray-500">PDF up to 10MB</p>
                            </>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf"
                        className="hidden"
                    />
                </div>
            </div>

            {message && <p className={`text-center text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
            <div className="text-right">
                <Button type="submit" disabled={isSubmitting || !selectedFile}>
                    {isSubmitting ? 'Uploading...' : 'Upload & Assign'}
                </Button>
            </div>
        </form>
    );
}
