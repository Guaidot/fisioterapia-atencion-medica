export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const pages =
    pageCount <= 5 ? Array.from({ length: pageCount }, (_, index) => index + 1) : [];

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-slate-500 sm:text-sm">
        {firstItem}–{lastItem} de {totalItems}
      </span>
      {totalItems > pageSize && (
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 sm:justify-start sm:text-sm">
          <label className="flex items-center gap-2">
            <span>Por página</span>
            <select
              className="input !w-auto !py-1.5 text-xs sm:text-sm"
              aria-label="Elementos por página"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <nav aria-label="Paginación" className="flex items-center justify-center gap-1">
            <button
              type="button"
              className="btn-ghost min-h-9 !px-3 text-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </button>
            {pages.length > 0 ? pages.map((number) => (
              <button
                key={number}
                type="button"
                className={`min-h-9 min-w-9 rounded-lg px-2 text-sm font-medium ${
                  number === page
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                aria-current={number === page ? 'page' : undefined}
                aria-label={`Página ${number}`}
                onClick={() => onPageChange(number)}
              >
                {number}
              </button>
            )) : (
              <span className="px-2 text-sm font-medium text-slate-700">
                Página {page} de {pageCount}
              </span>
            )}
            <button
              type="button"
              className="btn-ghost min-h-9 !px-3 text-sm"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
