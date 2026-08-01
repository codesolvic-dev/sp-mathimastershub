import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getSpEcomSubPage } from "@/landings/tertiary/ecomSubPages";

/** Detail view for sub-pages without a section builder (Shop, About, Contact) */
export default function SpEcomSubPageView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const page = getSpEcomSubPage(slug);

  if (!page) {
    return (
      <div className="max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/developer/sp-ecom")}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sp - eCom
        </button>
        <p className="text-gray-600">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        type="button"
        onClick={() => navigate("/developer/sp-ecom")}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sp - eCom
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
          <h1 className="text-2xl font-bold theme-heading">{page.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{page.subInfo}</p>
        </div>
        <div className="px-6 py-8 space-y-4">
          <p className="text-sm text-gray-600">
            Public URL:{" "}
            <a href={page.publicPath} target="_blank" rel="noreferrer" className="theme-text-primary underline">
              {page.publicPath}
            </a>
          </p>
          <p className="text-sm text-gray-500">
            Section builder for this page is coming soon. Manage content via Web Pages or the relevant admin screen.
          </p>
          <span className="inline-block text-xs text-gray-400">Visible on site</span>
        </div>
      </div>
    </div>
  );
}
