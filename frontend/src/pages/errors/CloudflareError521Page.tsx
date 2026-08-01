// /**
//  * Looks like Cloudflare Error 521 so inactive admins see a
//  * "server configuration" style failure instead of an account message.
//  */
// export default function CloudflareError521Page() {
//   return (
//     <div className="min-h-screen bg-[#f3f3f3] text-[#404040] font-sans">
//       <div className="bg-white border-b border-[#e0e0e0]">
//         <div className="max-w-3xl mx-auto px-6 py-10">
//           <h1 className="text-[32px] sm:text-[40px] font-normal tracking-tight text-[#404040]">
//             Error 521
//           </h1>
//           <p className="text-lg text-[#666] mt-1">Web server is down</p>
//         </div>
//       </div>

//       <div className="max-w-3xl mx-auto px-6 py-12">
//         <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
//           {/* You / Browser */}
//           <div className="flex flex-col items-center w-28">
//             <div className="relative">
//               <svg
//                 width="56"
//                 height="56"
//                 viewBox="0 0 56 56"
//                 fill="none"
//                 aria-hidden
//               >
//                 <rect x="6" y="10" width="44" height="32" rx="3" stroke="#888" strokeWidth="2" fill="#fff" />
//                 <rect x="10" y="16" width="36" height="18" rx="1" fill="#e8e8e8" />
//                 <circle cx="18" cy="38" r="1.5" fill="#888" />
//                 <circle cx="28" cy="38" r="1.5" fill="#888" />
//                 <circle cx="38" cy="38" r="1.5" fill="#888" />
//               </svg>
//               <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00a651] flex items-center justify-center text-white text-xs font-bold">
//                 ✓
//               </span>
//             </div>
//             <p className="mt-3 text-sm text-[#666]">You</p>
//             <p className="text-sm text-[#666]">Browser</p>
//             <p className="text-sm font-medium text-[#00a651]">Working</p>
//           </div>

//           <div className="hidden sm:flex items-center text-[#bbb] px-2" aria-hidden>
//             <span className="text-xl">⇄</span>
//           </div>

//           {/* Cloudflare */}
//           <div className="flex flex-col items-center w-28">
//             <div className="relative">
//               <svg
//                 width="56"
//                 height="56"
//                 viewBox="0 0 56 56"
//                 fill="none"
//                 aria-hidden
//               >
//                 <path
//                   d="M14 34c0-8 6.5-14 14.5-14 5.5 0 10.2 3 12.5 7.5 1-.3 2-.5 3-.5 5 0 9 4 9 9s-4 9-9 9H18c-5.5 0-10-4.5-10-10 0-3.5 1.8-6.6 4.5-8.4"
//                   stroke="#888"
//                   strokeWidth="2"
//                   fill="#fff"
//                 />
//               </svg>
//               <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00a651] flex items-center justify-center text-white text-xs font-bold">
//                 ✓
//               </span>
//             </div>
//             <p className="mt-3 text-sm text-[#666]">Cloudflare</p>
//             <p className="text-sm font-medium text-[#00a651]">Working</p>
//           </div>

//           <div className="hidden sm:flex items-center text-[#bbb] px-2" aria-hidden>
//             <span className="text-xl">⇄</span>
//           </div>

//           {/* Host Error */}
//           <div className="flex flex-col items-center w-28">
//             <div className="relative">
//               <svg
//                 width="56"
//                 height="56"
//                 viewBox="0 0 56 56"
//                 fill="none"
//                 aria-hidden
//               >
//                 <rect x="12" y="8" width="32" height="40" rx="2" stroke="#888" strokeWidth="2" fill="#fff" />
//                 <line x1="16" y1="16" x2="40" y2="16" stroke="#ccc" strokeWidth="2" />
//                 <line x1="16" y1="24" x2="40" y2="24" stroke="#ccc" strokeWidth="2" />
//                 <line x1="16" y1="32" x2="40" y2="32" stroke="#ccc" strokeWidth="2" />
//                 <circle cx="36" cy="40" r="2" fill="#888" />
//               </svg>
//               <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#e53935] flex items-center justify-center text-white text-xs font-bold">
//                 ✕
//               </span>
//             </div>
//             <p className="mt-3 text-sm text-[#666]">Host</p>
//             <p className="text-sm font-medium text-[#e53935]">Error</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }






import React from "react";

export default function Error521Page() {
  const StatusCard = ({
    title,
    subtitle,
    status,
    ok = true,
    icon,
  }: {
    title: string;
    subtitle: string;
    status: string;
    ok: boolean;
    icon: React.ReactNode;
  }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-sm">
          {icon}
        </div>

        <div
          className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {ok ? "✓" : "✕"}
        </div>
      </div>

      <h3 className="mt-4 font-semibold text-gray-800">{title}</h3>

      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}

      <p
        className={`mt-2 text-sm font-semibold ${
          ok ? "text-green-600" : "text-red-600"
        }`}
      >
        {status}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-5xl font-light text-gray-800">
            Error 521
          </h1>

          <p className="text-xl text-gray-500 mt-2">
            Web server is down
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-12 text-center">

          <StatusCard
            title="Browser"
            subtitle="Your connection"
            status="Working"
            ok
            icon={
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="5" width="18" height="12" rx="2" />
                <path d="M8 21h8" />
              </svg>
            }
          />

          <StatusCard
            title="Network"
            subtitle="Edge service"
            status="Working"
            ok
            icon={
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 16a4 4 0 014-4h.5A5.5 5.5 0 0121 13.5 3.5 3.5 0 0117.5 17H7a3 3 0 01-1-5.8" />
              </svg>
            }
          />

          <StatusCard
            title="Origin Server"
            subtitle="Host"
            status="Unavailable"
            ok={false}
            icon={
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            }
          />

        </div>

        {/* Information */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="font-semibold text-gray-800 mb-3">
              What happened?
            </h3>

            <p className="text-gray-600 leading-7">
              The origin server is currently unavailable or refusing
              connections, so the requested page cannot be displayed.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="font-semibold text-gray-800 mb-3">
              If you're visiting
            </h3>

            <p className="text-gray-600 leading-7">
              Please wait a few minutes and try again. The website owner may be
              resolving a temporary issue.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="font-semibold text-gray-800 mb-3">
              If you manage this site
            </h3>

            <p className="text-gray-600 leading-7">
              Verify that your web server is running, accepting incoming
              connections, and that any firewall rules allow traffic.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t mt-16 pt-8 text-center text-gray-500 text-sm space-y-2">
          <p>
            Request ID:
            <span className="font-mono ml-2">
              {Math.random().toString(16).substring(2, 14)}
            </span>
          </p>

          <p>{new Date().toUTCString()}</p>

          <p className="text-gray-400">
            Connection status provided by the edge network.
          </p>
        </div>
      </div>
    </div>
  );
}