export default function DiscoveryTable({
    results,
    totalResults,
    currentPage,
    onPageChange,
    onAnalyze,
    isLoading,
    searchQuery,
    pageSize,
}) {
    const totalPages = Math.max(1, Math.ceil(totalResults / (pageSize || 25)));

    // Skeleton rows for loading state
    if (isLoading) {
        return (
            <div className="card discovery-table-card" id="discovery-table-card" role="region" aria-label="Search results table (loading)">
                <div className="card__header">
                    <div className="card__title">
                        <span className="card__title-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                            <span aria-hidden="true">🔍</span>
                        </span>
                        Searching UniProt…
                    </div>
                </div>
                <div className="card__body" aria-busy="true" aria-label="Loading search results">
                    <div className="discovery-table__wrapper">
                        <table className="discovery-table" role="table">
                            <thead>
                                <tr role="row">
                                    <th role="columnheader">Accession</th>
                                    <th role="columnheader">Entry Name</th>
                                    <th role="columnheader">Protein Name</th>
                                    <th role="columnheader">Gene</th>
                                    <th role="columnheader">Organism</th>
                                    <th role="columnheader">Length</th>
                                    <th role="columnheader"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="discovery-table__skeleton-row" role="row">
                                        <td role="cell"><div className="skeleton skeleton--text" /></td>
                                        <td role="cell"><div className="skeleton skeleton--text" /></td>
                                        <td role="cell"><div className="skeleton skeleton--text skeleton--wide" /></td>
                                        <td role="cell"><div className="skeleton skeleton--text" /></td>
                                        <td role="cell"><div className="skeleton skeleton--text" /></td>
                                        <td role="cell"><div className="skeleton skeleton--text skeleton--narrow" /></td>
                                        <td role="cell"><div className="skeleton skeleton--btn" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (!results || results.length === 0) {
        return (
            <div className="card discovery-table-card" id="discovery-table-card" role="region" aria-label="Search results table (empty)">
                <div className="card__header">
                    <div className="card__title">
                        <span className="card__title-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                            <span aria-hidden="true">🔍</span>
                        </span>
                        Search Results
                    </div>
                </div>
                <div className="card__body">
                    <div className="discovery-table__empty">
                        <div className="discovery-table__empty-icon" aria-hidden="true">🧪</div>
                        <h3>No Results Found</h3>
                        <p role="status">
                            No proteins matched <strong>"{searchQuery}"</strong> with your current filters.
                        </p>
                        <div className="discovery-table__suggestions">
                            <span className="discovery-table__suggestions-title">💡 Search Suggestions</span>
                            <ul>
                                <li>Try unchecking <strong>"Reviewed Only"</strong> to include unreviewed (TrEMBL) entries</li>
                                <li>Change the <strong>Organism</strong> filter to "Any"</li>
                                <li>Increase the <strong>Length</strong> range to include longer proteins</li>
                                <li>Check for typos or use a different protein/gene name</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card discovery-table-card" id="discovery-table-card" role="region" aria-label="Search results table">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <span aria-hidden="true">🔍</span>
                    </span>
                    Discovery Table
                    <span className="discovery-table__count">{totalResults.toLocaleString()} results</span>
                </div>
            </div>
            <div className="card__body">
                <div className="discovery-table__wrapper">
                    <table className="discovery-table" id="discovery-results-table">
                        <thead>
                            <tr>
                                <th>Accession</th>
                                <th>Entry Name</th>
                                <th>Protein Name</th>
                                <th>Gene</th>
                                <th>Organism</th>
                                <th>Length</th>
                                <th><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((row) => (
                                <tr key={row.accession} className="discovery-table__row" id={`result-${row.accession}`}>
                                    <td>
                                        <span className="discovery-table__accession">{row.accession}</span>
                                    </td>
                                    <td className="discovery-table__entry-name">{row.entryName}</td>
                                    <td className="discovery-table__protein-name" title={row.proteinName}>
                                        {row.proteinName || '—'}
                                    </td>
                                    <td className="discovery-table__gene">{row.geneName || '—'}</td>
                                    <td>
                                        <span className="discovery-table__organism">{row.organism}</span>
                                    </td>
                                    <td className="discovery-table__length">{row.length != null ? row.length.toLocaleString() : '—'}</td>
                                    <td>
                                        <button
                                            className="btn btn--accent btn--sm discovery-table__analyze-btn"
                                            onClick={() => onAnalyze(row.accession)}
                                            id={`analyze-${row.accession}`}
                                            aria-label={`Analyze protein ${row.accession}`}
                                        >
                                            Analyze →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav className="discovery-table__pagination" aria-label="Results pagination">
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            aria-label="Previous page"
                        >
                            ← Previous
                        </button>
                        <span className="discovery-table__page-info" aria-live="polite">
                            Page {currentPage + 1} of {totalPages}
                        </span>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                            aria-label="Next page"
                        >
                            Next →
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}
