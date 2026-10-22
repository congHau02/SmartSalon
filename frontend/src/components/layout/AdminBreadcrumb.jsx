import React from "react";
import { Link } from "react-router-dom";

export function AdminBreadcrumb({ breadcrumbs = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <React.Fragment key={crumb.label}>
            {idx > 0 && <span className="text-slate-300">/</span>}
            {crumb.to && !isLast ? (
              <Link
                to={crumb.to}
                className="text-slate-500 hover:text-pink-600 transition-colors font-medium"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast ? "text-slate-900 font-semibold" : "text-slate-400 font-normal"
                }
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
