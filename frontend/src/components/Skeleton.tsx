import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rect', 
  width, 
  height 
}) => {
  const baseClass = "animate-pulse bg-gray-200";
  const variantClass = variant === 'circle' ? 'rounded-full' : 'rounded-md';
  
  return (
    <div 
      className={`${baseClass} ${variantClass} ${className}`} 
      style={{ width, height }}
    />
  );
};

export const DashboardSkeleton = () => (
  <div className="p-4 md:p-8 space-y-6 bg-[#F0F2F5] min-h-screen">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="space-y-2">
        <Skeleton height={32} width={300} className="bg-white/50" />
        <Skeleton height={16} width={200} className="bg-white/50" />
      </div>
      <div className="hidden md:block">
        <Skeleton height={44} width={180} className="rounded-xl bg-white/50" />
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton height={12} width="60%" className="bg-gray-100" />
            <Skeleton height={24} width="40%" className="bg-gray-100" />
          </div>
          <Skeleton height={48} width={48} className="rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>

    {/* Charts & Lists Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-8">
            <Skeleton height={24} width={200} className="bg-gray-100" />
            <Skeleton height={32} width={100} className="rounded-xl bg-gray-100" />
          </div>
          <Skeleton height={350} className="w-full bg-gray-50/50 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <Skeleton height={20} width={150} className="mb-6 bg-gray-100" />
              <Skeleton height={280} className="w-full bg-gray-50/50 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-8">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Skeleton height={20} width={150} className="mb-6 bg-gray-100" />
            <div className="space-y-4">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                  <Skeleton height={40} width={40} className="rounded-xl bg-white" />
                  <div className="flex-1 space-y-2">
                    <Skeleton height={12} width="70%" className="bg-white" />
                    <Skeleton height={10} width="40%" className="bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SidebarSkeleton = () => (
  <div className="h-full w-60 bg-[#002B5B] flex flex-col">
    <div className="h-16 flex items-center px-5 border-b border-white/5">
      <Skeleton height={24} width={120} className="bg-white/10" />
    </div>
    <div className="flex-1 px-2 pt-3 space-y-6">
      {[1, 2, 3].map(section => (
        <div key={section} className="space-y-2">
          <div className="px-4">
            <Skeleton height={8} width={60} className="bg-white/5 mb-4" />
          </div>
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <Skeleton height={18} width={18} className="bg-white/10" />
              <Skeleton height={12} width="60%" className="bg-white/10" />
            </div>
          ))}
        </div>
      ))}
    </div>
    <div className="p-3 border-t border-white/10 space-y-2">
      <div className="flex items-center gap-3 px-2 py-2">
        <Skeleton height={18} width={18} className="bg-white/10" />
        <Skeleton height={12} width="100" className="bg-white/10" />
      </div>
      <div className="flex items-center gap-3 px-2 py-2">
        <Skeleton height={18} width={18} className="bg-white/10" />
        <Skeleton height={12} width="100" className="bg-white/10" />
      </div>
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="p-4 space-y-4">
    <Skeleton height={40} width="60%" className="mb-6" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} height={60} className="w-full" />
      ))}
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="p-6 space-y-6 bg-white rounded-xl">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton height={15} width="30%" />
          <Skeleton height={45} className="w-full" />
        </div>
      ))}
    </div>
    <div className="flex justify-end gap-3 mt-8">
      <Skeleton height={40} width={100} />
      <Skeleton height={40} width={120} />
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="p-4 md:p-8 space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="space-y-2">
        <Skeleton height={32} width={250} className="bg-white/50" />
        <Skeleton height={16} width={180} className="bg-white/50" />
      </div>
      <Skeleton height={44} width={150} className="rounded-xl bg-white/50" />
    </div>

    {/* Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" height={40} width={40} className="bg-gray-100" />
            <div className="space-y-2 flex-1">
              <Skeleton height={14} width="60%" className="bg-gray-100" />
              <Skeleton height={10} width="40%" className="bg-gray-100" />
            </div>
            <Skeleton height={20} width={60} className="rounded-full bg-gray-100" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton height={10} width="30%" className="bg-gray-100" />
            <Skeleton height={14} width="80%" className="bg-gray-100" />
          </div>
          <div className="space-y-2">
            <Skeleton height={10} width="25%" className="bg-gray-100" />
            <Skeleton height={30} className="w-full bg-gray-100 rounded-xl" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton height={36} className="flex-1 bg-gray-50 rounded-xl" />
            <Skeleton height={36} className="flex-1 bg-gray-50 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="p-4 md:p-8 space-y-6">
    <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="space-y-2">
        <Skeleton height={32} width={250} className="bg-gray-200/50" />
        <Skeleton height={16} width={180} className="bg-gray-200/50" />
      </div>
      <Skeleton height={44} width={150} className="rounded-xl bg-gray-200/50" />
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <div className="grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} height={12} className="bg-gray-100" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-6 grid grid-cols-6 gap-4 items-center">
            <Skeleton height={16} className="bg-gray-50/80" />
            <div className="space-y-2">
              <Skeleton height={14} width="70%" className="bg-gray-50/80" />
              <Skeleton height={10} width="40%" className="bg-gray-50/80" />
            </div>
            <Skeleton height={14} className="bg-gray-50/80" />
            <div className="flex justify-center">
              <Skeleton height={24} width={80} className="rounded-full bg-gray-50/80" />
            </div>
            <Skeleton height={14} className="bg-gray-50/80" />
            <div className="flex justify-end gap-2">
              <Skeleton height={32} width={32} className="rounded-lg bg-gray-50/80" />
              <Skeleton height={32} width={32} className="rounded-lg bg-gray-50/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
