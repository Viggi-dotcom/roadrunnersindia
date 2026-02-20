import { Link } from "react-router";
import { Mountain, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <span className="font-['Oswald'] text-[120px] sm:text-[160px] font-bold text-[#242424] leading-none select-none">
            404
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-['Oswald'] font-bold text-[#F4F4F5] mb-4 -mt-8">
          ROAD <span className="text-[#D85A21]">ENDS HERE</span>
        </h1>
        <p className="text-[#999] text-lg mb-8 max-w-md mx-auto">
          Looks like you've taken a wrong turn. Even the best riders miss a switchback sometimes.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-lg font-bold tracking-wider hover:shadow-[6px_6px_0px_#D85A21] transition-all"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          BACK TO BASE
        </Link>
      </div>
    </div>
  );
}
