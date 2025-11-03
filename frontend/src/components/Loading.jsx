export default function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#ff6b35]/20"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-transparent border-t-[#ff6b35] absolute top-0 left-0"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-transparent border-r-[#0f149a]/40 absolute top-0 left-0" style={{ animationDuration: '1.5s' }}></div>
      </div>
    </div>
  );
}

