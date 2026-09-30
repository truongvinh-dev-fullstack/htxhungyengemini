import type { PackagedProduct, ProductStockItem, StockOwnerType } from '../types';

/** Resolve ownership from the package first, then its packaged and source stock. */
export const getPackageOwnership = (pkg: PackagedProduct, stocks: ProductStockItem[]) => {
  const packagedStock = stocks.find((stock) =>
    (stock.packageId === pkg.id || stock.packageCode === pkg.code) && stock.quantity > 0
  ) || stocks.find((stock) => stock.packageId === pkg.id || stock.packageCode === pkg.code);
  const sourceStock = stocks.find((stock) => stock.id === pkg.sourceStockItemId);
  const ownerId = pkg.ownerId || packagedStock?.ownerId || sourceStock?.ownerId;
  const ownerType: StockOwnerType | undefined =
    pkg.ownerType || packagedStock?.ownerType || sourceStock?.ownerType ||
    (ownerId ? (ownerId === pkg.htxId || ownerId === 'htx' ? 'htx' : 'ho_dan') : undefined);

  return {
    ownerType,
    ownerId,
    ownerName: pkg.ownerName || packagedStock?.ownerName || sourceStock?.ownerName,
    // Tồn kho hiện tại có thể đã chuyển từ hộ sang HTX sau khi lô được tạo.
    holderId: packagedStock?.holderId || pkg.holderId || sourceStock?.holderId,
  };
};
