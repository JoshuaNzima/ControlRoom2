import React from 'react';
import IconMapper from '@/Components/IconMapper';

interface ModuleCardProps {
    name: string;
    description: string;
    category: string;
    version: string;
    isActive: boolean;
    isCore: boolean;
    icon: React.ReactNode;
    onToggle: () => void;
    onConfigure?: () => void;
}

export default function ModuleCard({
    name,
    description,
    category,
    version,
    isActive,
    isCore,
    icon,
    onToggle,
    onConfigure,
}: ModuleCardProps) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                {icon}
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {name}
                                {isCore && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Core
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                                <span>{category}</span>
                                <span className="mx-2">&bull;</span>
                                <span>v{version}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isActive ? (
                            <IconMapper name="check-circle" className="h-6 w-6 text-green-500" />
                        ) : (
                            <IconMapper name="x-circle" className="h-6 w-6 text-red-500" />
                        )}
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
                <div className="flex justify-between items-center">
                    <button
                        onClick={onToggle}
                        className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                            isActive
                                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                    >
                        {isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {onConfigure && (
                        <button
                            onClick={onConfigure}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <IconMapper name="settings" className="h-4 w-4 mr-1.5" />
                            Configure
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}