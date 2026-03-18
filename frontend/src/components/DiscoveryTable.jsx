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
            <div className="card discovery-table-card" id="discovery-table-card">
                <div className="card__header">
                    <div className="card__title">
                        <span className="card__title-icon" style={{ background: 'rgba(74, 108, 247, 0.1)', color: 'var(--accent)' }}>
                            🔍
                        </span>
                        Searching UniProt…
                    </div>
                </div>
                <div className="card__body">
                    <div className="discovery-table__wrapper">
                        <table className="discovery-table">
                            <thead>
                                <tr>
                                    <th>Accession</th>
                                    <th>Entry Name</th>
                                    <th>Protein Name</th>
                                    <th>Gene</th>
                                    <th>Organism</th>
                                    <th>Length</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="discovery-table__skeleton-row">
                                        <td><div className="skeleton skeleton--text" /></td>
                                        <td><div className="skeleton skeleton--text" /></td>
                                        <td><div className="skeleton skeleton--text skeleton--wide" /></td>
                                        <td><div className="skeleton skeleton--text" /></td>
                                        <td><div className="skeleton skeleton--text" /></td>
                                        <td><div className="skeleton skeleton--text skeleton--narrow" /></td>
                                        <td><div className="skeleton skeleton--btn" /></td>
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
            <div className="card discovery-table-card" id="discovery-table-card">
                <div className="card__header">
                    <div className="card__title">
                        <span className="card__title-icon" style={{ background: 'rgba(74, 108, 247, 0.1)', color: 'var(--accent)' }}>
                            🔍
                        </span>
                        Search Results
                    </div>
                </div>
                <div className="card__body">
                    <div className="discovery-table__empty">
                        <div className="discovery-table__empty-icon">🧪</div>
                        <h3>No Results Found</h3>
                        <p>
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
        <div className="card discovery-table-card" id="discovery-table-card">
            <div className="card__header">
                <div className="card__title">
                    <span className="card__title-icon" style={{ background: 'rgba(74, 108, 247, 0.1)', color: 'var(--accent)' }}>
                        🔍
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
                                <th></th>
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
                                    <td className="discovery-table__length">{row.length}</td>
                                    <td>
                                        <button
                                            className="btn btn--accent btn--sm discovery-table__analyze-btn"
                                            onClick={() => onAnalyze(row.accession)}
                                            id={`analyze-${row.accession}`}
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
                    <div className="discovery-table__pagination">
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                        >
                            ← Previous
                        </button>
                        <span className="discovery-table__page-info">
                            Page {currentPage + 1} of {totalPages}
                        </span>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
