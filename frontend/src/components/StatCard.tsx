const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle = '', iconColor, iconBg, className = "" }: { title: string, value: string | number, icon: any, color?: string, subtitle?: string, iconColor?: string, iconBg?: string, className?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
  };

  const iconStyle = iconColor ? {
    backgroundColor: iconBg || `${iconColor}15`,
    color: iconColor,
    borderColor: iconBg ? 'transparent' : `${iconColor}30`
  } : {};

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-2 md:p-5 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between gap-1.5 md:gap-2">
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[7px] md:text-[11px] text-gray-500 font-bold truncate tracking-wider uppercase leading-none">{title}</p>
          <p className="text-xs md:text-2xl font-black text-gray-900 mt-0.5 leading-none">{value}</p>
          {subtitle && <p className="text-[6px] md:text-xs text-gray-400 mt-0.5 truncate leading-none">{subtitle}</p>}
        </div>
        {Icon && (
          <div 
            className={`w-7 h-7 md:w-[38px] md:h-[38px] flex-shrink-0 rounded-lg md:rounded-[10px] flex items-center justify-center border ${!iconColor ? colors[color] : ''}`}
            style={iconStyle}
          >
            <Icon size={isMobileDevice() ? 12 : 20} className={!iconColor ? "text-[10px] md:text-xl" : ""} />
          </div>
        )}
      </div>
    </div>
  );
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

export default StatCard;
