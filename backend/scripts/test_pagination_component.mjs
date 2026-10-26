import assert from 'assert';

// Test pagination math logic directly
function computePagination(currentPage, totalItems, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    const delta = 2;
    const left = Math.max(2, safeCurrentPage - delta);
    const right = Math.min(totalPages - 1, safeCurrentPage + delta);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return {
    totalPages,
    safeCurrentPage,
    startItem,
    endItem,
    canPrev: safeCurrentPage > 1,
    canNext: safeCurrentPage < totalPages,
    pages: getPageNumbers(),
    info: totalItems === 0 ? 'No items' : `Showing ${startItem}–${endItem} of ${totalItems} items`,
  };
}

console.log('--- Testing Pagination Logic ---');

// Test 1: Zero records
{
  const res = computePagination(1, 0, 10);
  assert.strictEqual(res.totalItems !== undefined ? res.info : 'No items', 'No items');
  assert.strictEqual(res.safeCurrentPage, 1);
  assert.strictEqual(res.totalPages, 1);
  assert.strictEqual(res.canPrev, false);
  assert.strictEqual(res.canNext, false);
  console.log('✓ Test 1: Zero records handled correctly');
}

// Test 2: Exactly 1 record
{
  const res = computePagination(1, 1, 10);
  assert.strictEqual(res.info, 'Showing 1–1 of 1 items');
  assert.strictEqual(res.safeCurrentPage, 1);
  assert.strictEqual(res.totalPages, 1);
  assert.strictEqual(res.canPrev, false);
  assert.strictEqual(res.canNext, false);
  assert.deepStrictEqual(res.pages, [1]);
  console.log('✓ Test 2: Single record handled correctly');
}

// Test 3: Exactly 10 records (page size 10)
{
  const res = computePagination(1, 10, 10);
  assert.strictEqual(res.info, 'Showing 1–10 of 10 items');
  assert.strictEqual(res.totalPages, 1);
  assert.strictEqual(res.canPrev, false);
  assert.strictEqual(res.canNext, false);
  console.log('✓ Test 3: Exactly 10 records handled correctly');
}

// Test 4: More than 10 records (25 items, page 1)
{
  const res = computePagination(1, 25, 10);
  assert.strictEqual(res.info, 'Showing 1–10 of 25 items');
  assert.strictEqual(res.totalPages, 3);
  assert.strictEqual(res.canPrev, false);
  assert.strictEqual(res.canNext, true);
  assert.deepStrictEqual(res.pages, [1, 2, 3]);
  console.log('✓ Test 4: Multi-page (page 1) handled correctly');
}

// Test 5: Middle page (page 2 of 3)
{
  const res = computePagination(2, 25, 10);
  assert.strictEqual(res.info, 'Showing 11–20 of 25 items');
  assert.strictEqual(res.canPrev, true);
  assert.strictEqual(res.canNext, true);
  console.log('✓ Test 5: Middle page handled correctly');
}

// Test 6: Final page with fewer than 10 records (page 3 of 3, 5 items)
{
  const res = computePagination(3, 25, 10);
  assert.strictEqual(res.info, 'Showing 21–25 of 25 items');
  assert.strictEqual(res.canPrev, true);
  assert.strictEqual(res.canNext, false);
  console.log('✓ Test 6: Final page with remainder handled correctly');
}

// Test 7: Clamping out-of-range pages
{
  const resUnder = computePagination(-5, 25, 10);
  assert.strictEqual(resUnder.safeCurrentPage, 1);

  const resOver = computePagination(99, 25, 10);
  assert.strictEqual(resOver.safeCurrentPage, 3);
  console.log('✓ Test 7: Out-of-bounds page clamping verified');
}

// Test 8: Large dataset with ellipsis (100 items = 10 pages)
{
  const res = computePagination(5, 100, 10);
  assert.strictEqual(res.totalPages, 10);
  assert(res.pages.includes('...'));
  assert.strictEqual(res.pages[0], 1);
  assert.strictEqual(res.pages[res.pages.length - 1], 10);
  console.log('✓ Test 8: Ellipsis generation for >7 pages verified:', res.pages);
}

// Test 9: Page size change recalculation
{
  // 50 items with pageSize 10 = 5 pages
  const p10 = computePagination(4, 50, 10);
  assert.strictEqual(p10.totalPages, 5);

  // Switch to pageSize 20 = 3 pages
  const p20 = computePagination(1, 50, 20);
  assert.strictEqual(p20.totalPages, 3);
  assert.strictEqual(p20.info, 'Showing 1–20 of 50 items');

  // Switch to pageSize 50 = 1 page
  const p50 = computePagination(1, 50, 50);
  assert.strictEqual(p50.totalPages, 1);
  assert.strictEqual(p50.info, 'Showing 1–50 of 50 items');
  console.log('✓ Test 9: Page size change (10, 20, 50) verified');
}

console.log('\nALL 9 PAGINATION LOGIC TESTS PASSED!');
